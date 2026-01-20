import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/wynntracker.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import os

    from app import models

    if DATABASE_URL.startswith("sqlite"):
        db_path = DATABASE_URL.replace("sqlite:///", "")
        if db_path.startswith("/"):
            pass
        else:
            pass

        if "://" in DATABASE_URL:
            path = DATABASE_URL.split("://")[-1]
            if path.startswith("/"):
                path = path[1:]

        if "sqlite:///" in DATABASE_URL:
            path = DATABASE_URL.split("sqlite:///")[-1]
            db_dir = os.path.dirname(path)
            if db_dir and not os.path.exists(db_dir):
                try:
                    print(f"Creating database directory: {db_dir}")
                    os.makedirs(db_dir, exist_ok=True)
                except Exception as e:
                    print(f"Error creating database directory {db_dir}: {e}")

    print(f"Initializing database at {DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
