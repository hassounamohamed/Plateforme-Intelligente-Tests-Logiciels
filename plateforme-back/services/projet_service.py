"""
Service métier pour la gestion des projets
"""
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from repositories.projet_repository import ProjetRepository
from repositories.user_repository import UserRepository
from schemas.projet import (
    CreateProjetRequest,
    UpdateProjetRequest,
    AssignerMembresRequest,
)
from core.rbac.constants import ROLE_SUPER_ADMIN


class ProjetService:
    def __init__(self, db: Session):
        self.repo = ProjetRepository(db)
        self.user_repo = UserRepository(db)
        self.db = db

    # ── Création ────────────────────────────────────────────────────────────

    def creer_projet(self, data: CreateProjetRequest, product_owner_id: int):
        """Créer un nouveau projet (réservé au Product Owner)."""
        return self.repo.create(
            {
                "nom": data.nom,
                "description": data.description,
                "dateDebut": data.dateDebut,
                "dateFin": data.dateFin,
                "objectif": data.objectif,
                "statut": "actif",
                "productOwnerId": product_owner_id,
            }
        )

    # ── Lecture ─────────────────────────────────────────────────────────────

    def get_projet(self, projet_id: int):
        projet = self.repo.get_by_id(projet_id)
        if not projet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Projet {projet_id} introuvable.",
            )
        return projet

    def get_mes_projets(self, product_owner_id: int):
        """Projets dont l'utilisateur connecté est le Product Owner."""
        return self.repo.get_by_product_owner(product_owner_id)

    def get_projets_membre(self, user_id: int):
        """Projets dont l'utilisateur est membre (pour Scrum Master, Developers, etc.)."""
        return self.repo.get_projets_by_membre(user_id)

    def get_all_projets(self):
        return self.repo.get_all()

    # ── Modification ─────────────────────────────────────────────────────────

    def modifier_projet(self, projet_id: int, data: UpdateProjetRequest, current_user_id: int):
        projet = self.get_projet(projet_id)
        if projet.productOwnerId != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul le Product Owner du projet peut le modifier.",
            )
        return self.repo.update(projet_id, data.model_dump(exclude_none=True))

    # ── Archivage ────────────────────────────────────────────────────────────

    def archiver_projet(self, projet_id: int, current_user_id: int):
        projet = self.get_projet(projet_id)
        if projet.productOwnerId != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul le Product Owner du projet peut l'archiver.",
            )
        return self.repo.archiver(projet_id)

    # ── Membres ──────────────────────────────────────────────────────────────

    def get_membres_disponibles(self):
        """Récupérer la liste des utilisateurs disponibles pour assignation (actifs, sauf SUPER_ADMIN)."""
        users = self.user_repo.get_active_users()
        # Filtrer les SUPER_ADMIN et retourner directement les objets Utilisateur
        membres_disponibles = [
            user
            for user in users
            if user.role and user.role.code != ROLE_SUPER_ADMIN
        ]
        return membres_disponibles

    def assigner_membres(
        self,
        projet_id: int,
        data: AssignerMembresRequest,
        current_user_id: int,
    ):
        projet = self.get_projet(projet_id)
        if projet.productOwnerId != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul le Product Owner du projet peut assigner des membres.",
            )
        return self.repo.assigner_membres(projet_id, data.membre_ids)

    # ── Statistiques ─────────────────────────────────────────────────────────

    def generer_statistiques(self, projet_id: int):
        stats = self.repo.get_statistiques(projet_id)
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Projet {projet_id} introuvable.",
            )
        return stats
