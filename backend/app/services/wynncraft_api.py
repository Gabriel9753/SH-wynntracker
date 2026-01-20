from urllib.parse import parse_qs, urlparse

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
    except Exception:
        return None


def fetch_player_data(player_uuid: str) -> dict | None:
    try:
        api_url = f"https://api.wynncraft.com/v3/player/{player_uuid}?fullResult"
        response = requests.get(api_url, timeout=30)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception:
        return None


def extract_player_data(api_data: dict) -> dict:
    return {
        "uuid": api_data.get("uuid"),
        "username": api_data.get("username"),
        "rank": api_data.get("rank"),
        "first_join": api_data.get("firstJoin"),
        "playtime_total_days": api_data.get("playtime"),
    }


def extract_character_data(player_uuid: str, character_uuid: str, api_data: dict) -> dict | None:
    character = api_data.get("characters", {}).get(character_uuid)
    if not character:
        return None
    return {
        "uuid": character_uuid,
        "player_uuid": player_uuid,
        "type": character.get("type"),
        "nickname": character.get("nickname"),
    }


def extract_character_stats(character_uuid: str, api_data: dict) -> dict | None:
    character = api_data.get("characters", {}).get(character_uuid)
    if not character:
        return None

    skill_points = character.get("skillPoints", {})
    professions = character.get("professions", {})
    dungeons_list = character.get("dungeons", {}).get("list", {})
    raids_list = character.get("raids", {}).get("list", {})
    quests = character.get("quests", [])

    return {
        "level": character.get("level"),
        "total_level": character.get("totalLevel"),
        "xp": character.get("xp"),
        "xp_percent": character.get("xpPercent"),
        "playtime_hours": character.get("playtime"),
        "mobs_killed": character.get("mobsKilled"),
        "chests_found": character.get("chestsFound"),
        "blocks_walked": character.get("blocksWalked"),
        "items_identified": character.get("itemsIdentified"),
        "logins": character.get("logins"),
        "deaths": character.get("deaths"),
        "discoveries": character.get("discoveries"),
        "content_completion": character.get("contentCompletion"),
        "wars": character.get("wars"),
        "pvp_kills": character.get("pvp", {}).get("kills"),
        "pvp_deaths": character.get("pvp", {}).get("deaths"),
        "dungeons_total": character.get("dungeons", {}).get("total"),
        "raids_total": character.get("raids", {}).get("total"),
        "world_events": character.get("worldEvents"),
        "caves": character.get("caves"),
        "lootruns": character.get("lootruns"),
        "quests_count": len(quests),
        "skill_points": skill_points if skill_points else None,
        "professions": professions if professions else None,
        "dungeons": dungeons_list if dungeons_list else None,
        "raids": raids_list if raids_list else None,
        "quests_list": ";".join(quests) if quests else None,
    }
