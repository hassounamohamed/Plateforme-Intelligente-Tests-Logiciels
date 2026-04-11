"""extend notification types

Revision ID: k1l2m3n4o5p6
Revises: j9k0l1m2n3o4
Create Date: 2026-04-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "k1l2m3n4o5p6"
down_revision: Union[str, Sequence[str], None] = "j9k0l1m2n3o4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


NEW_ENUM_VALUES = [
    "PROJECT_CREATED",
    "PROJECT_UPDATED",
    "PROJECT_ARCHIVED",
    "PROJECT_MEMBER_ADDED",
    "ADDED_TO_PROJECT",
    "USER_STORY_CREATED",
    "USER_STORY_UPDATED",
    "USER_STORY_DELETED",
    "USER_STORY_VALIDATED",
    "USER_STORY_ASSIGNED_TO_ME",
    "SPRINT_CREATED",
    "SPRINT_COMPLETED",
    "USER_STORY_ADDED_TO_SPRINT",
    "USER_STORY_REMOVED_FROM_SPRINT",
    "BACKLOG_UPDATED",
    "TEST_CREATED",
    "TEST_ASSIGNED_TO_ME",
    "TEST_EXECUTED",
    "TEST_RESULT_VALIDATED",
    "BUG_DETECTED",
    "REPORT_EXPORTED",
    "AI_FAILED",
    "DEADLINE_NEAR",
    "SPRINT_DELAYED",
    "NEW_ASSIGNMENT",
]


def _resolve_enum_name() -> str | None:
    bind = op.get_bind()
    candidates = ("typenotification", "type_notification", "notification_type")
    for name in candidates:
        found = bind.execute(
            sa.text(
                """
                SELECT 1
                FROM pg_type t
                JOIN pg_namespace n ON n.oid = t.typnamespace
                WHERE t.typname = :name AND n.nspname = current_schema()
                """
            ),
            {"name": name},
        ).scalar()
        if found:
            return name
    return None


def _add_value(enum_type_name: str, value: str) -> None:
    op.execute(sa.text(f"ALTER TYPE {enum_type_name} ADD VALUE IF NOT EXISTS '{value}'"))


def upgrade() -> None:
    enum_name = _resolve_enum_name()
    if not enum_name:
        raise RuntimeError("Notification enum type not found in current schema.")

    for value in NEW_ENUM_VALUES:
        _add_value(enum_name, value)


def downgrade() -> None:
    # PostgreSQL does not support removing enum values safely in a downgrade.
    pass
