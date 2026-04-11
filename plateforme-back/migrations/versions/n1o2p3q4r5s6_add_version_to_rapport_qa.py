"""add version to rapport qa

Revision ID: n1o2p3q4r5s6
Revises: m1n2o3p4q5r6
Create Date: 2026-04-11 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "n1o2p3q4r5s6"
down_revision: Union[str, Sequence[str], None] = "m1n2o3p4q5r6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE rapport_qa ADD COLUMN IF NOT EXISTS version VARCHAR(20)')
    op.execute("UPDATE rapport_qa SET version = '1.0.0' WHERE version IS NULL OR version = ''")
    op.execute("ALTER TABLE rapport_qa ALTER COLUMN version SET DEFAULT '1.0.0'")
    op.execute('ALTER TABLE rapport_qa ALTER COLUMN version SET NOT NULL')


def downgrade() -> None:
    op.execute('ALTER TABLE rapport_qa DROP COLUMN IF EXISTS version')
