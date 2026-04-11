"""add bug fields to cas_test

Revision ID: h7i8j9k0l1m2
Revises: g6h7i8j9k0l1
Create Date: 2026-04-09 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "h7i8j9k0l1m2"
down_revision: Union[str, Sequence[str], None] = "g6h7i8j9k0l1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("cas_test", sa.Column("bug_titre_correction", sa.String(length=255), nullable=True))
    op.add_column("cas_test", sa.Column("bug_nom_tache", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("cas_test", "bug_nom_tache")
    op.drop_column("cas_test", "bug_titre_correction")
