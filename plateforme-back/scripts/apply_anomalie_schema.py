"""Apply anomalie.cas_test_id schema patch (idempotent)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text

from db.database import engine

STATEMENTS = [
    "ALTER TABLE anomalie ADD COLUMN IF NOT EXISTS cas_test_id INTEGER",
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_anomalie_cas_test_id'
        ) THEN
            ALTER TABLE anomalie
            ADD CONSTRAINT fk_anomalie_cas_test_id
            FOREIGN KEY (cas_test_id) REFERENCES cas_test(id) ON DELETE CASCADE;
        END IF;
    END $$;
    """,
    "CREATE INDEX IF NOT EXISTS ix_anomalie_cas_test_id ON anomalie (cas_test_id)",
]


def main() -> None:
    with engine.begin() as connection:
        for stmt in STATEMENTS:
            connection.execute(text(stmt))
    print("Schema anomalie.cas_test_id OK")


if __name__ == "__main__":
    main()
