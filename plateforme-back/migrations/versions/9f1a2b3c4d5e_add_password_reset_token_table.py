"""add password_reset_token table

Revision ID: 9f1a2b3c4d5e
Revises: e5f6a7b8c9d0
Create Date: 2026-03-19 12:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9f1a2b3c4d5e"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_token",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token", name="uq_password_reset_token_token"),
    )

    op.create_index("ix_password_reset_token_user_id", "password_reset_token", ["user_id"], unique=False)
    op.create_index("ix_password_reset_token_token", "password_reset_token", ["token"], unique=True)
    op.create_index("ix_password_reset_token_expires_at", "password_reset_token", ["expires_at"], unique=False)
    op.create_index("ix_password_reset_token_used", "password_reset_token", ["used"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_password_reset_token_used", table_name="password_reset_token")
    op.drop_index("ix_password_reset_token_expires_at", table_name="password_reset_token")
    op.drop_index("ix_password_reset_token_token", table_name="password_reset_token")
    op.drop_index("ix_password_reset_token_user_id", table_name="password_reset_token")
    op.drop_table("password_reset_token")
