"""add cas_test_id to anomalie

Revision ID: r3s4t5u6v7w8
Revises: q2r3s4t5u6v7
Create Date: 2026-05-15 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "r3s4t5u6v7w8"
down_revision: Union[str, Sequence[str], None] = "q2r3s4t5u6v7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE anomalie ADD COLUMN IF NOT EXISTS cas_test_id INTEGER")
    op.execute(
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
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_anomalie_cas_test_id ON anomalie (cas_test_id)"
    )


def downgrade() -> None:
    op.drop_index("ix_anomalie_cas_test_id", table_name="anomalie")
    op.drop_constraint("fk_anomalie_cas_test_id", "anomalie", type_="foreignkey")
    op.drop_column("anomalie", "cas_test_id")
