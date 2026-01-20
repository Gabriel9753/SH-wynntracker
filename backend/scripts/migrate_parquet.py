import sys
from pathlib import Path

# Add backend directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.services.migration import migrate_parquet

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_parquet.py <path_to_parquet_file>")
        sys.exit(1)

    parquet_file = sys.argv[1]
    if not Path(parquet_file).exists():
        print(f"File not found: {parquet_file}")
        sys.exit(1)

    db = SessionLocal()
    try:
        migrate_parquet(parquet_file, db)
    finally:
        db.close()
