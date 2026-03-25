"""add oauth fields to utilisateur

Revision ID: c1d2e3f4a5b6
Revises: 9f1a2b3c4d5e
Create Date: 2026-03-20 10:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "9f1a2b3c4d5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("utilisateur", sa.Column("provider", sa.String(length=20), nullable=True))
    op.add_column(
        "utilisateur",
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_utilisateur_provider", "utilisateur", ["provider"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_utilisateur_provider", table_name="utilisateur")
    op.drop_column("utilisateur", "created_at")
    op.drop_column("utilisateur", "provider")
