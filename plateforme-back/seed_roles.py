"""
Script pour initialiser les 5 rôles prédéfinis de la plateforme
"""
from db.database import SessionLocal, Base, engine
from repositories.user_repository import RoleRepository
from core.rbac.constants import (
    ROLE_SUPER_ADMIN, ROLE_PRODUCT_OWNER, ROLE_SCRUM_MASTER,
    ROLE_DEVELOPPEUR, ROLE_TESTEUR_QA,
    NIVEAU_SUPER_ADMIN, NIVEAU_PRODUCT_OWNER, NIVEAU_SCRUM_MASTER,
    NIVEAU_DEVELOPPEUR, NIVEAU_TESTEUR_QA
)


def main():
    """Initialiser les 5 rôles de la plateforme"""
    print("=" * 60)
    print(" INITIALISATION DES RÔLES")
    print("=" * 60)
    
    # Créer les tables
    print("\n Création des tables...")
    Base.metadata.create_all(bind=engine)
    print(" Tables créées")
    
    # Créer une session
    db = SessionLocal()
    
    try:
        role_repo = RoleRepository(db)
        
        # Définition des 5 rôles
        roles_data = [
            {
                "nom": "Super Administrateur",
                "code": ROLE_SUPER_ADMIN,
                "description": "Accès complet à toutes les fonctionnalités de la plateforme",
                "niveau_acces": NIVEAU_SUPER_ADMIN
            },
            {
                "nom": "Product Owner",
                "code": ROLE_PRODUCT_OWNER,
                "description": "Définit les besoins - Gère projets, epics et user stories",
                "niveau_acces": NIVEAU_PRODUCT_OWNER
            },
            {
                "nom": "Scrum Master",
                "code": ROLE_SCRUM_MASTER,
                "description": "Organise les sprints - Gère le workflow Scrum",
                "niveau_acces": NIVEAU_SCRUM_MASTER
            },
            {
                "nom": "Testeur QA",
                "code": ROLE_TESTEUR_QA,
                "description": "Fait les tests - Exécute et valide les tests",
                "niveau_acces": NIVEAU_TESTEUR_QA
            },
            {
                "nom": "Développeur",
                "code": ROLE_DEVELOPPEUR,
                "description": "Code et réalise les tests unitaires",
                "niveau_acces": NIVEAU_DEVELOPPEUR
            },
        ]
        
        print("\n👥 Création des rôles...")
        for role_data in roles_data:
            # Vérifier si le rôle existe déjà
            existing_role = role_repo.get_by_code(role_data["code"])
            
            if existing_role:
                print(f" Rôle '{role_data['nom']}' existe déjà")
            else:
                role = role_repo.create(role_data)
                print(f" Rôle '{role_data['nom']}' créé (code: {role_data['code']}, niveau: {role_data['niveau_acces']})")
        
        print("\n" + "=" * 60)
        print(" INITIALISATION DES RÔLES TERMINÉE!")
        print("=" * 60)
        print(f"\n Rôles disponibles:")
        print(f"   1. Super Administrateur (SUPER_ADMIN) - Niveau 100")
        print(f"   4. Product Owner (PRODUCT_OWNER) - Niveau 80")
        print(f"   5. Scrum Master (SCRUM_MASTER) - Niveau 70")
        print(f"   3. Testeur QA (TESTEUR_QA) - Niveau 60")
        print(f"   2. Développeur (DEVELOPPEUR) - Niveau 50")
        
    except Exception as e:
        print(f"\n Erreur: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
