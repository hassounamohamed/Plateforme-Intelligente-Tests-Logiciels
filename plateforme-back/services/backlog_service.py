"""
Service métier pour la vue backlog projet
"""
import json
import re
from typing import List, Optional
import requests
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.config import AI_API_KEY, AI_API_URL, AI_MODEL
from repositories.backlog_repository import BacklogRepository
from repositories.projet_repository import ProjetRepository
from schemas.backlog import ReordonnerBacklogRequest

TRIS_VALIDES = {"priorite", "points", "ordre", "statut"}
STATUTS_VALIDES = {"to_do", "in_progress", "done"}
PRIORITES_VALIDES = {"must_have", "should_have", "could_have", "wont_have"}


class BacklogService:
    def __init__(self, db: Session):
        self.repo = BacklogRepository(db)
        self.projet_repo = ProjetRepository(db)
        self.api_key_service = None

    def _get_api_key_service(self):
        if self.api_key_service is None:
            from services.api_key_service import APIKeyService
            self.api_key_service = APIKeyService(self.repo.db)
        return self.api_key_service

    def _get_api_key_for_request(self, current_user_id: int) -> str:
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
        text = (raw_text or "").strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]
        return json.loads(text)

    def _verifier_projet(self, projet_id: int):
        projet = self.projet_repo.get_by_id(projet_id)
        if not projet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Projet {projet_id} introuvable.")
        return projet

    # ── Backlog ──────────────────────────────────────────────────────────────

    def get_backlog(
        self,
        projet_id: int,
        module_id: Optional[int],
        epic_id: Optional[int],
        statut: Optional[str],
        priorite: Optional[str],
        non_planifiees: bool,
        tri: str,
    ) -> List:
        self._verifier_projet(projet_id)

        if statut and statut not in STATUTS_VALIDES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Statut invalide. Valeurs : {', '.join(STATUTS_VALIDES)}",
            )
        if priorite and priorite not in PRIORITES_VALIDES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Priorité invalide. Valeurs : {', '.join(PRIORITES_VALIDES)}",
            )
        if tri not in TRIS_VALIDES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Tri invalide. Valeurs : {', '.join(TRIS_VALIDES)}",
            )

        return self.repo.get_backlog(
            projet_id=projet_id,
            module_id=module_id,
            epic_id=epic_id,
            statut=statut,
            priorite=priorite,
            non_planifiees=non_planifiees,
            tri=tri,
        )

    # ── Indicateurs ──────────────────────────────────────────────────────────

    def get_indicateurs(self, projet_id: int) -> dict:
        self._verifier_projet(projet_id)
        return self.repo.get_indicateurs(projet_id)

    # ── Drag & drop ──────────────────────────────────────────────────────────

    def reordonner(self, projet_id: int, data: ReordonnerBacklogRequest) -> List:
        self._verifier_projet(projet_id)
        return self.repo.reordonner(projet_id, data.ordre)

    def suggest_backlog_item(self, projet_id: int, prompt: str, current_user_id: int) -> dict:
        projet = self._verifier_projet(projet_id)
        api_key = self._get_api_key_for_request(current_user_id)

        system_prompt = (
            "Tu aides un Product Owner a rediger une user story Scrum. "
            "Reponds UNIQUEMENT en JSON valide avec les cles exactes: "
            "titre, role, action, benefice, criteresAcceptation, priorite, points, duree_estimee. "
            "priorite doit etre parmi must_have, should_have, could_have, wont_have. "
            "points doit etre parmi 1,2,3,5,8,13,21 quand present. "
            "Si une valeur est inconnue, renvoie null."
        )
        user_prompt = f"Projet: {projet.nom}\nContexte:\n{prompt}"

        payload = {
            "model": AI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
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
            "titre": parsed.get("titre") or None,
            "role": parsed.get("role") or None,
            "action": parsed.get("action") or None,
            "benefice": parsed.get("benefice") or None,
            "criteresAcceptation": parsed.get("criteresAcceptation") or None,
            "priorite": parsed.get("priorite") or None,
            "points": parsed.get("points") or None,
            "duree_estimee": parsed.get("duree_estimee") or None,
        }
