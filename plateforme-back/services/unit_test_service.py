"""
Service de génération IA de tests unitaires par User Story.

Flux :
  1. Le développeur upload un fichier source (.py, .js, .ts, .java)
  2. Un enregistrement AIGeneration (type="generate_unit_tests") est créé
  3. Le CahierDeTests de la US est initialisé (ou réinitialisé)
  4. En arrière-plan :
       a. Lecture du fichier source
       b. Construction du prompt (code + contexte US)
       c. Appel au modèle IA (OpenRouter)
       d. Parsing de la réponse JSON
       e. Sauvegarde des TestUnitaire + ScenarioTest
  5. Le développeur peut éditer / exécuter / valider chaque test
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
import time
from datetime import datetime
from typing import List, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload

from core.config import AI_API_KEY, AI_MODEL, AI_API_URL
from models.ai_generation import AIGeneration
from models.execution import ExecutionTest, ResultatTest
from models.scrum import Epic, Module, UserStory
from models.tests import (
    CahierDeTests,
    ScenarioTest,
    Test,
    TestUnitaire,
    ValidationTest,
)
from repositories.ai_generation_repository import AIGenerationRepository
from repositories.test_repository import CahierDeTestsRepository
from schemas.unit_tests import (
    AIUnitTestResponse,
    UpdateTestUnitaireRequest,
    ValiderTestRequest,
)

# ─── Répertoire de stockage des fichiers source uploadés ─────────────────────

UPLOAD_DIR = "uploads/unit_tests"

# ─── Correspondances extension → (langage, framework) ────────────────────          ────
# Utilisé comme fallback si l'IA ne détecte pas le langage.
# L'IA reste la source de vérité principale pour langage et framework.

LANG_MAP: dict[str, tuple[str, str]] = {
    # Python
    ".py":   ("python",     "pytest"),
    # JavaScript / TypeScript
    ".js":   ("javascript", "jest"),
    ".mjs":  ("javascript", "jest"),
    ".cjs":  ("javascript", "jest"),
    ".ts":   ("typescript", "jest"),
    ".tsx":  ("typescript", "jest"),
    ".jsx":  ("javascript", "jest"),
    # JVM
    ".java": ("java",       "junit"),
    ".kt":   ("kotlin",     "junit"),
    ".scala":("scala",      "scalatest"),
    # .NET
    ".cs":   ("csharp",     "xunit"),
    # Ruby
    ".rb":   ("ruby",       "rspec"),
    # Go
    ".go":   ("go",         "testing"),
    # PHP
    ".php":  ("php",        "phpunit"),
    # Rust
    ".rs":   ("rust",       "cargo_test"),
    # C / C++
    ".c":    ("c",          "catch2"),
    ".cpp":  ("c++",        "catch2"),
    ".cc":   ("c++",        "catch2"),
}

# ─── Prompt système ───────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
Tu es un expert en tests logiciels (TDD, BDD). \
Ton rôle est d'analyser du code source et de générer \
des tests unitaires complets, exécutables et maintenables.

Règles strictes :
1. DÉTECTION DU LANGAGE : analyse UNIQUEMENT le contenu du code fourni pour déterminer
   le langage de programmation. N'utilise JAMAIS le nom du fichier pour cette décision.
   Indices à examiner : syntaxe, mots-clés, imports, conventions de nommage.
2. SÉLECTION DU FRAMEWORK : choisis le framework de test le plus adapté et populaire
   pour le langage détecté. Le choix est le tien — exemples courants :
   - Python             → pytest  (ou unittest si le projet l'utilise déjà)
   - JavaScript         → Jest    (ou Mocha/Vitest si le projet l'utilise)
   - TypeScript         → Jest    (ou Vitest)
   - Java               → JUnit 5 (ou TestNG)
   - Ruby               → RSpec
   - Go                 → testing (stdlib)
   - C#                 → xUnit   (ou NUnit, MSTest)
   - PHP                → PHPUnit
   - Kotlin             → JUnit 5 (ou Kotest)
   - Rust               → cargo test (stdlib)
   - C / C++            → Catch2  (ou Google Test)
   Si le langage n'est pas dans cette liste, choisis le framework de référence de la communauté.
3. Pour chaque fonction / méthode / classe identifiée, génère 2 à 5 tests couvrant :
   - Cas nominal        (type: "happy_path")
   - Cas d'erreur       (type: "error")
   - Cas limites        (type: "edge_case")
   - Validation entrées (type: "validation")
4. Chaque test doit avoir :
   - nom         : nom de la fonction de test (snake_case pour Python, camelCase pour JS/Java)
   - description : objectif du test en une phrase
   - scenarios   : liste de scénarios couverts (nom, description, type)
   - code        : code exécutable COMPLET et autonome du test, avec tous les imports nécessaires
5. Vise une couverture de code >= 80 %.
6. Assure-toi que les tests sont indépendants et peuvent s'exécuter sans état partagé.
7. Retourne UNIQUEMENT un objet JSON valide, aucun texte avant ou après.

Structure JSON attendue :
{
  "langage"    : "<langage détecté depuis le code>",
  "framework"  : "<framework choisi par l'IA>",
  "fichierTest": "<nom suggéré pour le fichier de tests>",
  "tests": [
    {
      "nom"        : "test_login_valid_credentials",
      "description": "Vérifie la connexion avec des identifiants valides",
      "scenarios"  : [
        {"nom": "Login valide",        "description": "Email + mdp corrects retourne JWT", "type": "happy_path"},
        {"nom": "Mauvais mot de passe","description": "Retourne 401",                     "type": "error"}
      ],
      "code": "def test_login_valid_credentials():\\n    assert True"
    }
  ]
}
"""

