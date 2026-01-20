import json
import os
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pandas as pd
import requests


def parse_wynncraft_url(url: str) -> tuple[str, str] | None:
    try:
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.split("/")

        if "player" in path_parts:
            player_idx = path_parts.index("player")
            if player_idx + 1 < len(path_parts):
                player_uuid = path_parts[player_idx + 1]
            else:
                return None
        else:
            return None

        query_params = parse_qs(parsed_url.query)
        character_uuid = query_params.get("character", [None])[0]

        if player_uuid and character_uuid:
            return (player_uuid, character_uuid)
        return None
    except Exception as e:
        print(f"Error parsing URL: {e}")
        return None


class WynnCharacterTracker:
    def __init__(self, player_uuid: str, character_uuid: str, shared_df: pd.DataFrame = None):
        self.player_uuid = player_uuid
        self.character_uuid = character_uuid
        self.api_url = f"https://api.wynncraft.com/v3/player/{player_uuid}?fullResult"
        self.df = shared_df if shared_df is not None else pd.DataFrame()

    def fetch_player_data(self) -> dict | None:
        try:
            response = requests.get(self.api_url)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to fetch data. Status code: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error fetching data: {e}")
            return None

    def extract_character_stats(self, player_data: dict, fetch_timestamp: str = None) -> dict:
        if fetch_timestamp is None:
            fetch_timestamp = datetime.now().isoformat()

        character = player_data["characters"].get(self.character_uuid)
        if not character:
            print(f"Character {self.character_uuid} not found")
            return None

        stats = {
            "fetch_timestamp": fetch_timestamp,
            "timestamp": datetime.now().isoformat(),
            "player_uuid": self.player_uuid,
            "character_uuid": self.character_uuid,
            "username": player_data["username"],
            "lastJoin": player_data.get("lastJoin"),
            "playtime_total_days": player_data.get("playtime"),
            "rank": player_data.get("rank"),
            "firstJoin": player_data.get("firstJoin"),
            # Character-specific stats
            "character_type": character.get("type"),
            "nickname": character.get("nickname"),
            "level": character.get("level"),
            "totalLevel": character.get("totalLevel"),
            "xp": character.get("xp"),
            "xpPercent": character.get("xpPercent"),
            "playtime_hours": character.get("playtime"),
            # Activity stats
            "mobsKilled": character.get("mobsKilled"),
            "chestsFound": character.get("chestsFound"),
            "blocksWalked": character.get("blocksWalked"),
            "itemsIdentified": character.get("itemsIdentified"),
            "logins": character.get("logins"),
            "deaths": character.get("deaths"),
            "discoveries": character.get("discoveries"),
            "contentCompletion": character.get("contentCompletion"),
            "wars": character.get("wars"),
            # pvP stats
            "pvp_kills": character.get("pvp", {}).get("kills"),
            "pvp_deaths": character.get("pvp", {}).get("deaths"),
            # Dungeon/Raid/Event stats
            "dungeons_total": character.get("dungeons", {}).get("total"),
            "raids_total": character.get("raids", {}).get("total"),
            "worldEvents": character.get("worldEvents"),
            "caves": character.get("caves"),
            "lootruns": character.get("lootruns"),
            "quests_count": len(character.get("quests", [])),
            "gamemode_count": len(character.get("gamemode", [])),
        }

        gamemodes = character.get("gamemode", [])
        stats["gamemodes"] = ";".join(gamemodes) if gamemodes else None

        skill_points = character.get("skillPoints", {})
        for skill, value in skill_points.items():
            stats[f"sp_{skill}"] = value

        professions = character.get("professions", {})
        for prof, data in professions.items():
            stats[f"prof_{prof}_level"] = data.get("level")
            stats[f"prof_{prof}_xp"] = data.get("xpPercent")

        dungeons_list = character.get("dungeons", {}).get("list", {})
        for dungeon_name, count in dungeons_list.items():
            col_name = f"dung_{dungeon_name.lower().replace(' ', '_').replace('-', '_')}"
            stats[col_name] = count

        raids_list = character.get("raids", {}).get("list", {})
        for raid_name, count in raids_list.items():
            col_name = f"raid_{raid_name.lower().replace(' ', '_').replace('-', '_')}"
            stats[col_name] = count

        quests = character.get("quests", [])
        stats["quests_list"] = ";".join(quests) if quests else None

        return stats

    def save_stats(self, stats: dict, output_file: Path = None) -> pd.DataFrame:
        new_row = pd.DataFrame([stats])
        self.df = pd.concat([self.df, new_row], ignore_index=True)
        if output_file:
            output_file.parent.mkdir(parents=True, exist_ok=True)
            self.df.to_parquet(output_file, index=False)
        return self.df


