"""add ai_generation_id to cahier_test_global

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-08 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Ajoute la colonne ai_generation_id sur cahier_test_global."""
    op.add_column(
        'cahier_test_global',
        sa.Column(
            'ai_generation_id',
            sa.Integer(),
            sa.ForeignKey('ai_generations.id', ondelete='SET NULL'),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Supprime la colonne ai_generation_id de cahier_test_global."""
    op.drop_column('cahier_test_global', 'ai_generation_id')