USER_PROMPT_TEMPLATE = """\
User Story :
  Titre              : {us_titre}
  Description        : {us_description}
  Critères d'acceptation : {us_criteres}

Fichier source (nom indicatif : {filename}) :
---
{code_content}
---

Instructions :
1. Analyse le contenu du code ci-dessus pour détecter le langage de programmation.
2. Choisis le framework de test le plus approprié pour ce langage.
3. Génère les tests unitaires complets en JSON selon le schéma demandé.
4. Chaque test doit être exécutable de manière autonome avec tous ses imports.
5. Couvre les cas nominaux, d'erreur, limites et validation des entrées.
"""


# ─────────────────────────────────────────────────────────────────────────────

def detect_language(filename: str) -> tuple[str, str]:
    """Retourne (langage, framework) depuis l'extension du fichier."""
    ext = os.path.splitext(filename)[1].lower()
    return LANG_MAP.get(ext, ("unknown", "unknown"))


def _extension_for(langage: str) -> str:
    return {
        "python":     ".py",
        "javascript": ".js",
        "typescript": ".ts",
        "java":       ".java",
    }.get(langage.lower(), ".py")


def _build_command(framework: str, filepath: str) -> Optional[list]:
    """Construit la commande d'exécution selon le framework détecté par l'IA."""
    fw = framework.lower().replace(" ", "_").replace("-", "_")

    # ── Python ──────────────────────────────────────────────────────────
    if fw == "pytest":
        return ["python", "-m", "pytest", filepath, "-v", "--tb=short"]
    if fw == "unittest":
        return ["python", "-m", "pytest", filepath, "-v", "--tb=short"]

    # ── JavaScript / TypeScript ──────────────────────────────────────────
    if fw == "jest":
        return ["npx", "jest", filepath, "--passWithNoTests", "--no-coverage"]
    if fw in ("vitest",):
        return ["npx", "vitest", "run", filepath]
    if fw == "mocha":
        return ["npx", "mocha", filepath]

    # ── Ruby ─────────────────────────────────────────────────────────────
    if fw == "rspec":
        return ["bundle", "exec", "rspec", filepath, "--format", "documentation"]

    # ── PHP ──────────────────────────────────────────────────────────────
    if fw == "phpunit":
        return ["./vendor/bin/phpunit", filepath]

    # ── Go (exécution par dossier, filepath est le package) ──────────────
    if fw in ("testing", "go_test"):
        import pathlib
        pkg_dir = str(pathlib.Path(filepath).parent)
        return ["go", "test", pkg_dir, "-v"]

    # ── Rust ─────────────────────────────────────────────────────────────
    if fw in ("cargo_test", "cargo"):
        return ["cargo", "test"]

    # ── JVM / .NET (compilation requise — retourne None → NON_SUPPORTE) ──
    # junit, testng, xunit, nunit, mstest, kotest, scalatest
    return None


