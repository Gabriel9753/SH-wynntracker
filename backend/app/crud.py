from datetime import datetime
from typing import Optional

from app import models, schemas
from sqlalchemy.orm import Session

STATS_COMPARE_FIELDS = [
    "level",
    "total_level",
    "xp",
    "xp_percent",
    "playtime_hours",
    "mobs_killed",
    "chests_found",
    "blocks_walked",
    "items_identified",
    "logins",
    "deaths",
    "discoveries",
    "content_completion",
    "wars",
    "pvp_kills",
    "pvp_deaths",
    "dungeons_total",
    "raids_total",
    "world_events",
    "caves",
    "lootruns",
    "quests_count",
    "skill_points",
    "professions",
    "dungeons",
    "raids",
    "quests_list",
]


def get_player(db: Session, player_uuid: str) -> Optional[models.Player]:
    return db.query(models.Player).filter(models.Player.uuid == player_uuid).first()


def get_all_players(db: Session) -> list[models.Player]:
    return db.query(models.Player).all()


def create_player(db: Session, player: schemas.PlayerCreate) -> models.Player:
    db_player = models.Player(**player.model_dump())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


def get_or_create_player(db: Session, player_data: dict) -> models.Player:
    player = get_player(db, player_data["uuid"])
    if player:
        player.username = player_data.get("username", player.username)
        player.rank = player_data.get("rank", player.rank)
        player.playtime_total_days = player_data.get("playtime_total_days", player.playtime_total_days)
        player.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(player)
        return player
    return create_player(db, schemas.PlayerCreate(**player_data))


def get_character(db: Session, character_uuid: str) -> Optional[models.Character]:
    return db.query(models.Character).filter(models.Character.uuid == character_uuid).first()


def get_all_characters(db: Session) -> list[models.Character]:
    return db.query(models.Character).all()


def search_characters(db: Session, query: str) -> list[models.Character]:
    search = f"%{query}%"
    return (
        db.query(models.Character)
        .join(models.Player)
        .filter(
            (models.Player.username.ilike(search))
            | (models.Character.nickname.ilike(search))
            | (models.Character.type.ilike(search))
        )
        .all()
    )


def create_character(db: Session, character: schemas.CharacterCreate) -> models.Character:
    db_character = models.Character(**character.model_dump())
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    return db_character


def get_or_create_character(db: Session, character_data: dict) -> models.Character:
    character = get_character(db, character_data["uuid"])
    if character:
        character.type = character_data.get("type", character.type)
        character.nickname = character_data.get("nickname", character.nickname)
        character.gamemodes = character_data.get("gamemodes", character.gamemodes)
        db.commit()
        db.refresh(character)
        return character
    return create_character(db, schemas.CharacterCreate(**character_data))


def delete_character(db: Session, character_uuid: str) -> bool:
    character = get_character(db, character_uuid)
    if character:
        db.delete(character)
        db.commit()
        return True
    return False


def update_character_last_fetched(db: Session, character_uuid: str) -> None:
    character = get_character(db, character_uuid)
    if character:
        character.last_fetched_at = datetime.utcnow()
        db.commit()


def get_latest_stats(db: Session, character_uuid: str) -> Optional[models.CharacterStats]:
    return (
        db.query(models.CharacterStats)
        .filter(models.CharacterStats.character_uuid == character_uuid)
        .order_by(models.CharacterStats.valid_from.desc())
        .first()
    )


def get_stats_history(
    db: Session, character_uuid: str, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None
) -> list[models.CharacterStats]:
    query = db.query(models.CharacterStats).filter(models.CharacterStats.character_uuid == character_uuid)
    if from_date:
        query = query.filter(models.CharacterStats.valid_from >= from_date)
    if to_date:
        query = query.filter(models.CharacterStats.valid_from <= to_date)
    return query.order_by(models.CharacterStats.valid_from.asc()).all()


def stats_changed(old_stats: Optional[models.CharacterStats], new_stats: dict) -> bool:
    if old_stats is None:
        return True
    for field in STATS_COMPARE_FIELDS:
        old_val = getattr(old_stats, field, None)
        new_val = new_stats.get(field)
        if old_val != new_val:
            return True
    return False


def create_stats_if_changed(db: Session, character_uuid: str, stats_data: dict) -> Optional[models.CharacterStats]:
    latest = get_latest_stats(db, character_uuid)

    if not stats_changed(latest, stats_data):
        return None

    if latest and latest.valid_until is None:
        latest.valid_until = datetime.utcnow()
        db.commit()

    db_stats = models.CharacterStats(
        character_uuid=character_uuid,
        valid_from=datetime.utcnow(),
        **{k: v for k, v in stats_data.items() if k in STATS_COMPARE_FIELDS},
    )
    db.add(db_stats)
    db.commit()
    db.refresh(db_stats)
    return db_stats
