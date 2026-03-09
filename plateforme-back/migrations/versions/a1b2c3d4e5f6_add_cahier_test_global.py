"""add cahier_test_global and cas_test tables

Revision ID: a1b2c3d4e5f6
Revises: f20da35f0c50
Create Date: 2026-03-08 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f20da35f0c50'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Crée les tables cahier_test_global et cas_test."""
    op.create_table(
        'cahier_test_global',
        sa.Column('id',              sa.Integer(),     nullable=False),
        sa.Column('projet_id',       sa.Integer(),     nullable=False),
        sa.Column('version',         sa.String(20),    nullable=False, server_default='1.0.0'),
        sa.Column('statut',          sa.String(30),    nullable=False, server_default='brouillon'),
        sa.Column('date_generation', sa.DateTime(),    nullable=True),
        sa.Column('generated_by_id', sa.Integer(),     nullable=True),
        sa.Column('nombre_total',    sa.Integer(),     nullable=True, server_default='0'),
        sa.Column('nombre_reussi',   sa.Integer(),     nullable=True, server_default='0'),
        sa.Column('nombre_echoue',   sa.Integer(),     nullable=True, server_default='0'),
        sa.Column('nombre_bloque',   sa.Integer(),     nullable=True, server_default='0'),
        sa.ForeignKeyConstraint(['projet_id'],       ['projet.id'],      ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['generated_by_id'], ['utilisateur.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('projet_id'),
    )
    op.create_index(op.f('ix_cahier_test_global_id'), 'cahier_test_global', ['id'], unique=False)

    op.create_table(
        'cas_test',
        sa.Column('id',               sa.Integer(),     nullable=False),
        sa.Column('cahier_id',        sa.Integer(),     nullable=False),
        sa.Column('sprint',           sa.String(100),   nullable=True),
        sa.Column('module',           sa.String(200),   nullable=True),
        sa.Column('sous_module',      sa.String(200),   nullable=True),
        sa.Column('test_ref',         sa.String(30),    nullable=False),
        sa.Column('test_case',        sa.String(500),   nullable=False),
        sa.Column('test_purpose',     sa.Text(),        nullable=True),
        sa.Column('type_utilisateur', sa.String(100),   nullable=True),
        sa.Column('scenario_test',    sa.Text(),        nullable=True),
        sa.Column('resultat_attendu', sa.Text(),        nullable=True),
        sa.Column('resultat_obtenu',  sa.Text(),        nullable=True),
        sa.Column('fail_logs',        sa.Text(),        nullable=True),
        sa.Column('capture',          sa.String(),      nullable=True),
        sa.Column('date_creation',    sa.DateTime(),    nullable=True),
        sa.Column('type_test',        sa.String(20),    nullable=False, server_default='Manuel'),
        sa.Column('statut_test',      sa.String(30),    nullable=False, server_default='Non exécuté'),
        sa.Column('commentaire',      sa.Text(),        nullable=True),
        sa.Column('ordre',            sa.Integer(),     nullable=True, server_default='0'),
        sa.ForeignKeyConstraint(['cahier_id'], ['cahier_test_global.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_cas_test_id'), 'cas_test', ['id'], unique=False)


def downgrade() -> None:
    """Supprime les tables cas_test et cahier_test_global."""
    op.drop_index(op.f('ix_cas_test_id'), table_name='cas_test')
    op.drop_table('cas_test')
    op.drop_index(op.f('ix_cahier_test_global_id'), table_name='cahier_test_global')
    op.drop_table('cahier_test_global')
