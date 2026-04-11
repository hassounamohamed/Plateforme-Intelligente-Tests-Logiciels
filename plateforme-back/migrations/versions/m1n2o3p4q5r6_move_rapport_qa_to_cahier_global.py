"""move rapport qa relation to cahier global

Revision ID: m1n2o3p4q5r6
Revises: k1l2m3n4o5p6
Create Date: 2026-04-11 13:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "m1n2o3p4q5r6"
down_revision: Union[str, Sequence[str], None] = "k1l2m3n4o5p6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    op.execute('ALTER TABLE rapport_qa ADD COLUMN IF NOT EXISTS "cahierId" INTEGER')

    # Map existing reports from sprint -> project -> cahier_test_global.
    op.execute(
        """
        UPDATE rapport_qa rq
        SET "cahierId" = ctg.id
        FROM sprint s
        JOIN cahier_test_global ctg ON ctg.projet_id = s.projet_id
        WHERE rq."sprintId" = s.id
          AND rq."cahierId" IS NULL
        """
    )

    fk_exists = bind.execute(
        sa.text("SELECT 1 FROM pg_constraint WHERE conname = 'fk_rapport_qa_cahier'")
    ).scalar()
    if not fk_exists:
        op.create_foreign_key(
            "fk_rapport_qa_cahier",
            "rapport_qa",
            "cahier_test_global",
            ["cahierId"],
            ["id"],
            ondelete="CASCADE",
        )
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS uq_rapport_qa_cahier_id ON rapport_qa ("cahierId")'
    )

    op.execute('ALTER TABLE rapport_qa DROP COLUMN IF EXISTS "sprintId" CASCADE')


def downgrade() -> None:
    bind = op.get_bind()

    op.execute('ALTER TABLE rapport_qa ADD COLUMN IF NOT EXISTS "sprintId" INTEGER')

    # Best-effort reverse mapping: take one sprint from the same project.
    op.execute(
        """
        UPDATE rapport_qa rq
        SET "sprintId" = s.id
        FROM cahier_test_global ctg
        JOIN sprint s ON s.projet_id = ctg.projet_id
        WHERE rq."cahierId" = ctg.id
          AND rq."sprintId" IS NULL
        """
    )

    fk_exists = bind.execute(
        sa.text("SELECT 1 FROM pg_constraint WHERE conname = 'fk_rapport_qa_sprint'")
    ).scalar()
    if not fk_exists:
        op.create_foreign_key(
            "fk_rapport_qa_sprint",
            "rapport_qa",
            "sprint",
            ["sprintId"],
            ["id"],
        )

    op.execute('DROP INDEX IF EXISTS uq_rapport_qa_cahier_id')
    op.execute('ALTER TABLE rapport_qa DROP COLUMN IF EXISTS "cahierId" CASCADE')
