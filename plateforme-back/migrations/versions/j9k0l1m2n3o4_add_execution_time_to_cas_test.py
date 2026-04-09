"""add execution time to cas_test

Revision ID: j9k0l1m2n3o4
Revises: i8j9k0l1m2n3
Create Date: 2026-04-09 16:10:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "j9k0l1m2n3o4"
down_revision: Union[str, Sequence[str], None] = "i8j9k0l1m2n3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("cas_test", sa.Column("execution_time_seconds", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("cas_test", "execution_time_seconds")
