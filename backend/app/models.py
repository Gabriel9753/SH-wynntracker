from datetime import datetime

from app.database import Base
from sqlalchemy import JSON, BigInteger, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship


class Player(Base):
    __tablename__ = "players"

    uuid = Column(String(36), primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    rank = Column(String(50), nullable=True)
    first_join = Column(DateTime, nullable=True)
    playtime_total_days = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    characters = relationship("Character", back_populates="player", cascade="all, delete-orphan")


class Character(Base):
    __tablename__ = "characters"

    uuid = Column(String(36), primary_key=True, index=True)
    player_uuid = Column(String(36), ForeignKey("players.uuid"), nullable=False)
    type = Column(String(50), nullable=True)
    nickname = Column(String(100), nullable=True)
    gamemodes = Column(Text, nullable=True)
    last_fetched_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="characters")
    stats = relationship("CharacterStats", back_populates="character", cascade="all, delete-orphan")


class CharacterStats(Base):
    __tablename__ = "character_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    character_uuid = Column(String(36), ForeignKey("characters.uuid"), nullable=False, index=True)
    valid_from = Column(DateTime, nullable=False, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)

    level = Column(Integer, nullable=True)
    total_level = Column(Integer, nullable=True)
    xp = Column(BigInteger, nullable=True)
    xp_percent = Column(Float, nullable=True)
    playtime_hours = Column(Float, nullable=True)

    mobs_killed = Column(Integer, nullable=True)
    chests_found = Column(Integer, nullable=True)
    blocks_walked = Column(BigInteger, nullable=True)
    items_identified = Column(Integer, nullable=True)
    logins = Column(Integer, nullable=True)
    deaths = Column(Integer, nullable=True)
    discoveries = Column(Integer, nullable=True)
    content_completion = Column(Integer, nullable=True)
    wars = Column(Integer, nullable=True)

    pvp_kills = Column(Integer, nullable=True)
    pvp_deaths = Column(Integer, nullable=True)

    dungeons_total = Column(Integer, nullable=True)
    raids_total = Column(Integer, nullable=True)
    world_events = Column(Integer, nullable=True)
    caves = Column(Integer, nullable=True)
    lootruns = Column(Integer, nullable=True)
    quests_count = Column(Integer, nullable=True)

    skill_points = Column(JSON, nullable=True)
    professions = Column(JSON, nullable=True)
    dungeons = Column(JSON, nullable=True)
    raids = Column(JSON, nullable=True)
    quests_list = Column(Text, nullable=True)

    character = relationship("Character", back_populates="stats")
    character = relationship("Character", back_populates="stats")
    character = relationship("Character", back_populates="stats")
