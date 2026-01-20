import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from app import crud, schemas
from app.database import get_db
from app.services import wynncraft_api
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api", tags=["players"])


@router.get("/players", response_model=list[schemas.PlayerRead])
def get_all_players(db: Session = Depends(get_db)):
    return crud.get_all_players(db)


@router.get("/players/{uuid}", response_model=schemas.PlayerWithCharacters)
def get_player(uuid: str, db: Session = Depends(get_db)):
    player = crud.get_player(db, uuid)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.get("/characters", response_model=list[schemas.CharacterRead])
def get_all_characters(search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if search:
        return crud.search_characters(db, search)
    return crud.get_all_characters(db)


@router.get("/characters/{uuid}", response_model=schemas.CharacterWithStats)
def get_character(uuid: str, db: Session = Depends(get_db)):
    character = crud.get_character(db, uuid)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    current_stats = crud.get_latest_stats(db, uuid)

    is_recently_active = False
    threshold_minutes = int(os.getenv("ONLINE_THRESHOLD_MINUTES", "15"))
    if current_stats and current_stats.valid_from:
        valid_from = current_stats.valid_from
        if valid_from.tzinfo is None:
            valid_from = valid_from.replace(tzinfo=timezone.utc)
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=threshold_minutes)
        is_recently_active = valid_from >= cutoff

    return schemas.CharacterWithStats(
        uuid=character.uuid,
        player_uuid=character.player_uuid,
        type=character.type,
        nickname=character.nickname,
        gamemodes=character.gamemodes,
        last_fetched_at=character.last_fetched_at,
        created_at=character.created_at,
        player=character.player,
        current_stats=current_stats,
        is_recently_active=is_recently_active,
    )


@router.post("/characters", response_model=schemas.CharacterRead)
def add_character(request: schemas.AddCharacterRequest, db: Session = Depends(get_db)):
    parsed = wynncraft_api.parse_wynncraft_url(request.url)
    if not parsed:
        raise HTTPException(status_code=400, detail="Invalid Wynncraft URL")

    player_uuid, character_uuid = parsed

    existing = crud.get_character(db, character_uuid)
    if existing:
        raise HTTPException(status_code=409, detail="Character already exists")

    api_data = wynncraft_api.fetch_player_data(player_uuid)
    if not api_data:
        raise HTTPException(status_code=502, detail="Failed to fetch from Wynncraft API")

    player_data = wynncraft_api.extract_player_data(api_data)
    player_data["uuid"] = player_uuid
    crud.get_or_create_player(db, player_data)

    char_data = wynncraft_api.extract_character_data(player_uuid, character_uuid, api_data)
    if not char_data:
        raise HTTPException(status_code=404, detail="Character not found in API response")

    character = crud.create_character(db, schemas.CharacterCreate(**char_data))

    stats_data = wynncraft_api.extract_character_stats(character_uuid, api_data)
    if stats_data:
        crud.create_stats_if_changed(db, character_uuid, stats_data)

    meta_data = wynncraft_api.extract_character_meta(character_uuid, api_data)
    if meta_data:
        crud.get_or_create_meta(db, character_uuid, meta_data)

    crud.update_character_last_fetched(db, character_uuid)

    return character


@router.delete("/characters/{uuid}")
def delete_character(uuid: str, db: Session = Depends(get_db)):
    if not crud.delete_character(db, uuid):
        raise HTTPException(status_code=404, detail="Character not found")
    return {"message": "Character deleted"}
