from sqlalchemy import Table, Column, Integer, ForeignKey
from db.database import Base


# 🔗 Many-to-Many between Utilisateur and Role
user_role = Table(
    "user_role",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("utilisateur.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("role.id", ondelete="CASCADE"), primary_key=True),
)


# 🔗 Many-to-Many between Role and Permission
role_permission = Table(
    "role_permission",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("role.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permission.id", ondelete="CASCADE"), primary_key=True),
)


# 🔗 Many-to-Many between Sprint and UserStory
sprint_userstory = Table(
    "sprint_userstory",
    Base.metadata,
    Column("sprint_id", Integer, ForeignKey("sprint.id", ondelete="CASCADE"), primary_key=True),
    Column("userstory_id", Integer, ForeignKey("userstory.id", ondelete="CASCADE"), primary_key=True),
)


# 🔗 Many-to-Many between Projet and Utilisateur (membres)
projet_membre = Table(
    "projet_membre",
    Base.metadata,
    Column("projet_id", Integer, ForeignKey("projet.id", ondelete="CASCADE"), primary_key=True),
    Column("utilisateur_id", Integer, ForeignKey("utilisateur.id", ondelete="CASCADE"), primary_key=True),
)

