"""
Repository de base fournissant les opérations CRUD génériques
"""
from __future__ import annotations
from typing import Generic, TypeVar, Type, List, Optional, Any, Dict
from sqlalchemy.orm import Session
from db.database import Base

ModelType = TypeVar("ModelType")  # type: ignore


class BaseRepository(Generic[ModelType]):
    """Repository de base avec opérations CRUD génériques"""
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def create(self, obj_in: Dict[str, Any]) -> ModelType:
        """Créer un nouvel enregistrement"""
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def get_by_id(self, id: int) -> Optional[ModelType]:
        """Récupérer un enregistrement par ID"""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Récupérer tous les enregistrements avec pagination"""
        return self.db.query(self.model).offset(skip).limit(limit).all()
    
    def update(self, id: int, obj_in: Dict[str, Any]) -> Optional[ModelType]:
        """Mettre à jour un enregistrement"""
        db_obj = self.get_by_id(id)
        if db_obj:
            for field, value in obj_in.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            self.db.commit()
            self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: int) -> bool:
        """Supprimer un enregistrement"""
        db_obj = self.get_by_id(id)
        if db_obj:
            self.db.delete(db_obj)
            self.db.commit()
            return True
        return False
    
    def count(self) -> int:
        """Compter le nombre total d'enregistrements"""
        return self.db.query(self.model).count()
    
    def exists(self, id: int) -> bool:
        """Vérifier si un enregistrement existe"""
        return self.db.query(self.model).filter(self.model.id == id).first() is not None
