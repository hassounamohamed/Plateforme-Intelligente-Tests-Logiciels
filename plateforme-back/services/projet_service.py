"""
Service métier pour la gestion des projets
"""
import json
import re
from typing import List
import requests
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.config import AI_API_KEY, AI_API_URL, AI_MODEL
from models.notification import TypeNotification
from repositories.projet_repository import ProjetRepository
from repositories.user_repository import UserRepository
from services.notification_service import NotificationService
from schemas.projet import (
    CreateProjetRequest,
    UpdateProjetRequest,
    AssignerMembresRequest,
    _generer_key,
)
from core.rbac.constants import ROLE_SUPER_ADMIN


class ProjetService:
    def __init__(self, db: Session):
        self.repo = ProjetRepository(db)
        self.user_repo = UserRepository(db)
        self.db = db
        self.api_key_service = None
        self.notification_service = NotificationService(db)

    @staticmethod
    def _member_ids(projet) -> set[int]:
        ids = {m.id for m in (projet.membres or [])}
        if projet.productOwnerId:
            ids.add(projet.productOwnerId)
        return ids

    def _get_api_key_service(self):
        """Lazy load APIKeyService to avoid circular imports."""
        if self.api_key_service is None:
            from services.api_key_service import APIKeyService
            self.api_key_service = APIKeyService(self.db)
        return self.api_key_service

    def _get_api_key_for_request(self, current_user_id: int) -> str:
        """Return user custom key when enabled, otherwise platform key."""
        if current_user_id:
            api_key_svc = self._get_api_key_service()
            custom_key = api_key_svc.get_api_key_for_user(current_user_id)
            if custom_key:
                return custom_key.strip().strip('"').strip("'")

        if not AI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service IA indisponible: aucune clé API configurée.",
            )
        return AI_API_KEY.strip().strip('"').strip("'")

    @staticmethod
    def _extract_json_object(raw_text: str) -> dict:
        """Extract and parse JSON object from model output."""
        text = (raw_text or "").strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]
        return json.loads(text)

    def suggest_project_fields(self, prompt: str, current_user_id: int) -> dict:
        api_key = self._get_api_key_for_request(current_user_id)
        system_prompt = (
            "Tu es un assistant expert produit agile. "
            "Tu aides un Product Owner a remplir un formulaire de creation projet. "
            "Reponds UNIQUEMENT avec un JSON valide contenant exactement les cles: "
            "nom, description, objectif, dateDebut, dateFin. "
            "dateDebut et dateFin doivent etre au format YYYY-MM-DD ou null si inconnues. "
            "Le nom doit etre court, clair, orienté metier."
        )

        payload = {
            "model": AI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        try:
            resp = requests.post(AI_API_URL, json=payload, headers=headers, timeout=60)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Erreur lors de l'appel IA: {str(exc)}",
            ) from exc

        if resp.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Service IA indisponible ({resp.status_code}).",
            )

        try:
            data = resp.json()
            raw = data["choices"][0]["message"]["content"]
            parsed = self._extract_json_object(raw)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Réponse IA invalide.",
            ) from exc

        return {
            "nom": parsed.get("nom") or None,
            "description": parsed.get("description") or None,
            "objectif": parsed.get("objectif") or None,
            "dateDebut": parsed.get("dateDebut") or None,
            "dateFin": parsed.get("dateFin") or None,
        }

    # ── Création ────────────────────────────────────────────────────────────

    def creer_projet(self, data: CreateProjetRequest, product_owner_id: int):
        """Créer un nouveau projet (réservé au Product Owner)."""
        # Résolution de la clé projet
        key = data.key.upper() if data.key else _generer_key(data.nom)

        # Garantir l'unicité — si la clé auto générée est déjà prise, ajouter un suffixe
        if not data.key:
            base_key = key
            suffix = 1
            while self.repo.get_by_key(key):
                key = f"{base_key}{suffix}"[:10]
                suffix += 1
        else:
            if self.repo.get_by_key(key):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"La clé projet '{key}' est déjà utilisée. Choisissez une clé unique.",
                )

        projet = self.repo.create(
            {
                "nom": data.nom,
                "key": key,
                "issue_counter": 0,
                "description": data.description,
                "dateDebut": data.dateDebut,
                "dateFin": data.dateFin,
                "objectif": data.objectif,
                "statut": "actif",
                "productOwnerId": product_owner_id,
            }
        )

        # Le Product Owner doit toujours faire partie de l'équipe du projet.
        self.repo.assigner_membres(projet.id, [product_owner_id])
        created_project = self.repo.get_by_id(projet.id)
        self.notification_service.notify_user(
            user_id=product_owner_id,
            titre="Nouveau projet cree",
            message=f"Le projet {created_project.nom} a ete cree avec succes.",
            notification_type=TypeNotification.PROJECT_CREATED,
            priorite="moyenne",
        )
        return created_project

    # ── Lecture ─────────────────────────────────────────────────────────────

    def _ensure_product_owner_in_members(self, projet):
        """Garantit que le Product Owner existe dans la liste des membres."""
        if not projet or not projet.productOwnerId:
            return projet

        membre_ids = [m.id for m in (projet.membres or [])]
        if projet.productOwnerId in membre_ids:
            return projet

        updated = self.repo.assigner_membres(
            projet.id,
            [*membre_ids, projet.productOwnerId],
        )
        return updated or projet

    def get_projet(self, projet_id: int):
        projet = self.repo.get_by_id(projet_id)
        if not projet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Projet {projet_id} introuvable.",
            )
        return self._ensure_product_owner_in_members(projet)

    def get_mes_projets(self, product_owner_id: int):
        """Projets dont l'utilisateur connecté est le Product Owner."""
        projets = self.repo.get_by_product_owner(product_owner_id)
        return [self._ensure_product_owner_in_members(projet) for projet in projets]

    def get_projets_membre(self, user_id: int):
        """Projets dont l'utilisateur est membre (pour Scrum Master, Developers, etc.)."""
        projets = self.repo.get_projets_by_membre(user_id)
        return [self._ensure_product_owner_in_members(projet) for projet in projets]

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
        updated = self.repo.update(projet_id, data.model_dump(exclude_none=True))
        target_ids = self._member_ids(updated)
        self.notification_service.notify_users(
            user_ids=list(target_ids),
            titre="Projet modifie",
            message=f"Le projet {updated.nom} a ete modifie.",
            notification_type=TypeNotification.PROJECT_UPDATED,
            priorite="moyenne",
            exclude_user_id=current_user_id,
        )
        return updated

    # ── Archivage ────────────────────────────────────────────────────────────

    def archiver_projet(self, projet_id: int, current_user_id: int):
        projet = self.get_projet(projet_id)
        if projet.productOwnerId != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul le Product Owner du projet peut l'archiver.",
            )
        archived = self.repo.archiver(projet_id)
        target_ids = self._member_ids(archived)
        self.notification_service.notify_users(
            user_ids=list(target_ids),
            titre="Projet archive",
            message=f"Le projet {archived.nom} a ete archive.",
            notification_type=TypeNotification.PROJECT_ARCHIVED,
            priorite="basse",
            exclude_user_id=current_user_id,
        )
        return archived

    def supprimer_projet(self, projet_id: int, current_user_id: int) -> None:
        projet = self.get_projet(projet_id)
        if projet.productOwnerId != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul le Product Owner du projet peut le supprimer.",
            )
        deleted = self.repo.delete(projet_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Projet {projet_id} introuvable.",
            )

    # ── Membres ──────────────────────────────────────────────────────────────

    def get_membres_disponibles(self, current_user_id: int):
        """Récupérer la liste des utilisateurs disponibles pour assignation.

        Inclut uniquement les comptes actifs,
        exclut SUPER_ADMIN et l'utilisateur connecté.
        """
        users = self.user_repo.get_all_users()
        membres_disponibles = [
            user
            for user in users
            if user.id != current_user_id
            and user.actif is True
            and (not user.role or user.role.code != ROLE_SUPER_ADMIN)
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

        before_member_ids = self._member_ids(projet)

        # Empêcher la suppression du Product Owner de la liste des membres.
        member_ids = list(set([*data.membre_ids, projet.productOwnerId]))
        updated = self.repo.assigner_membres(projet_id, member_ids)

        after_member_ids = self._member_ids(updated)
        added_member_ids = list(after_member_ids - before_member_ids)
        if added_member_ids:
            self.notification_service.notify_users(
                user_ids=added_member_ids,
                titre="Tu as ete ajoute a un projet",
                message=f"Vous avez ete ajoute au projet {updated.nom}.",
                notification_type=TypeNotification.ADDED_TO_PROJECT,
                priorite="moyenne",
            )
            self.notification_service.notify_users(
                user_ids=list(after_member_ids),
                titre="Nouveau membre ajoute au projet",
                message=f"Un nouveau membre a ete ajoute au projet {updated.nom}.",
                notification_type=TypeNotification.PROJECT_MEMBER_ADDED,
                priorite="moyenne",
                exclude_user_id=current_user_id,
            )

        return updated

    # ── Statistiques ─────────────────────────────────────────────────────────

    def generer_statistiques(self, projet_id: int):
        stats = self.repo.get_statistiques(projet_id)
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Projet {projet_id} introuvable.",
            )
        return stats