class MultiCharacterTracker:
    def __init__(self, character_list: list[tuple[str, str]], output_file: str = "character_stats.parquet"):
        self.character_list = character_list
        self.output_file = Path(output_file)
        self.df = self._load_data()
        self.trackers = {}

        for player_uuid, char_uuid in character_list:
            key = f"{player_uuid}_{char_uuid}"
            self.trackers[key] = WynnCharacterTracker(player_uuid, char_uuid, self.df)

    def _load_data(self) -> pd.DataFrame:
        if self.output_file.exists():
            return pd.read_parquet(self.output_file)
        return pd.DataFrame()

    def fetch_all(self) -> None:
        fetch_timestamp = datetime.now().isoformat()
        timestamp_display = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for key, tracker in self.trackers.items():
            try:
                player_uuid, char_uuid = tracker.player_uuid, tracker.character_uuid
                player_data = tracker.fetch_player_data()
                if player_data:
                    stats = tracker.extract_character_stats(player_data, fetch_timestamp)
                    if stats:
                        self.df = tracker.save_stats(stats)
                        for t in self.trackers.values():
                            t.df = self.df
                        print(
                            f" {stats['username']} ({stats['character_type']}) - "
                            f"Level: {stats['level']}, Total Level: {stats['totalLevel']}"
                        )
                else:
                    print(f" Failed to fetch data for {player_uuid}")
            except Exception as e:
                print(f" Error for {key}: {e}")

        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        self.df.to_parquet(self.output_file, index=False)
        print(f"All stats saved to {self.output_file}")

    def track_continuous(self, interval_minutes: int = 15) -> None:
        interval_seconds = interval_minutes * 60
        iteration = 0

        while True:
            try:
                iteration += 1
                self.fetch_all()
                time.sleep(interval_seconds)

            except KeyboardInterrupt:
                break
            except Exception:
                time.sleep(interval_seconds)


if __name__ == "__main__":
    characters_to_track = []

    characters_to_track.extend(
        [
            # ("player_uuid", "character_uuid"),
        ]
    )

    urls_to_parse = [
        "https://wynncraft.com/stats/player/475272be-bc88-4018-a18f-22460c69180b?character=76ab649e-98dd-4b51-9b1d-5936d9df5008",
        "https://wynncraft.com/stats/player/e0db5962-0e0d-43e0-ab4a-aaf975c57479?character=ec220540-2793-4919-9754-f0c273a94d4e",
        "https://wynncraft.com/stats/player/1fccb34f-c1cc-4684-8257-c440bef7e3a2?character=3e4eccf8-d56c-495c-b4db-60a6d52897fa",
        "https://wynncraft.com/stats/player/82cfcc76-e0c5-4c67-b502-38dfb2863635?character=7189bc45-0fed-4d7f-b4b6-108f9a8cfdd7",
    ]

    for url in urls_to_parse:
        if url.strip():
            result = parse_wynncraft_url(url)
            if result:
                characters_to_track.append(result)
                print(f"Parsed: {result[0][:8]}... → {result[1][:8]}...")
            else:
                print(f"Failed to parse: {url}")

    if not characters_to_track:
        print("No characters to track. Add URLs or tuples to the configuration.")
    else:
        output_dir = os.getenv("OUTPUT_DIR", ".")
        OUTPUT_FILE = os.path.join(output_dir, "character_stats.parquet")

        tracker = MultiCharacterTracker(characters_to_track, OUTPUT_FILE)
        tracker.track_continuous(interval_minutes=15)
