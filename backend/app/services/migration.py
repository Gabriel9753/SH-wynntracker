import os
from datetime import datetime
from pathlib import Path

import pandas as pd
from app import crud, models
from app.database import Base, SessionLocal, engine
from sqlalchemy.orm import Session


def check_and_run_migration():
    """
    Checks if migration is needed (DB is empty and parquet file exists)
    and runs it if so.
    """
    parquet_path = os.getenv("PARQUET_MIGRATION_PATH")
    if not parquet_path:
        return

    parquet_file = Path(parquet_path)
    if not parquet_file.exists():
        print(f"Parquet migration file not found at {parquet_path}, skipping.")
        return

    # Check if DB is empty (checking players table is enough)
    db = SessionLocal()
    try:
        player_count = db.query(models.Player).count()
        if player_count > 0:
            print("Database is not empty, skipping migration.")
            return

        print(f"Database empty. Starting migration from {parquet_path}...")
        migrate_parquet(str(parquet_file), db)
    finally:
        db.close()


def migrate_parquet(parquet_path: str, db: Session):
    print(f"Loading parquet from {parquet_path}")
    df = pd.read_parquet(parquet_path)

    print(f"Found {len(df)} rows")

    if df.empty:
        print("Parquet file is empty. Skipping migration.")
        return

    required_columns = ["player_uuid", "character_uuid"]
    missing_columns = [col for col in required_columns if col not in df.columns]

    if missing_columns:
        print(f"Parquet file missing required columns: {missing_columns}. Skipping migration.")
        print(f"Available columns: {list(df.columns)}")
        return

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    players_created = 0
    characters_created = 0
    stats_created = 0

    grouped = df.groupby(["player_uuid", "character_uuid"])

    for (player_uuid, character_uuid), group in grouped:
        group = group.sort_values("timestamp")
        first_row = group.iloc[0]

        player_data = {
            "uuid": player_uuid,
            "username": first_row.get("username", "Unknown"),
            "rank": first_row.get("rank"),
            "playtime_total_days": first_row.get("playtime_total_days"),
        }

        first_join = first_row.get("firstJoin")
        if pd.notna(first_join):
            try:
                # Handle numpy datetime64 or string
                ts = str(first_join).replace("Z", "+00:00")
                player_data["first_join"] = datetime.fromisoformat(ts)
            except:
                pass

        crud.get_or_create_player(db, player_data)
        players_created += 1

        gamemodes = first_row.get("gamemodes")
        char_data = {
            "uuid": character_uuid,
            "player_uuid": player_uuid,
            "type": first_row.get("character_type"),
            "nickname": first_row.get("nickname"),
            "gamemodes": gamemodes if pd.notna(gamemodes) else None,
        }
        crud.get_or_create_character(db, char_data)
        characters_created += 1

        prev_stats = None
        for idx, row in group.iterrows():
            skill_points = {}
            professions = {}
            dungeons = {}
            raids = {}

            for col in group.columns:
                if col.startswith("sp_"):
                    skill_name = col[3:]
                    val = row.get(col)
                    if pd.notna(val):
                        skill_points[skill_name] = int(val)
                elif col.startswith("prof_") and col.endswith("_level"):
                    prof_name = col[5:-6]
                    level_val = row.get(col)
                    xp_val = row.get(f"prof_{prof_name}_xp")
                    if pd.notna(level_val):
                        professions[prof_name] = {
                            "level": int(level_val),
                            "xpPercent": float(xp_val) if pd.notna(xp_val) else None,
                        }
                elif col.startswith("dung_"):
                    dung_name = col[5:]
                    val = row.get(col)
                    if pd.notna(val):
                        dungeons[dung_name] = int(val)
                elif col.startswith("raid_"):
                    raid_name = col[5:]
                    val = row.get(col)
                    if pd.notna(val):
                        raids[raid_name] = int(val)

            quests_list = row.get("quests_list")

            stats_data = {
                "level": int(row["level"]) if pd.notna(row.get("level")) else None,
                "total_level": int(row["totalLevel"]) if pd.notna(row.get("totalLevel")) else None,
                "xp": int(row["xp"]) if pd.notna(row.get("xp")) else None,
                "xp_percent": float(row["xpPercent"]) if pd.notna(row.get("xpPercent")) else None,
                "playtime_hours": float(row["playtime_hours"]) if pd.notna(row.get("playtime_hours")) else None,
                "mobs_killed": int(row["mobsKilled"]) if pd.notna(row.get("mobsKilled")) else None,
                "chests_found": int(row["chestsFound"]) if pd.notna(row.get("chestsFound")) else None,
                "blocks_walked": int(row["blocksWalked"]) if pd.notna(row.get("blocksWalked")) else None,
                "items_identified": int(row["itemsIdentified"]) if pd.notna(row.get("itemsIdentified")) else None,
                "logins": int(row["logins"]) if pd.notna(row.get("logins")) else None,
                "deaths": int(row["deaths"]) if pd.notna(row.get("deaths")) else None,
                "discoveries": int(row["discoveries"]) if pd.notna(row.get("discoveries")) else None,
                "content_completion": int(row["contentCompletion"]) if pd.notna(row.get("contentCompletion")) else None,
                "wars": int(row["wars"]) if pd.notna(row.get("wars")) else None,
                "pvp_kills": int(row["pvp_kills"]) if pd.notna(row.get("pvp_kills")) else None,
                "pvp_deaths": int(row["pvp_deaths"]) if pd.notna(row.get("pvp_deaths")) else None,
                "dungeons_total": int(row["dungeons_total"]) if pd.notna(row.get("dungeons_total")) else None,
                "raids_total": int(row["raids_total"]) if pd.notna(row.get("raids_total")) else None,
                "world_events": int(row["worldEvents"]) if pd.notna(row.get("worldEvents")) else None,
                "caves": int(row["caves"]) if pd.notna(row.get("caves")) else None,
                "lootruns": int(row["lootruns"]) if pd.notna(row.get("lootruns")) else None,
                "quests_count": int(row["quests_count"]) if pd.notna(row.get("quests_count")) else None,
                "skill_points": skill_points if skill_points else None,
                "professions": professions if professions else None,
                "dungeons": dungeons if dungeons else None,
                "raids": raids if raids else None,
                "quests_list": quests_list if pd.notna(quests_list) else None,
            }

            changed = crud.stats_changed(prev_stats, stats_data)

            if changed:
                timestamp = row.get("timestamp")
                valid_from = datetime.fromisoformat(str(timestamp)) if pd.notna(timestamp) else datetime.utcnow()

                if prev_stats and prev_stats.valid_until is None:
                    prev_stats.valid_until = valid_from
                    db.commit()

                db_stats = models.CharacterStats(
                    character_uuid=character_uuid,
                    valid_from=valid_from,
                    **{k: v for k, v in stats_data.items() if k in crud.STATS_COMPARE_FIELDS},
                )
                db.add(db_stats)
                db.commit()
                db.refresh(db_stats)
                prev_stats = db_stats
                stats_created += 1

        last_timestamp = group.iloc[-1].get("timestamp")
        character = crud.get_character(db, character_uuid)
        if pd.notna(last_timestamp) and character:
            character.last_fetched_at = datetime.fromisoformat(str(last_timestamp))
            db.commit()

        print(f"  Migrated {player_data['username']} ({char_data['type']})")

    print("\nMigration complete:")
    print(f"  Players: {players_created}")
    print(f"  Characters: {characters_created}")
    print(f"  Stats entries: {stats_created}")
