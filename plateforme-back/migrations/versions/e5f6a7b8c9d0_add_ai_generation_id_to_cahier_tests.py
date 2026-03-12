"""add ai_generation_id to cahier_tests

Revision ID: e5f6a7b8c9d0
Revises: b2c3d4e5f6a7, f20da35f0c50
Create Date: 2026-03-12 10:00:00.000000

Ajoute la colonne ai_generation_id (FK → ai_generations.id) sur la table
cahier_tests afin de tracer la génération IA qui a produit les tests unitaires
d'une User Story.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = ('b2c3d4e5f6a7', 'f20da35f0c50')
branch_labels: Union[str, Sequence[str], None] = None
depends_on:    Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'cahier_tests',
        sa.Column(
            'ai_generation_id',
            sa.Integer(),
            sa.ForeignKey('ai_generations.id', ondelete='SET NULL'),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column('cahier_tests', 'ai_generation_id')
