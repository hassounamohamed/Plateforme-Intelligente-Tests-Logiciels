"""
Repository pour la gestion des éléments Scrum (Projet, Module, Epic, Sprint, UserStory)
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime

from models.scrum import Projet, Module, Epic, Sprint, UserStory
from repositories.base_repository import BaseRepository


class ProjetRepository(BaseRepository[Projet]):
    """Repository pour les projets"""
    
    def __init__(self, db: Session):
        super().__init__(Projet, db)
    
    def get_by_product_owner(self, product_owner_id: int) -> List[Projet]:
        """Récupérer tous les projets d'un Product Owner"""
        return self.db.query(Projet).filter(Projet.productOwnerId == product_owner_id).all()
    
    def get_by_status(self, statut: str) -> List[Projet]:
        """Récupérer les projets par statut"""
        return self.db.query(Projet).filter(Projet.statut == statut).all()
    
    def get_active_projects(self) -> List[Projet]:
        """Récupérer les projets actifs (en cours)"""
        return self.db.query(Projet).filter(Projet.statut == "EN_COURS").all()


class ModuleRepository(BaseRepository[Module]):
    """Repository pour les modules"""
    
    def __init__(self, db: Session):
        super().__init__(Module, db)
    
    def get_by_projet(self, projet_id: int) -> List[Module]:
        """Récupérer tous les modules d'un projet"""
        return self.db.query(Module).filter(Module.projet_id == projet_id).order_by(Module.ordre).all()
    
    def reorder_modules(self, projet_id: int, module_orders: dict) -> bool:
        """Réorganiser l'ordre des modules"""
        for module_id, order in module_orders.items():
            module = self.get_by_id(module_id)
            if module and module.projet_id == projet_id:
                module.ordre = order
        self.db.commit()
        return True


class EpicRepository(BaseRepository[Epic]):
    """Repository pour les epics"""
    
    def __init__(self, db: Session):
        super().__init__(Epic, db)
    
    def get_by_module(self, module_id: int) -> List[Epic]:
        """Récupérer tous les epics d'un module"""
        return self.db.query(Epic).filter(Epic.module_id == module_id).order_by(Epic.priorite.desc()).all()
    
    def get_by_product_owner(self, product_owner_id: int) -> List[Epic]:
        """Récupérer tous les epics d'un Product Owner"""
        return self.db.query(Epic).filter(Epic.productOwnerId == product_owner_id).all()
    
    def get_by_status(self, statut: str) -> List[Epic]:
        """Récupérer les epics par statut"""
        return self.db.query(Epic).filter(Epic.statut == statut).all()
    
    def get_by_priority(self, min_priority: int) -> List[Epic]:
        """Récupérer les epics avec une priorité minimum"""
        return self.db.query(Epic).filter(Epic.priorite >= min_priority).order_by(Epic.priorite.desc()).all()


class SprintRepository(BaseRepository[Sprint]):
    """Repository pour les sprints"""
    
    def __init__(self, db: Session):
        super().__init__(Sprint, db)
    
    def get_by_projet(self, projet_id: int) -> List[Sprint]:
        """Récupérer tous les sprints d'un projet"""
        return self.db.query(Sprint).filter(Sprint.projet_id == projet_id).order_by(Sprint.dateDebut.desc()).all()
    
    def get_by_scrum_master(self, scrum_master_id: int) -> List[Sprint]:
        """Récupérer tous les sprints d'un Scrum Master"""
        return self.db.query(Sprint).filter(Sprint.scrumMasterId == scrum_master_id).all()
    
    def get_active_sprints(self) -> List[Sprint]:
        """Récupérer les sprints en cours"""
        return self.db.query(Sprint).filter(Sprint.statut == "EN_COURS").all()
    
    def get_current_sprint(self, projet_id: int) -> Optional[Sprint]:
        """Récupérer le sprint actuel d'un projet"""
        now = datetime.utcnow()
        return self.db.query(Sprint).filter(
            Sprint.projet_id == projet_id,
            Sprint.dateDebut <= now,
            Sprint.dateFin >= now,
            Sprint.statut == "EN_COURS"
        ).first()
    
    def add_user_stories(self, sprint_id: int, userstory_ids: List[int]) -> Optional[Sprint]:
        """Ajouter des user stories à un sprint"""
        from models.scrum import UserStory
        sprint = self.get_by_id(sprint_id)
        if sprint:
            userstories = self.db.query(UserStory).filter(UserStory.id.in_(userstory_ids)).all()
            sprint.userstories.extend([us for us in userstories if us not in sprint.userstories])
            self.db.commit()
            self.db.refresh(sprint)
        return sprint


class UserStoryRepository(BaseRepository[UserStory]):
    """Repository pour les user stories"""
    
    def __init__(self, db: Session):
        super().__init__(UserStory, db)
    
    def get_by_epic(self, epic_id: int) -> List[UserStory]:
        """Récupérer toutes les user stories d'un epic"""
        return self.db.query(UserStory).filter(UserStory.epic_id == epic_id).order_by(UserStory.priorite.desc()).all()
    
    def get_by_developer(self, developer_id: int) -> List[UserStory]:
        """Récupérer toutes les user stories d'un développeur"""
        return self.db.query(UserStory).filter(UserStory.developerId == developer_id).all()
    
    def get_by_status(self, statut: str) -> List[UserStory]:
        """Récupérer les user stories par statut"""
        return self.db.query(UserStory).filter(UserStory.statut == statut).all()
    
    def get_by_sprint(self, sprint_id: int) -> List[UserStory]:
        """Récupérer toutes les user stories d'un sprint"""
        from models.scrum import Sprint
        sprint = self.db.query(Sprint).filter(Sprint.id == sprint_id).first()
        return list(sprint.userstories) if sprint else []
    
    def get_backlog(self, epic_id: int = None) -> List[UserStory]:
        """Récupérer le backlog (user stories non assignées à un sprint)"""
        from models.scrum import Sprint
        from db.associations import sprint_userstory
        
        query = self.db.query(UserStory).outerjoin(
            sprint_userstory
        ).filter(sprint_userstory.c.userstory_id == None)
        
        if epic_id:
            query = query.filter(UserStory.epic_id == epic_id)
        
        return query.order_by(UserStory.priorite.desc()).all()
