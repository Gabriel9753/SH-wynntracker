import asyncio
import logging
from datetime import datetime, timedelta

from app import crud
from app.database import SessionLocal
from app.services import wynncraft_api
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import os

FETCH_INTERVAL_MINUTES = int(os.getenv("FETCH_INTERVAL_MINUTES", 15))
CHECK_INTERVAL_SECONDS = 60


def should_fetch(last_fetched_at: datetime | None) -> bool:
    if last_fetched_at is None:
        return True

    now = datetime.now()
    elapsed = now - last_fetched_at

    # If last fetch is in the future (e.g. migration timezone mismatch), fetch immediately
    if elapsed.total_seconds() < 0:
        logger.warning(f"Future timestamp detected ({last_fetched_at} > {now}), forcing fetch.")
        return True

    should = elapsed >= timedelta(minutes=FETCH_INTERVAL_MINUTES)
    logger.debug(
        f"Checking fetch: Last: {last_fetched_at}, Now: {now}, Elapsed: {elapsed}, Interval: {FETCH_INTERVAL_MINUTES}m -> {should}"
    )
    return should


def time_until_next_fetch(last_fetched_at: datetime | None) -> timedelta:
    if last_fetched_at is None:
        return timedelta(seconds=0)
    next_fetch = last_fetched_at + timedelta(minutes=FETCH_INTERVAL_MINUTES)
    remaining = next_fetch - datetime.now()
    return max(remaining, timedelta(seconds=0))


def fetch_and_update_character(db: Session, character) -> bool:
    player_uuid = character.player_uuid
    character_uuid = character.uuid

    api_data = wynncraft_api.fetch_player_data(player_uuid)
    if not api_data:
        logger.warning(f"Failed to fetch data for player {player_uuid}")
        return False

    player_data = wynncraft_api.extract_player_data(api_data)
    player_data["uuid"] = player_uuid
    crud.get_or_create_player(db, player_data)

    char_data = wynncraft_api.extract_character_data(player_uuid, character_uuid, api_data)
    if not char_data:
        logger.warning(f"Character {character_uuid} not found in API response")
        return False

    stats_data = wynncraft_api.extract_character_stats(character_uuid, api_data)

    new_stats = crud.create_stats_if_changed(db, character_uuid, stats_data)
    if new_stats:
        logger.info(f"New stats saved for {character.player.username} ({character.type})")
    else:
        logger.info(f"No changes for {character.player.username} ({character.type})")

    crud.update_character_last_fetched(db, character_uuid)
    return True


async def run_tracker():
    logger.info("Starting tracker service")

    while True:
        try:
            db = SessionLocal()
            characters = crud.get_all_characters(db)

            for character in characters:
                if should_fetch(character.last_fetched_at):
                    fetch_and_update_character(db, character)
                else:
                    remaining = time_until_next_fetch(character.last_fetched_at)
                    logger.debug(f"Skipping {character.uuid}, next fetch in {remaining}")

            db.close()
        except Exception as e:
            logger.error(f"Tracker error: {e}")

        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


def start_tracker_background():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run_tracker())
