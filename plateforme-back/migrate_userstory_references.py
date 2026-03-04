"""
Script de migration pour générer les références des user stories existantes
qui n'en ont pas encore.

Usage: python migrate_userstory_references.py
"""
from sqlalchemy.orm import Session
from db.database import SessionLocal
from models.scrum import UserStory, Epic, Module, Projet
from models.user import Utilisateur


def migrate_userstory_references():
    """Génère les références pour toutes les user stories sans référence"""
    db: Session = SessionLocal()
    
    try:
        # Récupérer toutes les user stories sans référence
        userstories_sans_ref = db.query(UserStory).filter(
            (UserStory.reference == None) | (UserStory.reference == "")
        ).all()
        
        print(f"Trouvé {len(userstories_sans_ref)} user stories sans référence")
        
        if len(userstories_sans_ref) == 0:
            print("Aucune migration nécessaire !")
            return
        
        updated_count = 0
        
        for us in userstories_sans_ref:
            # Remonter à l'epic, puis au module, puis au projet
            epic = db.query(Epic).filter(Epic.id == us.epic_id).first()
            if not epic:
                print(f"⚠️  Epic introuvable pour user story {us.id}, skip")
                continue
            
            module = db.query(Module).filter(Module.id == epic.module_id).first()
            if not module:
                print(f"⚠️  Module introuvable pour epic {epic.id}, skip")
                continue
            
            projet = db.query(Projet).filter(Projet.id == module.projet_id).first()
            if not projet:
                print(f"⚠️  Projet introuvable pour module {module.id}, skip")
                continue
            
            # Générer la référence
            if not projet.key:
                print(f"⚠️  Projet {projet.id} n'a pas de clé (key), skip")
                continue
            
            # Incrémenter le compteur du projet
            projet.issue_counter += 1
            numero = projet.issue_counter
            reference = f"{projet.key}-{numero}"
            
            # Mettre à jour la user story
            us.reference = reference
            updated_count += 1
            
            print(f"✓ User Story #{us.id} '{us.titre}' -> {reference}")
        
        # Commit les changements
        db.commit()
        print(f"\n✅ Migration terminée : {updated_count} user stories mises à jour")
        
    except Exception as e:
        print(f"❌ Erreur lors de la migration : {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=== Migration des références de User Stories ===\n")
    migrate_userstory_references()
    print("\n=== Migration terminée ===")
