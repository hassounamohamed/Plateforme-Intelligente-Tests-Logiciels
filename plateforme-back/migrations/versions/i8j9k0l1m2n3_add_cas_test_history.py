"""add cas_test_history table

Revision ID: i8j9k0l1m2n3
Revises: h7i8j9k0l1m2
Create Date: 2026-04-09 15:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "i8j9k0l1m2n3"
down_revision: Union[str, Sequence[str], None] = "h7i8j9k0l1m2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("cas_test_history"):
        op.create_table(
            "cas_test_history",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("cas_test_id", sa.Integer(), nullable=False),
            sa.Column("cahier_id", sa.Integer(), nullable=False),
            sa.Column("changed_by_id", sa.Integer(), nullable=True),
            sa.Column("old_statut_test", sa.String(length=30), nullable=True),
            sa.Column("new_statut_test", sa.String(length=30), nullable=True),
            sa.Column("old_type_test", sa.String(length=20), nullable=True),
            sa.Column("new_type_test", sa.String(length=20), nullable=True),
            sa.Column("old_commentaire", sa.Text(), nullable=True),
            sa.Column("new_commentaire", sa.Text(), nullable=True),
            sa.Column("old_bug_titre_correction", sa.String(length=255), nullable=True),
            sa.Column("new_bug_titre_correction", sa.String(length=255), nullable=True),
            sa.Column("old_bug_nom_tache", sa.String(length=255), nullable=True),
            sa.Column("new_bug_nom_tache", sa.String(length=255), nullable=True),
            sa.Column("changed_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["cahier_id"], ["cahier_test_global.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["cas_test_id"], ["cas_test.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["changed_by_id"], ["utilisateur.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("cas_test_history")}
    if "ix_cas_test_history_id" not in existing_indexes:
        op.create_index("ix_cas_test_history_id", "cas_test_history", ["id"], unique=False)
    if "ix_cas_test_history_cas_test_id" not in existing_indexes:
        op.create_index("ix_cas_test_history_cas_test_id", "cas_test_history", ["cas_test_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_cas_test_history_cas_test_id", table_name="cas_test_history")
    op.drop_index("ix_cas_test_history_id", table_name="cas_test_history")
    op.drop_table("cas_test_history")
