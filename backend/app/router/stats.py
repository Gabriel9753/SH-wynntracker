from datetime import datetime
from typing import Optional

from app import crud, schemas
from app.database import get_db
from app.services.tracker import fetch_and_update_character
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/{character_uuid}", response_model=schemas.CharacterStatsRead)
def get_current_stats(character_uuid: str, db: Session = Depends(get_db)):
    character = crud.get_character(db, character_uuid)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    stats = crud.get_latest_stats(db, character_uuid)
    if not stats:
        raise HTTPException(status_code=404, detail="No stats found")

    return stats


@router.get("/{character_uuid}/history", response_model=list[schemas.CharacterStatsRead])
def get_stats_history(
    character_uuid: str,
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    character = crud.get_character(db, character_uuid)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    return crud.get_stats_history(db, character_uuid, from_date, to_date)


@router.post("/fetch")
def fetch_all_stats(db: Session = Depends(get_db)):
    characters = crud.get_all_characters(db)
    results = []

    for character in characters:
        success = fetch_and_update_character(db, character)
        results.append({"character_uuid": character.uuid, "success": success})

    return {"results": results}
