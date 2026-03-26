"""
Service du Cahier de Tests Global.

Fonctionnalités :
  1. Démarrer la génération (non-bloquant) → retourne AIGeneration immédiatement
  2. Exécuter la génération en arrière-plan (BackgroundTask) avec logs dans ai_logs
  3. Valider le cahier
  4. Mettre à jour un cas de test
  5. Exporter en PDF, Word, Excel
"""
from __future__ import annotations

import io
import json
import os
import re
import time
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from core.config import AI_API_KEY, AI_MODEL, AI_API_URL
from models.ai_generation import AIGeneration
from models.scrum import Projet, Sprint, UserStory, Module, Epic
from models.cahier_test_global import CahierTestGlobal, CasTest
from repositories.ai_generation_repository import AIGenerationRepository
from repositories.cahier_test_global_repository import CahierTestGlobalRepository
from schemas.cahier_test_global import (
    AICahierResponse,
    CreateCasTestRequest,
    UpdateCasTestRequest,
)

# ─── Prompt système ───────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
Tu es un expert en qualité logicielle et en tests. Ton rôle est de générer \
un cahier de tests complet et structuré pour un projet Scrum à partir \
de la liste de ses sprints et user stories.

Règles strictes :
1. Pour chaque user story, génère entre 2 et 5 cas de tests couvrant \
   les scénarios nominaux, alternatifs et d'erreur.
2. Chaque cas de test doit contenir :
   - sprint          : nom du sprint (ex: "Sprint 1")
   - module          : nom du module lié à la user story
   - sous_module     : sous-composant ou fonctionnalité précise
   - test_ref        : référence unique au format TC-XXX (ex: TC-001)
   - test_case       : titre court et descriptif du cas de test
   - test_purpose    : objectif du test en une phrase
   - type_utilisateur: type d'utilisateur impliqué (ex: Admin, Utilisateur, Testeur)
   - scenario_test   : étapes numérotées du scénario (ex: "1. Ouvrir... 2. Saisir...")
   - resultat_attendu: résultat observable attendu après exécution
   - type_test       : "Manuel" ou "Automatisé"
3. Les test_ref doivent être séquentiels et uniques (TC-001, TC-002, …).
4. Retourne UNIQUEMENT un objet JSON valide, aucun texte avant ou après.

Structure JSON attendue :
{
  "cas_tests": [
    {
      "sprint": "Sprint 1",
      "module": "Authentification",
      "sous_module": "Connexion",
      "test_ref": "TC-001",
      "test_case": "Connexion avec identifiants valides",
      "test_purpose": "Vérifier que l'utilisateur peut se connecter avec des identifiants corrects",
      "type_utilisateur": "Utilisateur",
      "scenario_test": "1. Ouvrir la page de connexion\\n2. Saisir l'email valide\\n3. Saisir le mot de passe correct\\n4. Cliquer sur Connexion",
      "resultat_attendu": "L'utilisateur est redirigé vers le tableau de bord",
      "type_test": "Manuel"
    }
  ]
}
"""

USER_PROMPT_TEMPLATE = """\
Voici les informations du projet Scrum :

Projet : {projet_nom}
Description : {projet_description}

Sprints et User Stories :
{sprints_content}

