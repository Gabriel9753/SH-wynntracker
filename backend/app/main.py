import threading
from contextlib import asynccontextmanager

from app.database import init_db
from app.router import players, stats
from app.services.migration import check_and_run_migration
from app.services.tracker import start_tracker_background
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    # Check for migration before starting tracker
    check_and_run_migration()

    tracker_thread = threading.Thread(target=start_tracker_background, daemon=True)
    tracker_thread.start()
    yield


app = FastAPI(title="WynnTracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router)
app.include_router(stats.router)


@app.get("/")
def root():
    return {"message": "WynnTracker API"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
