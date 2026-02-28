"""
Repository pour la gestion des modules de projet
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from models.scrum import Module
from repositories.base_repository import BaseRepository


class ModuleRepository(BaseRepository[Module]):
    """Repository pour les modules liés à un projet."""

    def __init__(self, db: Session):
        super().__init__(Module, db)

    # ── Lecture ─────────────────────────────────────────────────────────────

    def get_by_projet(self, projet_id: int) -> List[Module]:
        """Récupérer tous les modules d'un projet, ordonnés par `ordre`."""
        return (
            self.db.query(Module)
            .filter(Module.projet_id == projet_id)
            .order_by(Module.ordre)
            .all()
        )

    def get_by_projet_with_hierarchy(self, projet_id: int) -> List[Module]:
        """Modules avec epics et user-stories chargés (hiérarchie complète)."""
        return (
            self.db.query(Module)
            .options(
                joinedload(Module.epics)
            )
            .filter(Module.projet_id == projet_id)
            .order_by(Module.ordre)
            .all()
        )

    def get_by_id_in_projet(self, module_id: int, projet_id: int) -> Optional[Module]:
        """Récupérer un module en vérifiant son appartenance au projet."""
        return (
            self.db.query(Module)
            .filter(Module.id == module_id, Module.projet_id == projet_id)
            .first()
        )

    # ── Réordonnancement ─────────────────────────────────────────────────────

    def reordonner(self, projet_id: int, ordre: List[int]) -> List[Module]:
        """
        Mettre à jour l'ordre des modules selon une liste d'IDs ordonnée.
        `ordre` = [module_id₁, module_id₂, …] dans le nouvel ordre souhaité.
        """
        modules = {m.id: m for m in self.get_by_projet(projet_id)}
        for position, module_id in enumerate(ordre):
            if module_id in modules:
                modules[module_id].ordre = position
        self.db.commit()
        return self.get_by_projet(projet_id)