Génère le cahier de tests complet en JSON selon le schéma demandé.
"""


class CahierTestGlobalService:

    def __init__(self, db: Session):
        self.db      = db
        self.repo    = CahierTestGlobalRepository(db)
        self.ai_repo = AIGenerationRepository(db)

    # ─── Points d'entrée publics ──────────────────────────────────────────

    def demarrer_generation(
        self,
        projet_id: int,
        user_id: int,
        version: str = "1.0.0",
        mode_generation: str = "ai",
    ) -> AIGeneration | CahierTestGlobal:
        """
        Crée le job AIGeneration + initialise le CahierTestGlobal.
        Retourne immédiatement le job (status=pending).
        L'appelant doit lancer `executer_generation` en BackgroundTask.
        """
        projet = self.db.query(Projet).filter(Projet.id == projet_id).first()
        if not projet:
            raise HTTPException(status_code=404, detail="Projet introuvable.")

        # Mode manuel : initialise un cahier vide, sans job IA.
        if mode_generation == "manuelle":
            cahier = self.repo.get_by_projet(projet_id)
            if cahier:
                self.repo.delete_cas_tests(cahier.id)
                cahier.version = version
                cahier.statut = "brouillon"
                cahier.date_generation = datetime.utcnow()
                cahier.generated_by_id = user_id
                cahier.ai_generation_id = None
                cahier.nombre_total = 0
                cahier.nombre_reussi = 0
                cahier.nombre_echoue = 0
                cahier.nombre_bloque = 0
                self.db.commit()
                self.db.refresh(cahier)
            else:
                cahier = CahierTestGlobal(
                    projet_id=projet_id,
                    generated_by_id=user_id,
                    version=version,
                    statut="brouillon",
                    ai_generation_id=None,
                    nombre_total=0,
                    nombre_reussi=0,
                    nombre_echoue=0,
                    nombre_bloque=0,
                )
                self.db.add(cahier)
                self.db.commit()
                self.db.refresh(cahier)
            return cahier

        # Créer le job de génération IA (type=generate_tests)
        gen = self.ai_repo.create_generation(projet_id, user_id, "generate_tests")

        # Créer ou réinitialiser le cahier
        cahier = self.repo.get_by_projet(projet_id)
        if cahier:
            self.repo.delete_cas_tests(cahier.id)
            cahier.version          = version
            cahier.statut           = "generating"
            cahier.date_generation  = datetime.utcnow()
            cahier.generated_by_id  = user_id
            cahier.ai_generation_id = gen.id
            cahier.nombre_total     = 0
            cahier.nombre_reussi    = 0
            cahier.nombre_echoue    = 0
            cahier.nombre_bloque    = 0
            self.db.commit()
            self.db.refresh(cahier)
        else:
            cahier = self.repo.create_cahier(projet_id, user_id, version, ai_generation_id=gen.id)

        return gen

    def create_cas_test(
        self,
        cahier_id: int,
        projet_id: int,
        data: CreateCasTestRequest,
    ) -> CasTest:
        """Créer un cas de test manuel dans un cahier existant."""
        self._verifier_appartenance(cahier_id, projet_id)

        last_cas = (
            self.db.query(CasTest)
            .filter(CasTest.cahier_id == cahier_id)
            .order_by(CasTest.ordre.desc())
            .first()
        )
        next_order = (last_cas.ordre + 1) if last_cas else 1

        cas = self.repo.add_cas_test(
            cahier_id=cahier_id,
            sprint=data.sprint or "",
            module=data.module or "",
            sous_module=data.sous_module or "",
            test_ref=f"TC-{next_order:03d}",
            test_case=data.test_case,
            test_purpose=data.test_purpose or "",
            type_utilisateur=data.type_utilisateur or "",
            scenario_test=data.scenario_test or "",
            resultat_attendu=data.resultat_attendu or "",
            type_test=data.type_test,
            ordre=next_order,
        )

        if data.commentaire is not None:
            cas.commentaire = data.commentaire
            self.db.commit()
            self.db.refresh(cas)

        # Toute création manuelle d'un cas incrémente la version mineure du cahier.
        cahier = self.repo.get_by_id(cahier_id)
        if cahier:
            cahier.version = self._increment_cahier_minor_version(cahier.version)

        self.repo.recalculer_stats(cahier_id)
        return cas

    def _increment_cahier_minor_version(self, current_version: Optional[str]) -> str:
        """
        Incrémente la version mineure du cahier : X.Y.Z -> X.(Y+1).0
        Exemple: 1.0.0 -> 1.1.0
        """
        default_major, default_minor, default_patch = 1, 0, 0
        if not current_version:
            major, minor, patch = default_major, default_minor, default_patch
        else:
            match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", current_version.strip())
            if not match:
                major, minor, patch = default_major, default_minor, default_patch
            else:
                major, minor, patch = map(int, match.groups())

        return f"{major}.{minor + 1}.0"

    def executer_generation(self, generation_id: int) -> None:
        """
        Logique principale exécutée en arrière-plan.
        Toutes les étapes sont loguées dans ai_logs.
        """
        try:
            self._run(generation_id)
        except Exception as exc:
            self.ai_repo.update_status(generation_id, "failed", 0)
            self.ai_repo.add_log(generation_id, "error", str(exc), 0)
            # Mettre le cahier en erreur
            gen = self.ai_repo.get_by_id(generation_id)
            if gen:
                cahier = self.repo.get_by_projet(gen.projet_id)
                if cahier and cahier.ai_generation_id == generation_id:
                    cahier.statut = "failed"
                    self.db.commit()

    def get_generation(self, generation_id: int, projet_id: int) -> AIGeneration:
        gen = self.ai_repo.get_detail(generation_id)
        if not gen or gen.projet_id != projet_id or gen.type != "generate_tests":
            raise HTTPException(status_code=404, detail="Génération introuvable.")
        return gen

    def list_generations(self, projet_id: int) -> List[AIGeneration]:
        return (
            self.db.query(AIGeneration)
            .filter(
                AIGeneration.projet_id == projet_id,
                AIGeneration.type == "generate_tests",
            )
            .order_by(AIGeneration.created_at.desc())
            .all()
        )

    def valider_cahier(self, cahier_id: int, projet_id: int, version: Optional[str]) -> CahierTestGlobal:
        self._verifier_appartenance(cahier_id, projet_id)
        return self.repo.valider(cahier_id, version)

    def update_cas_test(
        self, cahier_id: int, cas_id: int, projet_id: int, data: UpdateCasTestRequest
    ) -> CasTest:
        self._verifier_appartenance(cahier_id, projet_id)
        cas = self.repo.get_cas_test(cas_id, cahier_id)
        if not cas:
            raise HTTPException(status_code=404, detail="Cas de test introuvable.")
        updated = self.repo.update_cas_test(
            cas_id, cahier_id, data.model_dump(exclude_none=True)
        )
        if data.statut_test is not None:
            self.repo.recalculer_stats(cahier_id)
        return updated

    def get_cahier(self, projet_id: int) -> CahierTestGlobal:
        cahier = self.repo.get_by_projet(projet_id)
        if not cahier:
            raise HTTPException(status_code=404, detail="Aucun cahier de tests généré pour ce projet.")
        return cahier

    def get_cahier_detail(self, projet_id: int) -> CahierTestGlobal:
        cahier = self.repo.get_detail_by_projet(projet_id)
        if not cahier:
            raise HTTPException(status_code=404, detail="Aucun cahier de tests généré pour ce projet.")
        return cahier

    def get_statistiques(self, projet_id: int) -> dict:
        cahier = self.repo.get_by_projet(projet_id)
        if not cahier:
            raise HTTPException(status_code=404, detail="Aucun cahier de tests généré pour ce projet.")
        total       = cahier.nombre_total  or 0
        reussi      = cahier.nombre_reussi or 0
        echoue      = cahier.nombre_echoue or 0
        bloque      = cahier.nombre_bloque or 0
        non_execute = max(0, total - reussi - echoue - bloque)
        def pct(val: int) -> float:
            return round(val / total * 100, 1) if total > 0 else 0.0
        return {
            "version":            cahier.version,
            "nombre_total":       total,
            "nombre_reussi":      reussi,
            "nombre_echoue":      echoue,
            "nombre_bloque":      bloque,
            "nombre_non_execute": non_execute,
            "pct_reussi":         pct(reussi),
            "pct_echoue":         pct(echoue),
            "pct_bloque":         pct(bloque),
            "pct_non_execute":    pct(non_execute),
        }

    def list_cas_tests(self, cahier_id: int, projet_id: int) -> list:
        self._verifier_appartenance(cahier_id, projet_id)
        return self.repo.list_cas_tests(cahier_id)

    # ─── Logique interne de génération ────────────────────────────────────

    def _run(self, generation_id: int) -> None:

        # ── Étape 1 : Démarrage ────────────────────────────────────────────
        self.ai_repo.update_status(generation_id, "processing", 5)
        self.ai_repo.add_log(generation_id, "init",
                             "Démarrage de la génération du cahier de tests…", 5)

        gen = self.ai_repo.get_by_id(generation_id)
        projet = self.db.query(Projet).filter(Projet.id == gen.projet_id).first()

        # ── Étape 2 : Récupérer sprints & user stories ─────────────────────
        self.ai_repo.add_log(generation_id, "reading_sprints",
                             "Récupération des sprints et user stories…", 15)
        self.ai_repo.update_progress(generation_id, 15)

        sprints_content = self._construire_contenu_sprints(gen.projet_id)

        nb_sprints = sprints_content.count("--- Sprint") + sprints_content.count("---")
        self.ai_repo.add_log(generation_id, "reading_sprints",
                             f"Données récupérées ({len(sprints_content)} caractères).", 25)
        self.ai_repo.update_progress(generation_id, 25)

        # ── Étape 3 : Envoi du prompt à l'IA ──────────────────────────────
        self.ai_repo.add_log(generation_id, "sending_prompt",
                             "Envoi du prompt au modèle IA…", 35)
        self.ai_repo.update_progress(generation_id, 35)

        raw_json = self._appeler_ia(
            projet.nom, projet.description or "", sprints_content, generation_id
        )

        self.ai_repo.update_progress(generation_id, 65)
        self.ai_repo.add_log(generation_id, "parsing",
                             "Réponse IA reçue — analyse du JSON…", 65)

        # ── Étape 4 : Validation JSON ──────────────────────────────────────
        parsed = self._parser_reponse(raw_json)
        nb_cas = len(parsed.cas_tests)

        self.ai_repo.update_progress(generation_id, 75)
        self.ai_repo.add_log(generation_id, "saving",
                             f"{nb_cas} cas de tests détectés — sauvegarde en base…", 75)

        # ── Étape 5 : Sauvegarde ───────────────────────────────────────────
        cahier = self.repo.get_by_projet(gen.projet_id)
        if not cahier:
            raise ValueError("Cahier de tests introuvable lors de la sauvegarde.")

        for i, cas in enumerate(parsed.cas_tests, start=1):
            self.repo.add_cas_test(
                cahier_id=cahier.id,
                sprint=cas.sprint,
                module=cas.module,
                sous_module=cas.sous_module,
                test_ref=cas.test_ref or f"TC-{i:03d}",
                test_case=cas.test_case,
                test_purpose=cas.test_purpose,
                type_utilisateur=cas.type_utilisateur,
                scenario_test=cas.scenario_test,
                resultat_attendu=cas.resultat_attendu,
                type_test=cas.type_test if cas.type_test in ("Manuel", "Automatisé") else "Manuel",
                ordre=i,
            )

        self.repo.recalculer_stats(cahier.id)

        # Passer le cahier en brouillon (génération terminée)
        cahier.statut = "brouillon"
        self.db.commit()

        # ── Étape 6 : Terminé ──────────────────────────────────────────────
        self.ai_repo.update_status(generation_id, "completed", 100)
        self.ai_repo.add_log(
            generation_id, "done",
            f"Génération terminée : {nb_cas} cas de tests créés.",
            100,
        )

    # ─── Export ───────────────────────────────────────────────────────────

    def exporter_excel(self, cahier_id: int, projet_id: int) -> bytes:
        """Génère un fichier Excel (.xlsx) du cahier de tests."""
        from openpyxl import Workbook
        from openpyxl.styles import (
            Alignment, Border, Font, PatternFill, Side
        )
        from openpyxl.utils import get_column_letter

        cahier = self.repo.get_detail(cahier_id)
        if not cahier or cahier.projet_id != projet_id:
            raise HTTPException(status_code=404, detail="Cahier introuvable.")

        wb = Workbook()

        # ── Feuille résumé ────────────────────────────────────────────────
        ws_resume = wb.active
        ws_resume.title = "Résumé"

        header_fill = PatternFill("solid", fgColor="1F4E79")
        header_font = Font(bold=True, color="FFFFFF", size=12)
        label_font  = Font(bold=True, size=11)
        center      = Alignment(horizontal="center", vertical="center")

        ws_resume.merge_cells("A1:D1")
        ws_resume["A1"] = f"Cahier de Tests — {cahier.projet.nom if cahier.projet else ''}"
        ws_resume["A1"].font      = Font(bold=True, color="FFFFFF", size=14)
        ws_resume["A1"].fill      = header_fill
        ws_resume["A1"].alignment = center

        summary_data = [
            ("Version",                  cahier.version),
            ("Statut",                   cahier.statut.capitalize()),
            ("Date de génération",       cahier.date_generation.strftime("%d/%m/%Y %H:%M") if cahier.date_generation else ""),
            ("Nombre total de tests",    cahier.nombre_total),
            ("Nombre de tests réussis",  cahier.nombre_reussi),
            ("Nombre de tests échoués",  cahier.nombre_echoue),
            ("Nombre de tests bloqués",  cahier.nombre_bloque),
        ]
        for row_idx, (label, value) in enumerate(summary_data, start=2):
            ws_resume.cell(row=row_idx, column=1, value=label).font = label_font
            ws_resume.cell(row=row_idx, column=2, value=value)
        ws_resume.column_dimensions["A"].width = 30
        ws_resume.column_dimensions["B"].width = 30

        # ── Feuille cas de tests ──────────────────────────────────────────
        ws = wb.create_sheet("Cas de Tests")

        columns = [
            ("Sprint",             20),
            ("Module",             22),
            ("Sous-Module",        22),
            ("Test REF",           12),
            ("Test Case",          35),
            ("Test Purpose",       35),
            ("Type Utilisateur",   18),
            ("Scénario Test",      50),
            ("Résultat Attendu",   40),
            ("Résultat Obtenu",    40),
            ("Fail Logs",          30),
            ("Capture",            20),
            ("Date Création",      18),
            ("Type",               12),
            ("Statut Test",        16),
            ("Commentaire",        35),
        ]

        thin = Side(style="thin")
        border = Border(left=thin, right=thin, top=thin, bottom=thin)

        # En-têtes
        for col_idx, (col_name, col_width) in enumerate(columns, start=1):
            cell = ws.cell(row=1, column=col_idx, value=col_name)
            cell.font      = header_font
            cell.fill      = header_fill
            cell.alignment = center
            cell.border    = border
            ws.column_dimensions[get_column_letter(col_idx)].width = col_width

        # Couleurs de statut
        status_fills = {
            "Réussi":      PatternFill("solid", fgColor="C6EFCE"),
            "Échoué":      PatternFill("solid", fgColor="FFC7CE"),
            "Bloqué":      PatternFill("solid", fgColor="FFEB9C"),
            "Non exécuté": PatternFill("solid", fgColor="DDDDDD"),
        }

        for row_idx, cas in enumerate(cahier.cas_tests, start=2):
            row_data = [
                cas.sprint or "",
                cas.module or "",
                cas.sous_module or "",
                cas.test_ref,
                cas.test_case,
                cas.test_purpose or "",
                cas.type_utilisateur or "",
                cas.scenario_test or "",
                cas.resultat_attendu or "",
                cas.resultat_obtenu or "",
                cas.fail_logs or "",
                cas.capture or "",
                cas.date_creation.strftime("%d/%m/%Y") if cas.date_creation else "",
                cas.type_test,
                cas.statut_test,
                cas.commentaire or "",
            ]
            status_fill = status_fills.get(cas.statut_test, status_fills["Non exécuté"])
            for col_idx, value in enumerate(row_data, start=1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                cell.border    = border
                cell.alignment = Alignment(wrap_text=True, vertical="top")
                # Colorier la colonne Statut Test
                if col_idx == 15:
                    cell.fill = status_fill

        ws.freeze_panes = "A2"

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return buf.read()

    def exporter_word(self, cahier_id: int, projet_id: int) -> bytes:
        """Génère un fichier Word (.docx) du cahier de tests."""
        from docx import Document
        from docx.shared import Inches, Pt, RGBColor
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from docx.oxml.ns import qn
        from docx.oxml import OxmlElement

        cahier = self.repo.get_detail(cahier_id)
        if not cahier or cahier.projet_id != projet_id:
            raise HTTPException(status_code=404, detail="Cahier introuvable.")

        doc = Document()

        # ── Titre ─────────────────────────────────────────────────────────
        titre = doc.add_heading(f"Cahier de Tests — {cahier.projet.nom if cahier.projet else ''}", 0)
        titre.alignment = WD_ALIGN_PARAGRAPH.CENTER

        doc.add_paragraph(f"Version : {cahier.version}")
        doc.add_paragraph(f"Statut : {cahier.statut.capitalize()}")
        date_str = cahier.date_generation.strftime("%d/%m/%Y %H:%M") if cahier.date_generation else ""
        doc.add_paragraph(f"Date de génération : {date_str}")
        doc.add_paragraph("")

        # ── Résumé statistiques ───────────────────────────────────────────
        doc.add_heading("Résumé", level=1)
        stats_table = doc.add_table(rows=5, cols=2)
        stats_table.style = "Light List Accent 1"
        stats_data = [
            ("Nombre total de tests",   str(cahier.nombre_total)),
            ("Tests réussis",           str(cahier.nombre_reussi)),
            ("Tests échoués",           str(cahier.nombre_echoue)),
            ("Tests bloqués",           str(cahier.nombre_bloque)),
            ("Tests non exécutés",      str(cahier.nombre_total - cahier.nombre_reussi - cahier.nombre_echoue - cahier.nombre_bloque)),
        ]
        for i, (label, val) in enumerate(stats_data):
            stats_table.cell(i, 0).text = label
            stats_table.cell(i, 1).text = val

        doc.add_paragraph("")
        doc.add_heading("Cas de Tests", level=1)

        # ── Tableau des cas de tests ──────────────────────────────────────
        headers = [
            "Sprint", "Module", "Sous-Module", "Test REF", "Test Case",
            "Test Purpose", "Type Utilisateur", "Scénario Test",
            "Résultat Attendu", "Résultat Obtenu", "Fail Logs",
            "Date Création", "Type", "Statut Test", "Commentaire",
        ]
        table = doc.add_table(rows=1, cols=len(headers))
        table.style = "Light Grid Accent 1"

        # En-tête
        hdr_row = table.rows[0]
        for i, col_name in enumerate(headers):
            cell = hdr_row.cells[i]
            cell.text = col_name
            run = cell.paragraphs[0].runs[0]
            run.bold = True
            run.font.size = Pt(9)

        # Données
        for cas in cahier.cas_tests:
            row = table.add_row()
            values = [
                cas.sprint or "",
                cas.module or "",
                cas.sous_module or "",
                cas.test_ref,
                cas.test_case,
                cas.test_purpose or "",
                cas.type_utilisateur or "",
                cas.scenario_test or "",
                cas.resultat_attendu or "",
                cas.resultat_obtenu or "",
                cas.fail_logs or "",
                cas.date_creation.strftime("%d/%m/%Y") if cas.date_creation else "",
                cas.type_test,
                cas.statut_test,
                cas.commentaire or "",
            ]
            for i, val in enumerate(values):
                cell = row.cells[i]
                cell.text = val
                run = cell.paragraphs[0].runs[0] if cell.paragraphs[0].runs else cell.paragraphs[0].add_run(val)
                run.font.size = Pt(8)

        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        return buf.read()

    def exporter_pdf(self, cahier_id: int, projet_id: int) -> bytes:
        """Génère un fichier PDF du cahier de tests via reportlab."""
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm
            from reportlab.platypus import (
                Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
            )
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="La bibliothèque reportlab est requise pour l'export PDF. "
                       "Installez-la avec : pip install reportlab",
            )

        cahier = self.repo.get_detail(cahier_id)
        if not cahier or cahier.projet_id != projet_id:
            raise HTTPException(status_code=404, detail="Cahier introuvable.")

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=landscape(A4),
            leftMargin=1 * cm,
            rightMargin=1 * cm,
            topMargin=1.5 * cm,
            bottomMargin=1.5 * cm,
        )

        styles  = getSampleStyleSheet()
        story   = []

        # Titre
        titre_style = ParagraphStyle(
            "titre",
            parent=styles["Title"],
            fontSize=16,
            spaceAfter=8,
        )
        projet_nom = cahier.projet.nom if cahier.projet else ""
        story.append(Paragraph(f"Cahier de Tests — {projet_nom}", titre_style))
        story.append(Spacer(1, 0.3 * cm))

        # Infos
        info_style = ParagraphStyle("info", parent=styles["Normal"], fontSize=9)
        date_str   = cahier.date_generation.strftime("%d/%m/%Y %H:%M") if cahier.date_generation else ""
        story.append(Paragraph(f"<b>Version :</b> {cahier.version}    "
                                f"<b>Statut :</b> {cahier.statut.capitalize()}    "
                                f"<b>Date :</b> {date_str}", info_style))
        story.append(Spacer(1, 0.3 * cm))

        # Stats
        nb_non_ex = cahier.nombre_total - cahier.nombre_reussi - cahier.nombre_echoue - cahier.nombre_bloque
        story.append(Paragraph(
            f"<b>Total :</b> {cahier.nombre_total}   "
            f"<b>Réussis :</b> {cahier.nombre_reussi}   "
            f"<b>Échoués :</b> {cahier.nombre_echoue}   "
            f"<b>Bloqués :</b> {cahier.nombre_bloque}   "
            f"<b>Non exécutés :</b> {nb_non_ex}",
            info_style,
        ))
        story.append(Spacer(1, 0.5 * cm))

        # Tableau des cas de tests
        small_style = ParagraphStyle("small", parent=styles["Normal"], fontSize=7, leading=9)
        header_style = ParagraphStyle("hdr", parent=styles["Normal"], fontSize=7, leading=9, textColor=colors.white)

        col_headers = [
            "Sprint", "Module", "Sous-Module", "REF", "Cas de Test",
            "Type User", "Scénario", "Résultat Attendu",
            "Résultat Obtenu", "Date", "Type", "Statut",
        ]
        col_widths = [2.5*cm, 2.8*cm, 2.8*cm, 1.6*cm, 4.5*cm,
                      2*cm, 6*cm, 4.5*cm, 3.5*cm, 1.8*cm, 1.6*cm, 2*cm]

        table_data = [[Paragraph(h, header_style) for h in col_headers]]
        for cas in cahier.cas_tests:
            table_data.append([
                Paragraph(cas.sprint or "", small_style),
                Paragraph(cas.module or "", small_style),
                Paragraph(cas.sous_module or "", small_style),
                Paragraph(cas.test_ref, small_style),
                Paragraph(cas.test_case, small_style),
                Paragraph(cas.type_utilisateur or "", small_style),
                Paragraph((cas.scenario_test or "").replace("\n", "<br/>"), small_style),
                Paragraph(cas.resultat_attendu or "", small_style),
                Paragraph(cas.resultat_obtenu or "", small_style),
                Paragraph(cas.date_creation.strftime("%d/%m/%Y") if cas.date_creation else "", small_style),
                Paragraph(cas.type_test, small_style),
                Paragraph(cas.statut_test, small_style),
            ])

        status_colors = {
            "Réussi":      colors.HexColor("#C6EFCE"),
            "Échoué":      colors.HexColor("#FFC7CE"),
            "Bloqué":      colors.HexColor("#FFEB9C"),
            "Non exécuté": colors.HexColor("#DDDDDD"),
        }

        ts = TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0), colors.HexColor("#1F4E79")),
            ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
            ("FONTSIZE",    (0, 0), (-1, -1), 7),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F2F2")]),
            ("GRID",        (0, 0), (-1, -1), 0.3, colors.grey),
            ("VALIGN",      (0, 0), (-1, -1), "TOP"),
        ])

        for row_idx, cas in enumerate(cahier.cas_tests, start=1):
            fill = status_colors.get(cas.statut_test, status_colors["Non exécuté"])
            ts.add("BACKGROUND", (11, row_idx), (11, row_idx), fill)

        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        t.setStyle(ts)
        story.append(t)

        doc.build(story)
        buf.seek(0)
        return buf.read()

    # ─── Helpers privés ───────────────────────────────────────────────────

    def _verifier_appartenance(self, cahier_id: int, projet_id: int) -> CahierTestGlobal:
        cahier = self.repo.get_by_id(cahier_id)
        if not cahier or cahier.projet_id != projet_id:
            raise HTTPException(status_code=404, detail="Cahier introuvable.")
        return cahier

    def _construire_contenu_sprints(self, projet_id: int) -> str:
        """Construit un résumé textuel des sprints et user stories pour le prompt IA."""
        sprints = (
            self.db.query(Sprint)
            .options(
                joinedload(Sprint.userstories)
                .joinedload(UserStory.epic)
                .joinedload(Epic.module)
            )
            .filter(Sprint.projet_id == projet_id)
            .order_by(Sprint.dateDebut.asc())
            .all()
        )

        if not sprints:
            raise ValueError(
                "Aucun sprint trouvé pour ce projet. "
                "Veuillez d'abord créer des sprints et des user stories.",
            )

        lines: List[str] = []
        for sprint in sprints:
            lines.append(f"\n--- {sprint.nom} ---")
            if sprint.objectifSprint:
                lines.append(f"Objectif : {sprint.objectifSprint}")
            if not sprint.userstories:
                lines.append("  (aucune user story assignée)")
                continue
            for us in sprint.userstories:
                module_nom     = us.epic.module.nom if (us.epic and us.epic.module) else "N/A"
                epic_nom       = us.epic.titre if us.epic else "N/A"
                lines.append(f"  [US-{us.id}] Module: {module_nom} | Epic: {epic_nom}")
                lines.append(f"    Titre       : {us.titre}")
                if us.description:
                    lines.append(f"    Description : {us.description}")
                if us.criteresAcceptation:
                    lines.append(f"    Critères d'acceptation : {us.criteresAcceptation}")

        return "\n".join(lines)

    def _appeler_ia(self, projet_nom: str, projet_description: str,
                    sprints_content: str, generation_id: int) -> str:
        """Envoie le prompt à l'IA et retourne la réponse brute."""
        if not AI_API_KEY:
            raise ValueError("Clé API IA manquante. Définir ai_api_key dans .env")

        # Limiter la taille du contenu
        max_chars = 40_000
        if len(sprints_content) > max_chars:
            sprints_content = sprints_content[:max_chars] + "\n[... contenu tronqué ...]"

        full_prompt = USER_PROMPT_TEMPLATE.format(
            projet_nom=projet_nom,
            projet_description=projet_description,
            sprints_content=sprints_content,
        )

        max_retries = 3
        for attempt in range(max_retries):
            try:
                return self._appeler_openrouter(full_prompt)
            except Exception as exc:
                err_str = str(exc)
                is_quota = "429" in err_str or "quota" in err_str.lower() or "RESOURCE_EXHAUSTED" in err_str
                if not is_quota or attempt == max_retries - 1:
                    raise
                delay_match = re.search(r"retry_delay\s*\{\s*seconds:\s*(\d+)", err_str)
                wait = int(delay_match.group(1)) + 5 if delay_match else 30 * (2 ** attempt)
                self.ai_repo.add_log(
                    generation_id, "retrying",
                    f"Quota dépassé (429) — nouvelle tentative dans {wait}s "
                    f"(essai {attempt + 1}/{max_retries - 1})…",
                    35,
                )
                time.sleep(wait)

        raise RuntimeError("Échec après toutes les tentatives IA.")

    @staticmethod
    def _appeler_openrouter(full_prompt: str) -> str:
        """Appel unique vers l'API OpenRouter (compatible OpenAI)."""
        import requests

        payload = {
            "model": AI_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": full_prompt},
            ],
            "temperature": 0.2,
            "max_tokens":  8192,
        }
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type":  "application/json",
        }
        resp = requests.post(AI_API_URL, json=payload, headers=headers, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

    @staticmethod
    def _parser_reponse(raw: str) -> AICahierResponse:
        """Extrait et valide le JSON retourné par l'IA."""
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
        if match:
            json_str = match.group(1)
        else:
            start = raw.find("{")
            end   = raw.rfind("}") + 1
            if start == -1 or end == 0:
                raise ValueError(
                    "L'IA n'a pas retourné de JSON valide. Relancez la génération."
                )
            json_str = raw[start:end]

        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON malformé retourné par l'IA : {e}")

        return AICahierResponse(**data)
