from __future__ import annotations

import unicodedata
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.rbac.constants import ROLE_DEVELOPPEUR
from models.anomalie import Anomalie
from models.notification import TypeNotification
from models.scrum import Projet
from models.user import Utilisateur
from repositories.anomalie_repository import AnomalieRepository
from repositories.cahier_test_global_repository import CahierTestGlobalRepository
from schemas.anomalie import AnomalieResponse
from services.notification_service import NotificationService


def _normalize_statut(value: str) -> str:
    raw = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    return raw.strip().lower()


def _is_failed_or_blocked(statut_test: str) -> bool:
    return _normalize_statut(statut_test) in {"echoue", "bloque"}


class AnomalieService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AnomalieRepository(db)
        self.cahier_repo = CahierTestGlobalRepository(db)
        self.notification_service = NotificationService(db)

    def _to_response(self, anomalie: Anomalie) -> AnomalieResponse:
        reporter_nom = None
        if anomalie.reporter:
            reporter_nom = f"{anomalie.reporter.prenom or ''} {anomalie.reporter.nom or ''}".strip() or anomalie.reporter.email

        assigned_nom = None
        if anomalie.assigned:
            assigned_nom = f"{anomalie.assigned.prenom or ''} {anomalie.assigned.nom or ''}".strip() or anomalie.assigned.email

        cas_test_ref = None
        cas_test_titre = None
        if anomalie.cas_test:
            cas_test_ref = anomalie.cas_test.test_ref
            cas_test_titre = anomalie.cas_test.test_case

        return AnomalieResponse(
            id=anomalie.id,
            titre=anomalie.titre,
            description=anomalie.description,
            severite=anomalie.severite,
            statut=anomalie.statut,
            priorite=anomalie.priorite,
            dateCreation=anomalie.dateCreation,
            dateResolution=anomalie.dateResolution,
            cas_test_id=anomalie.cas_test_id,
            resultat_id=anomalie.resultat_id,
            reporterId=anomalie.reporterId,
            assignedTo=anomalie.assignedTo,
            cas_test_ref=cas_test_ref,
            cas_test_titre=cas_test_titre,
            reporter_nom=reporter_nom,
            assigned_nom=assigned_nom,
        )

    def _normalize_role_code(self, value: str | None) -> str:
        raw = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
        return raw.strip().upper().replace(" ", "_")

    def _is_developer_role(self, role_code: str | None) -> bool:
        normalized = self._normalize_role_code(role_code)
        return normalized in {ROLE_DEVELOPPEUR, "DEVELOPER"}

    def _validate_developer_assignee(self, projet_id: int, user_id: int) -> Utilisateur:
        projet = self.db.query(Projet).filter(Projet.id == projet_id).first()
        if not projet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet introuvable.")

        member = next((m for m in (projet.membres or []) if m.id == user_id), None)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le developpeur assigne doit etre membre du projet.",
            )
        role_code = member.role.code if member.role else ""
        if not self._is_developer_role(role_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seul un developpeur du projet peut etre assigne a l'anomalie.",
            )
        return member

    def _notify_assignee(
        self,
        projet_id: int,
        assignee_id: int,
        anomalie: Anomalie,
        cas_ref: str,
        actor_id: int | None = None,
    ) -> None:
        self.notification_service.notify_users(
            user_ids=[assignee_id],
            titre=f"Anomalie assignee : {anomalie.titre}",
            message=f"Vous etes assigne a l'anomalie du cas {cas_ref}.",
            notification_type=TypeNotification.NEW_ASSIGNMENT,
            priorite="haute" if anomalie.severite == "CRITIQUE" else "moyenne",
            exclude_user_id=actor_id,
        )

    def _get_cas_in_projet(self, projet_id: int, cahier_id: int, cas_id: int):
        cahier = self.cahier_repo.get_by_id(cahier_id)
        if not cahier or cahier.projet_id != projet_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cahier introuvable.")

        cas = self.cahier_repo.get_cas_test(cas_id, cahier_id)
        if not cas:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cas de test introuvable.")
        return cahier, cas

    def list_by_projet(self, projet_id: int, statut: Optional[str] = None) -> List[AnomalieResponse]:
        rows = self.repo.get_by_projet(projet_id, statut=statut)
        return [self._to_response(row) for row in rows]

    def list_by_cas_test(
        self,
        projet_id: int,
        cahier_id: int,
        cas_id: int,
    ) -> List[AnomalieResponse]:
        self._get_cas_in_projet(projet_id, cahier_id, cas_id)
        rows = self.repo.get_by_cas_test(cas_id)
        return [self._to_response(row) for row in rows]

    def create_for_cas_test(
        self,
        projet_id: int,
        cahier_id: int,
        cas_id: int,
        reporter_id: int,
        payload: dict,
    ) -> AnomalieResponse:
        _, cas = self._get_cas_in_projet(projet_id, cahier_id, cas_id)

        if not _is_failed_or_blocked(cas.statut_test):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Une anomalie ne peut etre creee que pour un cas de test echoue ou bloque.",
            )

        assigned_to = payload.get("assigned_to")
        initial_statut = "NOUVEAU"
        if assigned_to:
            self._validate_developer_assignee(projet_id, assigned_to)
            initial_statut = "EN_COURS"

        anomalie = Anomalie(
            titre=payload["titre"],
            description=payload.get("description"),
            severite=payload.get("severite") or "MAJEURE",
            priorite=payload.get("priorite") or "MOYENNE",
            statut=initial_statut,
            cas_test_id=cas_id,
            reporterId=reporter_id,
            assignedTo=assigned_to,
        )
        self.db.add(anomalie)
        self.db.commit()
        self.db.refresh(anomalie)

        created = self.repo.get_by_id_for_projet(anomalie.id, projet_id)
        if assigned_to and created:
            self._notify_assignee(
                projet_id=projet_id,
                assignee_id=assigned_to,
                anomalie=created,
                cas_ref=cas.test_ref,
                actor_id=reporter_id,
            )
        titre_notif = f"Anomalie : {anomalie.titre}"
        message = f"Anomalie enregistree sur le cas {cas.test_ref} ({cas.test_case[:80]})."
        priorite = "haute" if anomalie.severite == "CRITIQUE" else "moyenne"
        notif_type = (
            TypeNotification.BUG_DETECTED
            if anomalie.severite == "CRITIQUE"
            else TypeNotification.ANOMALY_CREATED
        )
        self.notification_service.notify_project_users(
            project_id=projet_id,
            titre=titre_notif,
            message=message,
            notification_type=notif_type,
            priorite=priorite,
            exclude_user_id=reporter_id,
        )

        return self._to_response(created or anomalie)

    def update(
        self,
        projet_id: int,
        anomalie_id: int,
        payload: dict,
    ) -> AnomalieResponse:
        anomalie = self.repo.get_by_id_for_projet(anomalie_id, projet_id)
        if not anomalie:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anomalie introuvable.")

        for field in ("titre", "description", "severite", "priorite", "statut"):
            if field in payload and payload[field] is not None:
                setattr(anomalie, field, payload[field])

        self.db.commit()
        self.db.refresh(anomalie)
        return self._to_response(anomalie)

    def resolve(self, projet_id: int, anomalie_id: int) -> AnomalieResponse:
        anomalie = self.repo.get_by_id_for_projet(anomalie_id, projet_id)
        if not anomalie:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anomalie introuvable.")
        resolved = self.repo.resolve_anomalie(anomalie_id)
        return self._to_response(resolved)

    def assign(
        self,
        projet_id: int,
        anomalie_id: int,
        user_id: int,
        actor_id: int | None = None,
    ) -> AnomalieResponse:
        anomalie = self.repo.get_by_id_for_projet(anomalie_id, projet_id)
        if not anomalie:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anomalie introuvable.")
        self._validate_developer_assignee(projet_id, user_id)
        assigned = self.repo.assign_anomalie(anomalie_id, user_id)
        cas_ref = anomalie.cas_test.test_ref if anomalie.cas_test else "cas de test"
        if assigned:
            self._notify_assignee(
                projet_id=projet_id,
                assignee_id=user_id,
                anomalie=assigned,
                cas_ref=cas_ref,
                actor_id=actor_id,
            )
        return self._to_response(assigned)

    def reopen(self, projet_id: int, anomalie_id: int) -> AnomalieResponse:
        anomalie = self.repo.get_by_id_for_projet(anomalie_id, projet_id)
        if not anomalie:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anomalie introuvable.")
        reopened = self.repo.reopen_anomalie(anomalie_id)
        return self._to_response(reopened)
