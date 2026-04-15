"""link cas test to userstory

Revision ID: p1q2r3s4t5u6
Revises: n1o2p3q4r5s6
Create Date: 2026-04-13 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "p1q2r3s4t5u6"
down_revision: Union[str, Sequence[str], None] = "n1o2p3q4r5s6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    op.execute('ALTER TABLE cas_test ADD COLUMN IF NOT EXISTS user_story_id INTEGER')

    # Best-effort backfill: map each cas_test to a user story from the same project.
    op.execute(
        """
        UPDATE cas_test ct
        SET user_story_id = mapped.us_id
        FROM (
            SELECT ct2.id AS cas_id, MIN(us.id) AS us_id
            FROM cas_test ct2
            JOIN cahier_test_global c ON c.id = ct2.cahier_id
            JOIN module m ON m.projet_id = c.projet_id
            JOIN epic e ON e.module_id = m.id
            JOIN userstory us ON us.epic_id = e.id
            GROUP BY ct2.id
        ) AS mapped
        WHERE ct.id = mapped.cas_id
          AND ct.user_story_id IS NULL
        """
    )

    remaining = bind.execute(
        sa.text('SELECT COUNT(*) FROM cas_test WHERE user_story_id IS NULL')
    ).scalar()
    if remaining and int(remaining) > 0:
        raise RuntimeError(
            "Unable to backfill cas_test.user_story_id for all rows. "
            "Create user stories for related projects, then rerun migration."
        )

    fk_exists = bind.execute(
        sa.text("SELECT 1 FROM pg_constraint WHERE conname = 'fk_cas_test_userstory'")
    ).scalar()
    if not fk_exists:
        op.create_foreign_key(
            "fk_cas_test_userstory",
            "cas_test",
            "userstory",
            ["user_story_id"],
            ["id"],
        )

    op.execute('ALTER TABLE cas_test ALTER COLUMN user_story_id SET NOT NULL')


def downgrade() -> None:
    bind = op.get_bind()
    fk_exists = bind.execute(
        sa.text("SELECT 1 FROM pg_constraint WHERE conname = 'fk_cas_test_userstory'")
    ).scalar()
    if fk_exists:
        op.drop_constraint("fk_cas_test_userstory", "cas_test", type_="foreignkey")

    op.execute('ALTER TABLE cas_test DROP COLUMN IF EXISTS user_story_id')
