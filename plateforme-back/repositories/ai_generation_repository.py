"""
Repository pour la gestion des jobs de génération IA.
"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from models.ai_generation import AIGeneration, AIGeneratedItem, AILog, AIPromptLog
from repositories.base_repository import BaseRepository


class AIGenerationRepository(BaseRepository[AIGeneration]):

    def __init__(self, db: Session):
        super().__init__(AIGeneration, db)

    # ── Génération ────────────────────────────────────────────────────────

    def create_generation(self, projet_id: int, user_id: int, type_: str = "generate_scrum") -> AIGeneration:
        gen = AIGeneration(
            projet_id=projet_id,
            user_id=user_id,
            type=type_,
            status="pending",
            progress=0,
        )
        self.db.add(gen)
        self.db.commit()
        self.db.refresh(gen)
        return gen

    def get_by_projet(self, projet_id: int) -> List[AIGeneration]:
        return (
            self.db.query(AIGeneration)
            .filter(AIGeneration.projet_id == projet_id)
            .order_by(AIGeneration.created_at.desc())
            .all()
        )

    def get_detail(self, generation_id: int) -> Optional[AIGeneration]:
        return (
            self.db.query(AIGeneration)
            .options(joinedload(AIGeneration.logs), joinedload(AIGeneration.items))
            .filter(AIGeneration.id == generation_id)
            .first()
        )

    def update_status(self, generation_id: int, status: str, progress: int = None) -> Optional[AIGeneration]:
        gen = self.get_by_id(generation_id)
        if gen:
            gen.status = status
            if progress is not None:
                gen.progress = progress
            if status in ("completed", "failed"):
                gen.completed_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(gen)
        return gen

    def update_progress(self, generation_id: int, progress: int) -> Optional[AIGeneration]:
        gen = self.get_by_id(generation_id)
        if gen:
            gen.progress = progress
            self.db.commit()
            self.db.refresh(gen)
        return gen

    # ── Logs ──────────────────────────────────────────────────────────────

    def add_log(self, generation_id: int, step: str, message: str, progress: int) -> AILog:
        log = AILog(
            generation_id=generation_id,
            step=step,
            message=message,
            progress=progress,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    # ── Items générés ─────────────────────────────────────────────────────

    def add_item(
        self,
        generation_id: int,
        type_: str,
        title: str,
        description: str = None,
        parent_id: Optional[int] = None,
        acceptance_criteria: Optional[str] = None,
        priority: Optional[str] = None,
        story_points: Optional[int] = None,
        sprint: Optional[int] = None,
        duration: Optional[str] = None,
    ) -> AIGeneratedItem:
        item = AIGeneratedItem(
            generation_id=generation_id,
            type=type_,
            title=title,
            description=description,
            parent_id=parent_id,
            acceptance_criteria=acceptance_criteria,
            priority=priority,
            story_points=story_points,
            sprint=sprint,
            duration=duration,
            status="draft",
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get_items_by_generation(self, generation_id: int) -> List[AIGeneratedItem]:
        return (
            self.db.query(AIGeneratedItem)
            .filter(AIGeneratedItem.generation_id == generation_id)
            .order_by(AIGeneratedItem.id)
            .all()
        )

    def get_root_items(self, generation_id: int) -> List[AIGeneratedItem]:
        """Retourne uniquement les items de niveau racine (modules ou epics sans parent)."""
        return (
            self.db.query(AIGeneratedItem)
            .options(joinedload(AIGeneratedItem.children))
            .filter(
                AIGeneratedItem.generation_id == generation_id,
                AIGeneratedItem.parent_id.is_(None),
            )
            .order_by(AIGeneratedItem.id)
            .all()
        )

    def get_item_by_id(self, item_id: int, generation_id: int) -> Optional[AIGeneratedItem]:
        return (
            self.db.query(AIGeneratedItem)
            .filter(
                AIGeneratedItem.id == item_id,
                AIGeneratedItem.generation_id == generation_id,
            )
            .first()
        )

    def update_item(self, item_id: int, **kwargs) -> Optional[AIGeneratedItem]:
        item = self.db.query(AIGeneratedItem).filter(AIGeneratedItem.id == item_id).first()
        if item:
            for key, value in kwargs.items():
                if value is not None and hasattr(item, key):
                    setattr(item, key, value)
            self.db.commit()
            self.db.refresh(item)
        return item

    def delete_items_by_generation(self, generation_id: int) -> None:
        self.db.query(AIGeneratedItem).filter(
            AIGeneratedItem.generation_id == generation_id
        ).delete()
        self.db.commit()


# ─── AIPromptLog repository ───────────────────────────────────────────────────

class AIPromptLogRepository:
    """CRUD et requêtes analytiques sur la table ai_prompt_logs."""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        action_type: str,
        prompt: str,
        *,
        projet_id: Optional[int] = None,
        user_id: Optional[int] = None,
        response: Optional[str] = None,
        model_used: Optional[str] = None,
        tokens_used: Optional[int] = None,
        response_time: Optional[float] = None,
        status: str = "success",
    ) -> AIPromptLog:
        log = AIPromptLog(
            projet_id=projet_id,
            user_id=user_id,
            action_type=action_type,
            prompt=prompt,
            response=response,
            model_used=model_used,
            tokens_used=tokens_used,
            response_time=response_time,
            status=status,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_by_id(self, log_id: int) -> Optional[AIPromptLog]:
        return self.db.query(AIPromptLog).filter(AIPromptLog.id == log_id).first()

    def get_by_projet(self, projet_id: int, limit: int = 100) -> List[AIPromptLog]:
        return (
            self.db.query(AIPromptLog)
            .filter(AIPromptLog.projet_id == projet_id)
            .order_by(AIPromptLog.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_by_user(self, user_id: int, limit: int = 100) -> List[AIPromptLog]:
        return (
            self.db.query(AIPromptLog)
            .filter(AIPromptLog.user_id == user_id)
            .order_by(AIPromptLog.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_by_action_type(self, action_type: str, limit: int = 100) -> List[AIPromptLog]:
        return (
            self.db.query(AIPromptLog)
            .filter(AIPromptLog.action_type == action_type)
            .order_by(AIPromptLog.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_dataset(
        self,
        action_type: Optional[str] = None,
        model_used: Optional[str] = None,
        limit: int = 1000,
    ) -> List[AIPromptLog]:
        """
        Retourne les interactions réussies (status='success') avec une réponse non nulle,
        filtrées optionnellement par action_type et/ou model_used.
        Conçu pour l'export en dataset d'entraînement/évaluation.
        """
        q = (
            self.db.query(AIPromptLog)
            .filter(AIPromptLog.status == "success", AIPromptLog.response.isnot(None))
        )
        if action_type:
            q = q.filter(AIPromptLog.action_type == action_type)
        if model_used:
            q = q.filter(AIPromptLog.model_used == model_used)
        return q.order_by(AIPromptLog.created_at.desc()).limit(limit).all()
