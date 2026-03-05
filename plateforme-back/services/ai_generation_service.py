"""
Service de génération IA du backlog Scrum à partir d'un cahier des charges.

Flux :
  1. Créer un enregistrement AIGeneration (status=pending)
  2. Lire le fichier du cahier des charges attaché au projet
  3. Envoyer au modèle via Google AI Studio (Gemini)
  4. Analyser la réponse JSON
  5. Sauvegarder les modules / epics / user stories dans ai_generated_items
  6. Passer le status en completed (ou failed)

L'appel IA s'exécute dans une BackgroundTask FastAPI pour ne pas bloquer la réponse HTTP.
"""
from __future__ import annotations

import json
import os
import re
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.config import AI_API_KEY, AI_MODEL
from models.attachment import Attachment
from models.scrum import Projet
from repositories.ai_generation_repository import AIGenerationRepository
from schemas.ai_generation import AIBacklogResponse

# ─── Prompt système ───────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
Tu es un expert Agile/Scrum. Ton rôle est de transformer un cahier des charges \
en backlog Scrum complet structuré en Modules → Epics → User Stories.

Règles strictes :
1. Identifie les modules principaux du système.
2. Pour chaque module, identifie les Epics.
3. Pour chaque Epic, génère les User Stories au format :
   "En tant que [rôle], je veux [objectif], afin de [bénéfice]."
4. Chaque User Story doit avoir :
   - Des critères d'acceptation (liste de phrases courtes)
   - Une priorité : "High", "Medium" ou "Low"
   - Des story points (entier de 1 à 13)
5. Retourne UNIQUEMENT un objet JSON valide, sans aucun texte avant ou après.
6. Respecte exactement ce schéma :

{
  "modules": [
    {
      "titre": "...",
      "description": "...",
      "epics": [
        {
          "titre": "...",
          "description": "...",
          "user_stories": [
            {
              "titre": "En tant que ..., je veux ..., afin de ...",
              "description": "...",
              "criteres_acceptation": ["...", "..."],
              "priorite": "High",
              "story_points": 5
            }
          ]
        }
      ]
    }
  ]
}
"""

USER_PROMPT_TEMPLATE = """\
Voici le cahier des charges du projet :

---
{content}
---

