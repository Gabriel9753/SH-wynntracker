from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PlayerBase(BaseModel):
    uuid: str
    username: str
    rank: Optional[str] = None
    first_join: Optional[datetime] = None
    playtime_total_days: Optional[float] = None


class PlayerCreate(PlayerBase):
    pass


class PlayerRead(PlayerBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlayerWithCharacters(PlayerRead):
    characters: list["CharacterRead"] = []


class CharacterBase(BaseModel):
    uuid: str
    player_uuid: str
    type: Optional[str] = None
    nickname: Optional[str] = None
    gamemodes: Optional[str] = None


class CharacterCreate(CharacterBase):
    pass


class CharacterRead(CharacterBase):
    last_fetched_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CharacterStatsBase(BaseModel):
    level: Optional[int] = None
    total_level: Optional[int] = None
    xp: Optional[int] = None
    xp_percent: Optional[float] = None
    playtime_hours: Optional[float] = None
    mobs_killed: Optional[int] = None
    chests_found: Optional[int] = None
    blocks_walked: Optional[int] = None
    items_identified: Optional[int] = None
    logins: Optional[int] = None
    deaths: Optional[int] = None
    discoveries: Optional[int] = None
    content_completion: Optional[int] = None
    wars: Optional[int] = None
    pvp_kills: Optional[int] = None
    pvp_deaths: Optional[int] = None
    dungeons_total: Optional[int] = None
    raids_total: Optional[int] = None
    world_events: Optional[int] = None
    caves: Optional[int] = None
    lootruns: Optional[int] = None
    quests_count: Optional[int] = None
    skill_points: Optional[dict] = None
    professions: Optional[dict] = None
    dungeons: Optional[dict] = None
    raids: Optional[dict] = None
    quests_list: Optional[str] = None


class CharacterStatsCreate(CharacterStatsBase):
    character_uuid: str


class CharacterStatsRead(CharacterStatsBase):
    id: int
    character_uuid: str
    valid_from: datetime
    valid_until: Optional[datetime] = None

    class Config:
        from_attributes = True


class CharacterWithStats(CharacterRead):
    player: Optional[PlayerRead] = None
    current_stats: Optional[CharacterStatsRead] = None
    is_recently_active: Optional[bool] = None


class CharacterWithHistory(CharacterWithStats):
    stats_history: list[CharacterStatsRead] = []


class AddCharacterRequest(BaseModel):
    url: str
