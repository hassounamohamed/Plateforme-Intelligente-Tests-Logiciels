"""add cahier version history

Revision ID: q2r3s4t5u6v7
Revises: p1q2r3s4t5u6
Create Date: 2026-04-15 11:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "q2r3s4t5u6v7"
down_revision: Union[str, Sequence[str], None] = "p1q2r3s4t5u6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cahier_version_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cahier_id", sa.Integer(), nullable=False),
        sa.Column("version", sa.String(length=20), nullable=False),
        sa.Column("source", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["cahier_id"], ["cahier_test_global.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cahier_id", "version", name="uq_cahier_version_history_cahier_version"),
    )
    op.create_index(op.f("ix_cahier_version_history_id"), "cahier_version_history", ["id"], unique=False)

    op.execute(
        sa.text(
            """
            INSERT INTO cahier_version_history (cahier_id, version, source, created_at)
            SELECT c.id, c.version, 'backfill', COALESCE(c.date_generation, NOW())
            FROM cahier_test_global c
            ON CONFLICT (cahier_id, version) DO NOTHING
            """
        )
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_cahier_version_history_id"), table_name="cahier_version_history")
    op.drop_table("cahier_version_history")
