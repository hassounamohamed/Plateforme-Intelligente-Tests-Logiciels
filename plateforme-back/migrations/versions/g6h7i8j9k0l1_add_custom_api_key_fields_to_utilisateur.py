"""add custom api key fields to utilisateur

Revision ID: g6h7i8j9k0l1
Revises: c1d2e3f4a5b6
Create Date: 2026-03-29 15:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "g6h7i8j9k0l1"
down_revision: Union[str, Sequence[str], None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add custom API key field (encrypted)
    op.add_column("utilisateur", sa.Column("custom_api_key", sa.String(), nullable=True))
    
    # Add toggle to use custom API key
    op.add_column("utilisateur", sa.Column("use_custom_api_key", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    
    # Track when user added their API key
    op.add_column("utilisateur", sa.Column("api_key_created_at", sa.DateTime(), nullable=True))
    
    # Track when custom key was last used
    op.add_column("utilisateur", sa.Column("api_key_last_used", sa.DateTime(), nullable=True))
    
    # Create index for quick lookups of users with custom API keys
    op.create_index("ix_utilisateur_use_custom_api_key", "utilisateur", ["use_custom_api_key"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_utilisateur_use_custom_api_key", table_name="utilisateur")
    op.drop_column("utilisateur", "api_key_last_used")
    op.drop_column("utilisateur", "api_key_created_at")
    op.drop_column("utilisateur", "use_custom_api_key")
    op.drop_column("utilisateur", "custom_api_key")
