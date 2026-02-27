"""
Repository pour la gestion des projets
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from models.scrum import Projet
from models.user import Utilisateur
from repositories.base_repository import BaseRepository


class ProjetRepository(BaseRepository[Projet]):
    """Repository pour les projets"""

    def __init__(self, db: Session):
        super().__init__(Projet, db)

    def get_by_product_owner(self, product_owner_id: int) -> List[Projet]:
        """Récupérer tous les projets d'un Product Owner"""
        return (
            self.db.query(Projet)
            .filter(Projet.productOwnerId == product_owner_id)
            .all()
        )

    def get_by_statut(self, statut: str) -> List[Projet]:
        """Récupérer les projets par statut"""
        return self.db.query(Projet).filter(Projet.statut == statut).all()

    def archiver(self, projet_id: int) -> Optional[Projet]:
        """Archiver un projet (statut → 'archivé')"""
        projet = self.get_by_id(projet_id)
        if projet:
            projet.statut = "archivé"
            self.db.commit()
            self.db.refresh(projet)
        return projet

    def assigner_membres(self, projet_id: int, membre_ids: List[int]) -> Optional[Projet]:
        """Remplacer la liste des membres du projet"""
        projet = self.get_by_id(projet_id)
        if not projet:
            return None
        membres = self.db.query(Utilisateur).filter(Utilisateur.id.in_(membre_ids)).all()
        projet.membres = membres
        self.db.commit()
        self.db.refresh(projet)
        return projet

    def get_statistiques(self, projet_id: int) -> Optional[dict]:
        """Retourner des statistiques basiques sur le projet"""
        projet = self.get_by_id(projet_id)
        if not projet:
            return None
        return {
            "projet_id": projet.id,
            "nom": projet.nom,
            "nb_sprints": len(projet.sprints),
            "nb_modules": len(projet.modules),
            "statut": projet.statut,
        }