Génère le backlog Scrum complet en JSON selon le schéma demandé.
"""


class AIGenerationService:

    def __init__(self, db: Session):
        self.db   = db
        self.repo = AIGenerationRepository(db)

    # ─── Point d'entrée public ────────────────────────────────────────────

    def demarrer_generation(self, projet_id: int, user_id: int) -> dict:
        """
        Crée le job et retourne immédiatement son ID.
        L'appelant doit lancer `executer_generation` en BackgroundTask.
        """
        projet = self.db.query(Projet).filter(Projet.id == projet_id).first()
        if not projet:
            raise HTTPException(status_code=404, detail="Projet introuvable.")

        gen = self.repo.create_generation(projet_id, user_id, "generate_scrum")
        return gen

    def executer_generation(self, generation_id: int) -> None:
        """
        Logique principale (exécutée en arrière-plan).
        Toutes les erreurs sont capturées et stockées dans le statut.
        """
        try:
            self._run(generation_id)
        except Exception as exc:
            self.repo.update_status(generation_id, "failed", 0)
            self.repo.add_log(generation_id, "error", str(exc), 0)

    # ─── Logique interne ──────────────────────────────────────────────────

    def _run(self, generation_id: int) -> None:

        # ── Étape 1 : Démarrage ────────────────────────────────────────────
        self.repo.update_status(generation_id, "processing", 5)
        self.repo.add_log(generation_id, "reading_file",
                          "Recherche du cahier des charges…", 5)

        gen = self.repo.get_by_id(generation_id)

        # ── Étape 2 : Lecture du fichier ───────────────────────────────────
        content = self._lire_cahier_des_charges(gen.projet_id)
        if not content or not content.strip():
            raise ValueError(
                "Aucun cahier des charges (TXT/PDF) trouvé pour ce projet. "
                "Veuillez d'abord l'uploader en pièce jointe du projet."
            )

        self.repo.update_progress(generation_id, 20)
        self.repo.add_log(generation_id, "reading_file",
                          f"Fichier lu ({len(content)} caractères).", 20)

        # ── Étape 3 : Appel IA ─────────────────────────────────────────────
        self.repo.add_log(generation_id, "sending_prompt",
                          "Envoi du prompt au modèle IA…", 30)
        self.repo.update_progress(generation_id, 30)

        raw_json = self._appeler_ia(content)

        self.repo.update_progress(generation_id, 60)
        self.repo.add_log(generation_id, "generating_epics",
                          "Réponse IA reçue — analyse du JSON…", 60)

        # ── Étape 4 : Validation JSON ──────────────────────────────────────
        backlog = self._parser_reponse(raw_json)

        self.repo.update_progress(generation_id, 80)
        self.repo.add_log(generation_id, "generating_us",
                          f"{len(backlog.modules)} module(s) détecté(s).", 80)

        # ── Étape 5 : Sauvegarde ───────────────────────────────────────────
        self.repo.add_log(generation_id, "saving",
                          "Sauvegarde des éléments en base…", 85)

        nb_epics = 0
        nb_us    = 0

        for module in backlog.modules:
            module_item = self.repo.add_item(
                generation_id=generation_id,
                type_="module",
                title=module.titre,
                description=module.description,
            )

            for epic in module.epics:
                nb_epics += 1
                epic_item = self.repo.add_item(
                    generation_id=generation_id,
                    type_="epic",
                    title=epic.titre,
                    description=epic.description,
                    parent_id=module_item.id,
                )

                for us in epic.user_stories:
                    nb_us += 1
                    criteres_json = json.dumps(us.criteres_acceptation, ensure_ascii=False)
                    self.repo.add_item(
                        generation_id=generation_id,
                        type_="user_story",
                        title=us.titre,
                        description=us.description,
                        parent_id=epic_item.id,
                        acceptance_criteria=criteres_json,
                        priority=us.priorite,
                        story_points=us.story_points,
                    )

        # ── Étape 6 : Terminé ──────────────────────────────────────────────
        self.repo.update_status(generation_id, "completed", 100)
        self.repo.add_log(
            generation_id, "done",
            f"Génération terminée : {len(backlog.modules)} modules, "
            f"{nb_epics} epics, {nb_us} user stories.",
            100,
        )

    # ─── Helpers privés ───────────────────────────────────────────────────

    def _lire_cahier_des_charges(self, projet_id: int) -> Optional[str]:
        """
        Cherche la pièce jointe TXT ou PDF la plus récente du projet
        et retourne son contenu textuel.
        """
        attachment = (
            self.db.query(Attachment)
            .filter(
                Attachment.projet_id == projet_id,
                Attachment.content_type.in_([
                    "text/plain",
                    "application/pdf",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ]),
            )
            .order_by(Attachment.uploaded_at.desc())
            .first()
        )

        if not attachment:
            return None

        filepath = attachment.filepath
        if not os.path.exists(filepath):
            return None

        content_type = attachment.content_type

        # ── TXT ────────────────────────────────────────────────────────────
        if content_type == "text/plain":
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

        # ── PDF ────────────────────────────────────────────────────────────
        if content_type == "application/pdf":
            return self._lire_pdf(filepath)

        # ── DOCX ───────────────────────────────────────────────────────────
        if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return self._lire_docx(filepath)

        return None

    @staticmethod
    def _lire_pdf(filepath: str) -> str:
        try:
            import pypdf
            reader = pypdf.PdfReader(filepath)
            pages  = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(pages)
        except ImportError:
            # pypdf non installé : extraction brute des chaînes ASCII du PDF
            with open(filepath, "rb") as f:
                raw = f.read()
            matches = re.findall(rb"[\x20-\x7e\xc0-\xff]{4,}", raw)
            return " ".join(m.decode("utf-8", errors="ignore") for m in matches)
        except Exception:
            return ""

    @staticmethod
    def _lire_docx(filepath: str) -> str:
        try:
            from docx import Document
            doc  = Document(filepath)
            return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
        except Exception:
            return ""

    def _appeler_ia(self, content: str) -> str:
        """Envoie le contenu au modèle Google AI Studio (Gemini) et retourne la réponse brute."""
        if not AI_API_KEY:
            raise ValueError("Clé API IA manquante. Définir ai_api_key dans .env")

        # Tronquer si trop long (≈ 12 000 tokens max ≈ 48 000 caractères)
        max_chars = 48_000
        if len(content) > max_chars:
            content = content[:max_chars] + "\n[... contenu tronqué ...]"

        return self._appeler_google(content)

    @staticmethod
    def _appeler_google(content: str) -> str:
        """Appel via Google AI Studio SDK (google-generativeai)."""
        try:
            import google.generativeai as genai
        except ImportError:
            raise ValueError(
                "Package 'google-generativeai' manquant. Exécuter : pip install google-generativeai"
            )

        genai.configure(api_key=AI_API_KEY)

        model = genai.GenerativeModel(
            model_name=AI_MODEL,
            system_instruction=SYSTEM_PROMPT,
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 8192,
            },
        )

        full_prompt = USER_PROMPT_TEMPLATE.format(content=content)
        response = model.generate_content(full_prompt)
        return response.text

    @staticmethod
    def _parser_reponse(raw: str) -> AIBacklogResponse:
        """
        Extrait le JSON de la réponse brute (qui peut contenir du texte superflu)
        et le valide avec le schéma Pydantic.
        """
        # Cherche un bloc JSON entre { ... }
        match = re.search(r"(\{[\s\S]*\})", raw)
        if not match:
            raise ValueError(
                "La réponse du modèle IA ne contient pas de JSON valide.\n"
                f"Réponse brute : {raw[:500]}"
            )

        json_str = match.group(1)
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as exc:
            raise ValueError(f"JSON malformé dans la réponse IA : {exc}\n{json_str[:500]}")

        try:
            return AIBacklogResponse.model_validate(data)
        except Exception as exc:
            raise ValueError(f"Structure JSON inattendue : {exc}")

    # ─── Actions sur les items ────────────────────────────────────────────

    def modifier_item(self, generation_id: int, item_id: int, **kwargs):
        item = self.repo.get_item_by_id(item_id, generation_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item introuvable.")
        if "status" not in kwargs:
            kwargs["status"] = "modified"
        return self.repo.update_item(item_id, **kwargs)

    def changer_statut_item(self, generation_id: int, item_id: int, status: str):
        item = self.repo.get_item_by_id(item_id, generation_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item introuvable.")
        return self.repo.update_item(item_id, status=status)

    def obtenir_detail(self, generation_id: int):
        gen = self.repo.get_detail(generation_id)
        if not gen:
            raise HTTPException(status_code=404, detail="Génération introuvable.")
        return gen

    def lister_par_projet(self, projet_id: int):
        return self.repo.get_by_projet(projet_id)

    def obtenir_items_hierarchiques(self, generation_id: int):
        """Retourne les items structurés en arbre (modules → epics → user stories)."""
        items = self.repo.get_items_by_generation(generation_id)
        # Construction de la hiérarchie en mémoire
        item_map = {item.id: item for item in items}
        roots = []
        for item in items:
            if item.parent_id is None:
                roots.append(item)
        return roots
