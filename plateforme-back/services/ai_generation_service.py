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
import time
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from core.config import AI_API_KEY, AI_MODEL, AI_API_URL
from models.attachment import Attachment
from models.scrum import Projet
from repositories.ai_generation_repository import AIGenerationRepository
from schemas.ai_generation import AIBacklogResponse

# ─── Prompt système ───────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
Tu es un expert Agile/Scrum. Ton rôle est de transformer un cahier des charges  \
en backlog Scrum complet structuré en Modules → Epics → User Stories.

Règles strictes :

1. Identifie les modules principaux du système.

2. Pour chaque module, identifie les Epics.

3. Pour chaque Epic, génère les User Stories au format :
   "En tant que [rôle], je veux [objectif], afin de [bénéfice]."

4. Chaque User Story doit obligatoirement contenir :
   - Priority : "High", "Medium" ou "Low"
   - Story Points : entier de 1 à 13
   - Sprint : numéro de sprint (1 à 6)
   - Duration : estimation en heures (ex : 2h, 4h, 8h, 16h)
   - Acceptance Criteria : liste de 3 à 5 phrases courtes et vérifiables

5. Retourne UNIQUEMENT un objet JSON valide.
   Aucun texte avant ou après.

Structure JSON attendue :

{
  "modules": [
    {
      "name": "Nom du module",
      "epics": [
        {
          "name": "Nom de l'epic",
          "user_stories": [
            {
              "description": "En tant que ... je veux ... afin de ...",
              "priority": "High",
              "story_points": 5,
              "sprint": 2,
              "duration": "4h",
              "acceptance_criteria": [
                "critère 1",
                "critère 2",
                "critère 3"
              ]
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

        raw_json = self._appeler_ia(content, generation_id)

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
                title=module.name,
            )

            for epic in module.epics:
                nb_epics += 1
                epic_item = self.repo.add_item(
                    generation_id=generation_id,
                    type_="epic",
                    title=epic.name,
                    parent_id=module_item.id,
                )

                for us in epic.user_stories:
                    nb_us += 1
                    criteres_json = json.dumps(us.acceptance_criteria, ensure_ascii=False)
                    self.repo.add_item(
                        generation_id=generation_id,
                        type_="user_story",
                        title=us.description,
                        description=us.description,
                        parent_id=epic_item.id,
                        acceptance_criteria=criteres_json,
                        priority=us.priority,
                        story_points=us.story_points,
                        sprint=us.sprint,
                        duration=us.duration,
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

    def _appeler_ia(self, content: str, generation_id: int) -> str:
        """Envoie le contenu au modèle openrouter et retourne la réponse brute.

        En cas d'erreur 429 (quota dépassé), attend le délai suggéré par l'API
        puis réessaie (3 tentatives max).
        """
        if not AI_API_KEY:
            raise ValueError("Clé API IA manquante. Définir ai_api_key dans .env")

        # Tronquer si trop long (≈ 12 000 tokens max ≈ 48 000 caractères)
        max_chars = 48_000
        if len(content) > max_chars:
            content = content[:max_chars] + "\n[... contenu tronqué ...]"

        max_retries = 3
        base_delay  = 30  # secondes

        for attempt in range(max_retries):
            try:
                return self._appeler_google(content)
            except Exception as exc:
                err_str = str(exc)
                is_quota = (
                    "429" in err_str
                    or "quota" in err_str.lower()
                    or "RESOURCE_EXHAUSTED" in err_str
                )
                if not is_quota or attempt == max_retries - 1:
                    raise

                # Extraire le délai suggéré par l'API ("retry_delay { seconds: N }")
                delay_match = re.search(r"retry_delay\s*\{\s*seconds:\s*(\d+)", err_str)
                wait = int(delay_match.group(1)) + 5 if delay_match else base_delay * (2 ** attempt)

                self.repo.add_log(
                    generation_id, "retrying",
                    f"Quota dépassé (429) — nouvelle tentative dans {wait} s "
                    f"(essai {attempt + 1}/{max_retries - 1})…",
                    30,
                )
                time.sleep(wait)

        raise RuntimeError("Échec après toutes les tentatives.")

    @staticmethod
    def _appeler_google(content: str) -> str:
        """Appel unique vers l'API OpenRouter (compatible OpenAI)."""
        import requests

        full_prompt = USER_PROMPT_TEMPLATE.format(content=content)

        payload = {
            "model": AI_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": full_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 8192,
        }
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type":  "application/json",
        }

        resp = requests.post(AI_API_URL, json=payload, headers=headers, timeout=120)

        if resp.status_code == 429:
            # Propager comme exception pour que la boucle retry la capte
            raise Exception(f"429 Quota dépassé : {resp.text}")

        if not resp.ok:
            raise ValueError(f"Erreur OpenRouter {resp.status_code} : {resp.text}")

        data = resp.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise ValueError(f"Réponse OpenRouter inattendue : {data}") from exc

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

    # ─── Application de la génération au backlog ─────────────────────────

    def appliquer_generation(self, generation_id: int, projet_id: int, user_id: int) -> dict:
        """
        Crée les vraies entités (Module, Epic, UserStory, Sprint) à partir des items
        non-rejetés d'une génération IA complétée, puis marque la génération
        comme « approved ».
        """
        from datetime import timedelta
        from models.scrum import Module, Epic, UserStory, Sprint
        from repositories.projet_repository import ProjetRepository

        gen = self.repo.get_detail(generation_id)
        if not gen:
            raise HTTPException(status_code=404, detail="Génération introuvable.")
        if gen.status not in ("completed", "approved"):
            raise HTTPException(
                status_code=400,
                detail="La génération n'est pas encore terminée (status != completed).",
            )

        projet_repo = ProjetRepository(self.db)
        projet = projet_repo.get_by_id(projet_id)
        if not projet:
            raise HTTPException(status_code=404, detail="Projet introuvable.")

        all_items = self.repo.get_items_by_generation(generation_id)
        active   = [i for i in all_items if i.status != "rejected"]

        modules_created = 0
        epics_created   = 0
        stories_created = 0
        sprints_created = 0

        module_id_map: dict[int, int] = {}   # ai_item.id → real Module.id
        epic_id_map:   dict[int, int] = {}   # ai_item.id → real Epic.id
        sprint_map:    dict[int, int] = {}   # sprint_number → Sprint.id

        # ── Sprints ───────────────────────────────────────────────────────
        # Collecter tous les numéros de sprint uniques
        sprint_numbers = set()
        for item in active:
            if item.type == "user_story" and item.sprint:
                sprint_numbers.add(item.sprint)

        # Créer les sprints (durée de 2 semaines par défaut)
        for sprint_num in sorted(sprint_numbers):
            # Calculer les dates : sprint 1 démarre maintenant, les autres suivent
            start_date = datetime.now() + timedelta(weeks=(sprint_num - 1) * 2)
            end_date = start_date + timedelta(weeks=2)
            
            sprint = Sprint(
                nom=f"Sprint {sprint_num}",
                dateDebut=start_date,
                dateFin=end_date,
                objectifSprint=f"Sprint {sprint_num} - Généré automatiquement par IA",
                capaciteEquipe=40,  # Valeur par défaut (40 story points)
                velocite=0,
                statut="planned",
                projet_id=projet_id,
                scrumMasterId=None,  # À définir manuellement
            )
            self.db.add(sprint)
            self.db.flush()
            sprint_map[sprint_num] = sprint.id
            sprints_created += 1

        # ── Modules ──────────────────────────────────────────────────────
        for idx, item in enumerate(i for i in active if i.type == "module" and i.parent_id is None):
            m = Module(
                nom=item.title[:200],
                description=item.description,
                ordre=idx,
                projet_id=projet_id,
            )
            self.db.add(m)
            self.db.flush()
            module_id_map[item.id] = m.id
            modules_created += 1

        # ── Epics ─────────────────────────────────────────────────────────
        epic_idx = 0
        for item in (i for i in active if i.type == "epic"):
            parent_module_id = module_id_map.get(item.parent_id)
            if parent_module_id is None:
                continue
            numero    = projet_repo.next_issue_number(projet_id)
            reference = f"{projet.key}-{numero}"
            e = Epic(
                reference=reference,
                titre=item.title[:200],
                description=item.description,
                priorite=epic_idx,
                statut="to_do",
                module_id=parent_module_id,
                productOwnerId=user_id,
            )
            self.db.add(e)
            self.db.flush()
            epic_id_map[item.id] = e.id
            epics_created += 1
            epic_idx += 1

        # ── User Stories ──────────────────────────────────────────────────
        _prio_map = {"High": "must_have", "Medium": "should_have", "Low": "could_have"}
        for item in (i for i in active if i.type == "user_story"):
            parent_epic_id = epic_id_map.get(item.parent_id)
            if parent_epic_id is None:
                continue
            numero    = projet_repo.next_issue_number(projet_id)
            reference = f"{projet.key}-{numero}"
            duree: float | None = None
            if item.duration:
                m_dur = re.match(r"(\d+(?:\.\d+)?)", item.duration)
                if m_dur:
                    duree = float(m_dur.group(1))
            us = UserStory(
                reference=reference,
                titre=item.title[:200],
                description=item.description or item.title,
                criteresAcceptation=item.acceptance_criteria,
                points=item.story_points,
                duree_estimee=duree,
                priorite=_prio_map.get(item.priority or "", "should_have"),
                statut="to_do",
                epic_id=parent_epic_id,
            )
            self.db.add(us)
            self.db.flush()
            
            # Lier la user story au sprint si un numéro de sprint existe
            if item.sprint and item.sprint in sprint_map:
                sprint_id = sprint_map[item.sprint]
                sprint = self.db.query(Sprint).get(sprint_id)
                if sprint:
                    us.sprints.append(sprint)
            
            stories_created += 1

        self.db.commit()
        self.repo.update_status(generation_id, "approved", 100)

        return {
            "generation_id": generation_id,
            "sprints_created": sprints_created,
            "modules_created": modules_created,
            "epics_created": epics_created,
            "stories_created": stories_created,
        }

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