# ─────────────────────────────────────────────────────────────────────────────


class UnitTestService:

    def __init__(self, db: Session):
        self.db          = db
        self.ai_repo     = AIGenerationRepository(db)
        self.cahier_repo = CahierDeTestsRepository(db)

    # ─── Vérification d'appartenance ─────────────────────────────────────

    def _get_us(self, us_id: int, projet_id: int) -> UserStory:
        us = (
            self.db.query(UserStory)
            .join(Epic,   UserStory.epic_id   == Epic.id)
            .join(Module, Epic.module_id       == Module.id)
            .filter(UserStory.id == us_id, Module.projet_id == projet_id)
            .first()
        )
        if not us:
            raise HTTPException(
                status_code=404,
                detail="User Story introuvable ou n'appartient pas à ce projet.",
            )
        return us

    # ─── Démarrage de la génération (retour immédiat) ─────────────────────

    def demarrer_generation(
        self,
        us_id:        int,
        projet_id:    int,
        user_id:      int,
        file_content: bytes,
        filename:     str,
    ) -> AIGeneration:
        self._get_us(us_id, projet_id)

        # Sauvegarder le fichier source sur disque
        dest_dir = os.path.join(UPLOAD_DIR, str(us_id))
        os.makedirs(dest_dir, exist_ok=True)
        # Utiliser un nom unique pour éviter les conflits si plusieurs générations
        safe_filename = re.sub(r"[^\w.\-]", "_", filename)
        filepath = os.path.join(dest_dir, safe_filename)
        with open(filepath, "wb") as f:
            f.write(file_content)

        # Créer l'enregistrement AIGeneration
        gen = self.ai_repo.create_generation(projet_id, user_id, "generate_unit_tests")
        self.ai_repo.add_log(
            gen.id, "file_uploaded",
            f"Fichier '{safe_filename}' chargé ({len(file_content)} octets).", 2,
        )

        # Créer ou réinitialiser le CahierDeTests
        cahier = self.cahier_repo.get_by_userstory(us_id)
        if cahier:
            # Supprimer les anciens tests unitaires de ce cahier
            self.db.query(Test).filter(
                Test.cahier_id == cahier.id, Test.type == "unitaire"
            ).delete(synchronize_session="fetch")
            cahier.statut           = "generating"
            cahier.dateGeneration   = datetime.utcnow()
            cahier.nombreTests      = 0
            cahier.ai_generation_id = gen.id
            self.db.commit()
        else:
            cahier = CahierDeTests(
                userstory_id    = us_id,
                statut          = "generating",
                nombreTests     = 0,
                ai_generation_id = gen.id,
            )
            self.db.add(cahier)
            self.db.commit()
            self.db.refresh(cahier)

        return gen

    # ─── Exécution en arrière-plan ────────────────────────────────────────

    def executer_generation(self, generation_id: int, us_id: int, filename: str) -> None:
        try:
            self._run(generation_id, us_id, filename)
        except Exception as exc:
            self.ai_repo.update_status(generation_id, "failed", 0)
            self.ai_repo.add_log(generation_id, "error", str(exc), 0)
            gen = self.ai_repo.get_by_id(generation_id)
            if gen:
                cahier = self.cahier_repo.get_by_userstory(us_id)
                if cahier and cahier.ai_generation_id == generation_id:
                    cahier.statut = "failed"
                    self.db.commit()

    def _run(self, generation_id: int, us_id: int, filename: str) -> None:

        # Étape 1 : init
        self.ai_repo.update_status(generation_id, "processing", 5)
        self.ai_repo.add_log(
            generation_id, "init",
            "Démarrage de la génération des tests unitaires…", 5,
        )

        gen = self.ai_repo.get_by_id(generation_id)
        us  = self.db.query(UserStory).filter(UserStory.id == us_id).first()

        # Étape 2 : lecture du fichier source
        safe_filename = re.sub(r"[^\w.\-]", "_", filename)
        filepath = os.path.join(UPLOAD_DIR, str(us_id), safe_filename)
        if not os.path.exists(filepath):
            raise ValueError(f"Fichier source introuvable : {filepath}")

        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            code_content = f.read()

        self.ai_repo.add_log(
            generation_id, "reading_file",
            f"Fichier lu ({len(code_content)} caractères).", 15,
        )
        self.ai_repo.update_progress(generation_id, 15)

        # Étape 3 : envoi du prompt à l'IA
        self.ai_repo.add_log(generation_id, "sending_prompt", "Envoi du prompt au modèle IA…", 30)
        self.ai_repo.update_progress(generation_id, 30)

        us_titre    = us.titre              if us else "N/A"
        us_desc     = (us.description       or "N/A") if us else "N/A"
        us_criteres = (us.criteresAcceptation or "N/A") if us else "N/A"

        raw_json = self._appeler_ia(
            safe_filename, code_content, us_titre, us_desc, us_criteres, generation_id,
        )

        self.ai_repo.update_progress(generation_id, 65)
        self.ai_repo.add_log(generation_id, "parsing", "Réponse IA reçue — analyse du JSON…", 65)

        # Étape 4 : parsing
        parsed   = self._parser_reponse(raw_json)
        nb_tests = len(parsed.tests)

        self.ai_repo.update_progress(generation_id, 75)
        self.ai_repo.add_log(
            generation_id, "saving",
            f"{nb_tests} test(s) détecté(s) — sauvegarde en base…", 75,
        )

        # Étape 5 : sauvegarde
        cahier = self.cahier_repo.get_by_userstory(us_id)
        if not cahier:
            raise ValueError("Cahier de tests introuvable lors de la sauvegarde.")

        for test_data in parsed.tests:
            t = TestUnitaire(
                nom         = test_data.nom,
                description = test_data.description,
                type        = "unitaire",
                cahier_id   = cahier.id,
                userStoryId = us_id,
                framework   = parsed.framework,
                langage     = parsed.langage,
                code        = test_data.code,
                fichierTest = parsed.fichierTest,
            )
            self.db.add(t)
            self.db.flush()  # génère t.id sans commit

            for sc in test_data.scenarios:
                scenario = ScenarioTest(
                    nom        = sc.nom,
                    description= sc.description,
                    type       = sc.type,
                    test_id    = t.id,
                )
                self.db.add(scenario)

        cahier.nombreTests = nb_tests
        cahier.statut      = "brouillon"
        self.db.commit()

        # Étape 6 : terminé
        self.ai_repo.update_status(generation_id, "completed", 100)
        self.ai_repo.add_log(
            generation_id, "done",
            f"Génération terminée : {nb_tests} test(s) unitaire(s) créé(s).", 100,
        )

    # ─── Appel IA ────────────────────────────────────────────────────────

    def _appeler_ia(
        self,
        filename:     str,
        code_content: str,
        us_titre:     str,
        us_desc:      str,
        us_criteres:  str,
        generation_id: int,
    ) -> str:
        if not AI_API_KEY:
            raise ValueError("Clé API IA manquante. Définir ai_api_key dans .env")

        max_chars = 40_000
        if len(code_content) > max_chars:
            code_content = code_content[:max_chars] + "\n[... contenu tronqué ...]"

        full_prompt = USER_PROMPT_TEMPLATE.format(
            filename       = filename,
            code_content   = code_content,
            us_titre       = us_titre,
            us_description = us_desc,
            us_criteres    = us_criteres,
        )

        max_retries = 3
        for attempt in range(max_retries):
            try:
                return self._appeler_openrouter(full_prompt)
            except Exception as exc:
                err_str  = str(exc)
                is_quota = "429" in err_str or "quota" in err_str.lower() or "RESOURCE_EXHAUSTED" in err_str
                if not is_quota or attempt == max_retries - 1:
                    raise
                delay_match = re.search(r"retry_delay\s*\{\s*seconds:\s*(\d+)", err_str)
                wait = int(delay_match.group(1)) + 5 if delay_match else 30 * (2 ** attempt)
                self.ai_repo.add_log(
                    generation_id, "retrying",
                    f"Quota dépassé (429) — nouvelle tentative dans {wait}s "
                    f"(essai {attempt + 1}/{max_retries - 1})…",
                    30,
                )
                time.sleep(wait)

        raise RuntimeError("Échec après toutes les tentatives IA.")

    @staticmethod
    def _appeler_openrouter(full_prompt: str) -> str:
        import requests
        payload = {
            "model":    AI_MODEL,
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
        if resp.status_code == 429:
            raise Exception(f"429 Quota dépassé : {resp.text}")
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

    @staticmethod
    def _parser_reponse(raw: str) -> AIUnitTestResponse:
        # Chercher d'abord un bloc ```json ... ```
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

        return AIUnitTestResponse(**data)

    # ─── Points d'entrée publics ──────────────────────────────────────────

    def get_generation(self, generation_id: int, projet_id: int) -> AIGeneration:
        gen = self.ai_repo.get_detail(generation_id)
        if not gen or gen.projet_id != projet_id or gen.type != "generate_unit_tests":
            raise HTTPException(status_code=404, detail="Génération introuvable.")
        return gen

    def list_generations(self, projet_id: int) -> List[AIGeneration]:
        return (
            self.db.query(AIGeneration)
            .filter(
                AIGeneration.projet_id == projet_id,
                AIGeneration.type      == "generate_unit_tests",
            )
            .order_by(AIGeneration.created_at.desc())
            .all()
        )

    def get_cahier(self, us_id: int, projet_id: int) -> CahierDeTests:
        self._get_us(us_id, projet_id)
        cahier = self.cahier_repo.get_by_userstory(us_id)
        if not cahier:
            raise HTTPException(
                status_code=404,
                detail="Aucun cahier de tests pour cette User Story. Lancez d'abord une génération.",
            )
        return cahier

    def get_unit_tests(self, us_id: int, projet_id: int) -> List[TestUnitaire]:
        """Retourne tous les TestUnitaire d'une User Story."""
        cahier = self.get_cahier(us_id, projet_id)
        return (
            self.db.query(TestUnitaire)
            .filter(TestUnitaire.cahier_id == cahier.id)
            .all()
        )

    def get_test(self, test_id: int, us_id: int, projet_id: int) -> Test:
        """Retourne un Test (polymorphique TestUnitaire) avec toutes ses relations."""
        self._get_us(us_id, projet_id)
        t = (
            self.db.query(Test)
            .filter(
                Test.id         == test_id,
                Test.userStoryId == us_id,
                Test.type        == "unitaire",
            )
            .options(
                selectinload(Test.scenarios),
                selectinload(Test.validations),
                selectinload(Test.executions).selectinload(ExecutionTest.resultat),
            )
            .first()
        )
        if not t:
            raise HTTPException(status_code=404, detail="Test unitaire introuvable.")
        return t

    def modifier_test(
        self,
        test_id:   int,
        us_id:     int,
        projet_id: int,
        data:      UpdateTestUnitaireRequest,
    ) -> Test:
        t = self.get_test(test_id, us_id, projet_id)
        for field, value in data.model_dump(exclude_none=True).items():
            if hasattr(t, field):
                setattr(t, field, value)
        self.db.commit()
        self.db.refresh(t)
        return t

    # ─── Exécution d'un test ──────────────────────────────────────────────

    def executer_test(
        self,
        test_id:    int,
        us_id:      int,
        projet_id:  int,
        user_id:    int,
        use_docker: bool = False,
    ) -> ExecutionTest:
        t = self.get_test(test_id, us_id, projet_id)
        if not getattr(t, "code", None):
            raise HTTPException(status_code=400, detail="Le test n'a pas de code exécutable.")

        exec_record = ExecutionTest(
            test_id     = test_id,
            executeurId = user_id,
            statut      = "en_cours",
            dureeExecution = 0,
            dateExecution  = datetime.utcnow(),
        )
        self.db.add(exec_record)
        self.db.commit()
        self.db.refresh(exec_record)

        langage   = getattr(t, "langage",   "python") or "python"
        framework = getattr(t, "framework", "pytest") or "pytest"
        code      = getattr(t, "code",      "")       or ""

        statut, message_erreur, logs, duree = self._run_code(
            code, langage, framework,
        )

        exec_record.statut         = statut
        exec_record.dureeExecution = duree

        resultat = ResultatTest(
            execution_id   = exec_record.id,
            statut         = statut,
            messageErreur  = message_erreur if statut != "RÉUSSI" else None,
            logs           = logs,
        )
        self.db.add(resultat)
        self.db.commit()
        self.db.refresh(exec_record)

        return exec_record

    @staticmethod
    def _run_code(
        code: str, langage: str, framework: str
    ) -> tuple[str, Optional[str], str, int]:
        """Exécute le code dans un processus isolé.
        Retourne (statut, message_erreur, logs, durée_secondes).
        """
        import time as time_mod
        t0 = time_mod.time()
        tmp_path: Optional[str] = None

        try:
            suffix = _extension_for(langage)
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=suffix, delete=False, encoding="utf-8"
            ) as tmp:
                tmp.write(code)
                tmp_path = tmp.name

            cmd = _build_command(framework, tmp_path)
            if not cmd:
                return (
                    "NON_SUPPORTE",
                    f"Exécution automatique non supportée pour {langage}/{framework}.",
                    code,
                    0,
                )

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,
                encoding="utf-8",
                errors="ignore",
            )
            dur  = int(time_mod.time() - t0)
            logs = (result.stdout or "") + "\n" + (result.stderr or "")

            if result.returncode == 0:
                return ("RÉUSSI", None, logs.strip(), dur)
            else:
                return ("ÉCHOUÉ", result.stderr or "Test(s) échoué(s)", logs.strip(), dur)

        except subprocess.TimeoutExpired:
            return ("ÉCHOUÉ", "Délai d'exécution dépassé (60 s).", "", int(time_mod.time() - t0))
        except FileNotFoundError as exc:
            return ("NON_SUPPORTE", f"Outil non installé : {exc}", "", 0)
        except Exception as exc:
            return ("ÉCHOUÉ", str(exc), "", int(time_mod.time() - t0))
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

    # ─── Validation d'un test ─────────────────────────────────────────────

    def valider_test(
        self,
        test_id:   int,
        us_id:     int,
        projet_id: int,
        user_id:   int,
        data:      ValiderTestRequest,
    ) -> ValidationTest:
        self.get_test(test_id, us_id, projet_id)  # vérifie l'accès
        v = ValidationTest(
            testId       = test_id,
            validatorId  = user_id,
            statut       = data.statut,
            decision     = data.decision,
            commentaires = data.commentaires,
            goNoGo       = data.goNoGo,
        )
        self.db.add(v)
        self.db.commit()
        self.db.refresh(v)
        return v

    def get_executions(
        self, test_id: int, us_id: int, projet_id: int
    ) -> List[ExecutionTest]:
        self.get_test(test_id, us_id, projet_id)  # vérifie l'accès
        return (
            self.db.query(ExecutionTest)
            .options(selectinload(ExecutionTest.resultat))
            .filter(ExecutionTest.test_id == test_id)
            .order_by(ExecutionTest.dateExecution.desc())
            .all()
        )
