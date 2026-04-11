import io
import json
import re
from datetime import datetime
from typing import Optional

import requests
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.config import AI_API_KEY, AI_API_URL, AI_MODEL
from models.cahier_test_global import CahierTestGlobal, CasTest, CasTestHistory
from models.notification import TypeNotification
from models.rapports import IndicateurQualite, RapportQA, RecommandationQualite
from services.api_key_service import APIKeyService
from services.notification_service import NotificationService

RAPPORT_QA_SYSTEM_PROMPT = """\
Tu es un lead QA.
Tu recois les metriques d'execution du cahier de tests.
Tu dois generer une evaluation qualite concise et actionnable.

Retourne UNIQUEMENT un JSON valide:
{
  \"statut\": \"brouillon|valide\",
  \"recommandations\": \"texte\",
  \"tendance\": \"amelioration|stable|degradation\",
  \"indice_qualite\": 0.0,
  \"nombre_anomalies_critiques\": 0,
  \"recommandations_qualite\": [
    {
      \"titre\": \"texte\",
      \"description\": \"texte\",
      \"categorie\": \"stabilite|fiabilite|couverture|performance|process\",
      \"priorite\": \"basse|moyenne|haute\",
      \"impact\": 0.0
    }
  ]
}
"""


class RapportService:
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)
        self.api_key_service = APIKeyService(db)

    def _verifier_appartenance(self, cahier_id: int, projet_id: int) -> CahierTestGlobal:
        cahier = (
            self.db.query(CahierTestGlobal)
            .filter(CahierTestGlobal.id == cahier_id, CahierTestGlobal.projet_id == projet_id)
            .first()
        )
        if not cahier:
            raise HTTPException(status_code=404, detail="Cahier introuvable.")
        return cahier

    @staticmethod
    def _increment_report_minor_version(current_version: Optional[str]) -> str:
        major, minor, patch = 1, 0, 0
        if current_version:
            match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", current_version.strip())
            if match:
                major, minor, patch = map(int, match.groups())
        return f"{major}.{minor + 1}.0"

    @staticmethod
    def _is_critical_case(cas: CasTest) -> bool:
        critical_keywords = (
            "auth",
            "login",
            "paiement",
            "payment",
            "securite",
            "security",
            "permission",
            "token",
            "checkout",
        )
        haystack = " ".join(
            [
                cas.test_case or "",
                cas.test_purpose or "",
                cas.module or "",
                cas.sous_module or "",
            ]
        ).lower()
        return any(keyword in haystack for keyword in critical_keywords)

    def _compute_rapport_stats(self, cahier: CahierTestGlobal) -> dict:
        total = cahier.nombre_total or 0
        reussi = cahier.nombre_reussi or 0
        echoue = cahier.nombre_echoue or 0
        bloque = cahier.nombre_bloque or 0
        executes = max(0, reussi + echoue + bloque)
        non_executes = max(0, total - executes)

        taux_reussite = round((reussi / executes) * 100, 2) if executes > 0 else 0.0
        taux_couverture = round((executes / total) * 100, 2) if total > 0 else 0.0

        tests = list(cahier.cas_tests or [])
        critical_failed = sum(
            1
            for cas in tests
            if cas.statut_test in ("Echoue", "Échoué", "Bloque", "Bloqué") and self._is_critical_case(cas)
        )

        bug_recurrence_rows = (
            self.db.query(CasTestHistory.cas_test_id, func.count(CasTestHistory.id).label("events"))
            .filter(
                CasTestHistory.cahier_id == cahier.id,
                CasTestHistory.new_statut_test.in_(["Echoue", "Échoué", "Bloque", "Bloqué"]),
            )
            .group_by(CasTestHistory.cas_test_id)
            .all()
        )
        bug_recurrence = int(sum(max(0, int(row.events) - 1) for row in bug_recurrence_rows))

        anomalies_total = max(0, echoue + bloque)

        return {
            "total": total,
            "reussi": reussi,
            "echoue": echoue,
            "bloque": bloque,
            "executes": executes,
            "non_executes": non_executes,
            "taux_reussite": taux_reussite,
            "taux_couverture": taux_couverture,
            "critical_failed": critical_failed,
            "bug_recurrence": bug_recurrence,
            "anomalies_total": anomalies_total,
        }

    def _build_manual_recommendations(self, stats: dict) -> dict:
        tendance = "stable"
        if stats["taux_reussite"] < 60 or stats["critical_failed"] >= 3:
            tendance = "degradation"
        elif stats["taux_reussite"] >= 85 and stats["bug_recurrence"] == 0:
            tendance = "amelioration"

        recommandations = []
        recommandations_qualite = []

        if stats["echoue"] > 0:
            recommandations.append(
                f"Traiter prioritairement {stats['echoue']} test(s) en echec et verifier les regressions associees."
            )
            recommandations_qualite.append(
                {
                    "titre": "Corriger les echecs de tests",
                    "description": "Prioriser les tests en echec avec analyse de cause racine.",
                    "categorie": "fiabilite",
                    "priorite": "haute",
                    "impact": 0.9,
                }
            )

        if stats["critical_failed"] > 0:
            recommandations.append(
                f"Stabiliser les parcours critiques ({stats['critical_failed']} test(s) critiques en echec/bloques)."
            )
            recommandations_qualite.append(
                {
                    "titre": "Stabiliser les parcours critiques",
                    "description": "Executer un plan de correction cible sur authentification, securite et paiement.",
                    "categorie": "stabilite",
                    "priorite": "haute",
                    "impact": 0.95,
                }
            )

        if stats["bug_recurrence"] > 0:
            recommandations.append(
                f"Reduire la recurrence des bugs ({stats['bug_recurrence']} recurrence(s) detectee(s))."
            )
            recommandations_qualite.append(
                {
                    "titre": "Reduire la recurrence des bugs",
                    "description": "Ajouter des tests de non-regression et renforcer la revue de correctifs.",
                    "categorie": "process",
                    "priorite": "moyenne",
                    "impact": 0.7,
                }
            )

        if stats["taux_couverture"] < 80:
            recommandations.append(
                f"Augmenter la couverture d'execution (actuel: {stats['taux_couverture']}%)."
            )
            recommandations_qualite.append(
                {
                    "titre": "Augmenter la couverture de tests",
                    "description": "Executer les cas non lances et completer les scenarios manquants.",
                    "categorie": "couverture",
                    "priorite": "moyenne",
                    "impact": 0.65,
                }
            )

        if not recommandations:
            recommandations.append("Le niveau qualite est satisfaisant. Continuer la surveillance des tests critiques.")
            recommandations_qualite.append(
                {
                    "titre": "Maintenir la qualite actuelle",
                    "description": "Conserver la strategie de test actuelle et monitorer les evolutions.",
                    "categorie": "fiabilite",
                    "priorite": "basse",
                    "impact": 0.4,
                }
            )

        indice_qualite = max(0.0, min(10.0, round((stats["taux_reussite"] * 0.7 + stats["taux_couverture"] * 0.3) / 10, 2)))

        return {
            "statut": "brouillon",
            "recommandations": "\n".join(recommandations),
            "tendance": tendance,
            "indice_qualite": indice_qualite,
            "nombre_anomalies_critiques": stats["critical_failed"],
            "recommandations_qualite": recommandations_qualite,
        }

    def _get_api_key_for_request(self, user_id: Optional[int]) -> str:
        if user_id:
            custom = self.api_key_service.get_api_key_for_user(user_id)
            if custom:
                return custom
        if not AI_API_KEY:
            raise HTTPException(status_code=500, detail="Aucune cle API configuree pour la generation IA.")
        return AI_API_KEY

    def _generer_rapport_qa_ia(self, cahier: CahierTestGlobal, stats: dict, user_id: Optional[int]) -> dict:
        prompt = (
            "Genere un rapport QA base sur les donnees d'execution du cahier de tests global.\n"
            f"Version cahier: {cahier.version}\n"
            f"Total tests: {stats['total']}\n"
            f"Tests executes: {stats['executes']}\n"
            f"Tests non executes: {stats['non_executes']}\n"
            f"Tests reussis: {stats['reussi']}\n"
            f"Tests echoues: {stats['echoue']}\n"
            f"Tests bloques: {stats['bloque']}\n"
            f"Taux de reussite: {stats['taux_reussite']}\n"
            f"Couverture des tests: {stats['taux_couverture']}\n"
            f"Tests critiques en echec/bloques: {stats['critical_failed']}\n"
            f"Recurrence de bugs: {stats['bug_recurrence']}\n"
        )

        try:
            api_key = self._get_api_key_for_request(user_id)
            payload = {
                "model": AI_MODEL,
                "messages": [
                    {"role": "system", "content": RAPPORT_QA_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 1200,
            }
            clean_api_key = api_key.strip().strip('"').strip("'")
            headers = {
                "Authorization": f"Bearer {clean_api_key}",
                "Content-Type": "application/json",
            }
            resp = requests.post(AI_API_URL, json=payload, headers=headers, timeout=120)
            if not resp.ok:
                raise ValueError(f"Erreur IA {resp.status_code}: {resp.text}")
            content = resp.json()["choices"][0]["message"]["content"]
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, re.DOTALL)
            if match:
                parsed = json.loads(match.group(1))
            else:
                start = content.find("{")
                end = content.rfind("}") + 1
                parsed = json.loads(content[start:end])

            items = parsed.get("recommandations_qualite") or []
            normalized_items = []
            for item in items[:6]:
                normalized_items.append(
                    {
                        "titre": str(item.get("titre") or "Action qualite"),
                        "description": str(item.get("description") or ""),
                        "categorie": str(item.get("categorie") or "fiabilite"),
                        "priorite": str(item.get("priorite") or "moyenne"),
                        "impact": float(item.get("impact") or 0.5),
                    }
                )

            return {
                "statut": str(parsed.get("statut") or "brouillon"),
                "recommandations": str(parsed.get("recommandations") or "").strip(),
                "tendance": str(parsed.get("tendance") or "stable"),
                "indice_qualite": float(parsed.get("indice_qualite") or 0.0),
                "nombre_anomalies_critiques": int(parsed.get("nombre_anomalies_critiques") or 0),
                "recommandations_qualite": normalized_items,
            }
        except Exception:
            return self._build_manual_recommendations(stats)

    @staticmethod
    def _sync_recommandations_qualite(rapport: RapportQA, items: list[dict]) -> None:
        rapport.recommandations_qualite.clear()
        for item in items:
            rapport.recommandations_qualite.append(
                RecommandationQualite(
                    titre=item.get("titre"),
                    description=item.get("description"),
                    categorie=item.get("categorie"),
                    priorite=item.get("priorite"),
                    impact=float(item.get("impact") or 0.0),
                    statut="ouverte",
                )
            )

    def generer_rapport_qa(
        self,
        cahier_id: int,
        projet_id: int,
        user_id: int,
        mode_generation: str = "manuelle",
        version: Optional[str] = None,
        recommandations: Optional[str] = None,
    ) -> RapportQA:
        cahier = self._verifier_appartenance(cahier_id, projet_id)
        stats = self._compute_rapport_stats(cahier)

        generated_payload = self._build_manual_recommendations(stats)
        if mode_generation == "ai":
            generated_payload = self._generer_rapport_qa_ia(cahier, stats, user_id)

        if recommandations and mode_generation == "manuelle":
            generated_payload["recommandations"] = recommandations

        rapport = self.db.query(RapportQA).filter(RapportQA.cahierId == cahier_id).first()
        next_version = version or self._increment_report_minor_version(rapport.version if rapport else None)

        if not rapport:
            rapport = RapportQA(
                cahierId=cahier_id,
                version=next_version,
                dateGeneration=datetime.utcnow(),
                statut=generated_payload.get("statut") or "brouillon",
                tauxReussite=stats["taux_reussite"],
                nombreTestsExecutes=stats["executes"],
                nombreTestsReussis=stats["reussi"],
                nombreTestsEchoues=stats["echoue"],
                recommandations=generated_payload.get("recommandations") or "",
            )
            self.db.add(rapport)
            self.db.flush()
        else:
            rapport.version = next_version
            rapport.dateGeneration = datetime.utcnow()
            rapport.statut = generated_payload.get("statut") or "brouillon"
            rapport.tauxReussite = stats["taux_reussite"]
            rapport.nombreTestsExecutes = stats["executes"]
            rapport.nombreTestsReussis = stats["reussi"]
            rapport.nombreTestsEchoues = stats["echoue"]
            rapport.recommandations = generated_payload.get("recommandations") or ""

        indicateur = rapport.indicateurs
        if indicateur is None:
            indicateur = IndicateurQualite(rapportId=rapport.id)
            self.db.add(indicateur)

        indicateur.tauxCouverture = stats["taux_couverture"]
        indicateur.tauxReussite = stats["taux_reussite"]
        indicateur.nombreAnomalies = stats["anomalies_total"]
        indicateur.nombreAnomaliesCritiques = max(0, int(generated_payload.get("nombre_anomalies_critiques") or 0))
        indicateur.indiceQualite = max(0.0, float(generated_payload.get("indice_qualite") or 0.0))
        indicateur.tendance = generated_payload.get("tendance") or "stable"

        self._sync_recommandations_qualite(
            rapport,
            generated_payload.get("recommandations_qualite") or [],
        )

        self.db.commit()
        self.db.refresh(rapport)

        self.notification_service.notify_user(
            user_id=user_id,
            titre="Rapport QA genere",
            message=f"Le rapport QA v{rapport.version} a ete genere pour le cahier {cahier_id}.",
            notification_type=TypeNotification.REPORT_GENERATED,
            priorite="moyenne",
        )

        return rapport

    def get_rapport_qa(self, cahier_id: int, projet_id: int) -> RapportQA:
        self._verifier_appartenance(cahier_id, projet_id)
        rapport = self.db.query(RapportQA).filter(RapportQA.cahierId == cahier_id).first()
        if not rapport:
            raise HTTPException(status_code=404, detail="Aucun rapport QA genere pour ce cahier.")
        return rapport

    def update_rapport_qa(self, cahier_id: int, projet_id: int, user_id: int, payload: dict) -> RapportQA:
        rapport = self.get_rapport_qa(cahier_id, projet_id)

        if payload.get("statut") is not None:
            rapport.statut = payload["statut"]
        if payload.get("recommandations") is not None:
            rapport.recommandations = payload["recommandations"]

        rapport.version = payload.get("version") or self._increment_report_minor_version(rapport.version)
        rapport.dateGeneration = datetime.utcnow()

        self.db.commit()
        self.db.refresh(rapport)

        self.notification_service.notify_user(
            user_id=user_id,
            titre="Rapport QA modifie",
            message=f"Le rapport QA v{rapport.version} a ete mis a jour.",
            notification_type=TypeNotification.REPORT_GENERATED,
            priorite="moyenne",
        )

        return rapport

    def exporter_rapport_qa_pdf(self, cahier_id: int, projet_id: int) -> bytes:
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="La bibliotheque reportlab est requise pour l'export PDF. Installez-la avec : pip install reportlab",
            )

        rapport = self.get_rapport_qa(cahier_id, projet_id)
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph(f"Rapport QA v{rapport.version}", styles["Title"]))
        story.append(Spacer(1, 8))
        story.append(Paragraph(f"Projet ID: {projet_id} | Cahier ID: {cahier_id}", styles["Normal"]))
        story.append(Paragraph(f"Date: {rapport.dateGeneration}", styles["Normal"]))
        story.append(Paragraph(f"Statut: {rapport.statut}", styles["Normal"]))
        story.append(Paragraph(f"Taux de reussite: {rapport.tauxReussite}%", styles["Normal"]))
        story.append(Paragraph(f"Tests executes: {rapport.nombreTestsExecutes}", styles["Normal"]))
        story.append(Paragraph(f"Tests reussis: {rapport.nombreTestsReussis}", styles["Normal"]))
        story.append(Paragraph(f"Tests echoues: {rapport.nombreTestsEchoues}", styles["Normal"]))

        if rapport.indicateurs:
            story.append(Spacer(1, 8))
            story.append(Paragraph("Indicateurs", styles["Heading2"]))
            story.append(Paragraph(f"Couverture: {rapport.indicateurs.tauxCouverture}%", styles["Normal"]))
            story.append(Paragraph(f"Tendance: {rapport.indicateurs.tendance}", styles["Normal"]))
            story.append(Paragraph(f"Indice qualite: {rapport.indicateurs.indiceQualite}", styles["Normal"]))

        story.append(Spacer(1, 12))
        story.append(Paragraph("Recommandations", styles["Heading2"]))
        story.append(Paragraph(rapport.recommandations or "Aucune recommandation.", styles["Normal"]))

        if rapport.recommandations_qualite:
            story.append(Spacer(1, 8))
            story.append(Paragraph("Actions recommandees", styles["Heading2"]))
            for rec in rapport.recommandations_qualite:
                story.append(Paragraph(f"- {rec.titre} ({rec.priorite})", styles["Normal"]))

        doc.build(story)
        buf.seek(0)
        return buf.read()

    def exporter_rapport_qa_word(self, cahier_id: int, projet_id: int) -> bytes:
        try:
            from docx import Document
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="La bibliotheque python-docx est requise pour l'export Word. Installez-la avec : pip install python-docx",
            )

        rapport = self.get_rapport_qa(cahier_id, projet_id)

        doc = Document()
        doc.add_heading(f"Rapport QA v{rapport.version}", 0)
        doc.add_paragraph(f"Projet ID: {projet_id}")
        doc.add_paragraph(f"Cahier ID: {cahier_id}")
        doc.add_paragraph(f"Date: {rapport.dateGeneration}")
        doc.add_paragraph(f"Statut: {rapport.statut}")
        doc.add_paragraph(f"Taux de reussite: {rapport.tauxReussite}%")
        doc.add_paragraph(f"Tests executes: {rapport.nombreTestsExecutes}")
        doc.add_paragraph(f"Tests reussis: {rapport.nombreTestsReussis}")
        doc.add_paragraph(f"Tests echoues: {rapport.nombreTestsEchoues}")

        if rapport.indicateurs:
            doc.add_heading("Indicateurs", level=1)
            doc.add_paragraph(f"Couverture: {rapport.indicateurs.tauxCouverture}%")
            doc.add_paragraph(f"Tendance: {rapport.indicateurs.tendance}")
            doc.add_paragraph(f"Indice qualite: {rapport.indicateurs.indiceQualite}")

        doc.add_heading("Recommandations", level=1)
        doc.add_paragraph(rapport.recommandations or "Aucune recommandation.")

        if rapport.recommandations_qualite:
            doc.add_heading("Actions recommandees", level=1)
            for rec in rapport.recommandations_qualite:
                doc.add_paragraph(f"- {rec.titre} ({rec.priorite})")

        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        return buf.read()
