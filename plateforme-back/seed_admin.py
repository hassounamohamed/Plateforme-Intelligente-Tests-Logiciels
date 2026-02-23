"""
Script pour créer un utilisateur Super Admin initial
"""
from db.database import SessionLocal, engine, Base
from repositories.user_repository import UserRepository, RoleRepository
from core.security import hash_password
from core.rbac.constants import ROLE_SUPER_ADMIN, NIVEAU_SUPER_ADMIN


def main():
    """Créer l'utilisateur Super Admin"""
    print("=" * 60)
    print("🚀 Création du Super Admin")
    print("=" * 60)
    
    # Créer les tables
    print("\n📦 Création des tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables créées")
    
    # Créer une session
    db = SessionLocal()
    
    try:
        role_repo = RoleRepository(db)
        user_repo = UserRepository(db)
        
        # Vérifier/Créer le rôle Super Admin
        print("\n👥 Vérification du rôle Super Admin...")
        super_admin_role = role_repo.get_by_code(ROLE_SUPER_ADMIN)
        
        if not super_admin_role:
            role_data = {
                "nom": "Super Administrateur",
                "code": ROLE_SUPER_ADMIN,
                "description": "Accès complet à toutes les fonctionnalités",
                "niveau_acces": NIVEAU_SUPER_ADMIN
            }
            super_admin_role = role_repo.create(role_data)
            print(f"✓ Rôle Super Admin créé")
        else:
            print(f"→ Rôle Super Admin existe déjà")
        
        # Vérifier/Créer l'utilisateur admin
        print("\n👤 Création de l'utilisateur Super Admin...")
        existing_admin = user_repo.get_by_email("admin@example.com")
        
        if existing_admin:
            print(f"→ Utilisateur admin existe déjà: {existing_admin.email}")
        else:
            admin_data = {
                "nom": "Super Admin",
                "email": "admin@example.com",
                "motDePasse": hash_password("admin123"),
                "telephone": "+33000000000",
                "role_id": super_admin_role.id,
                "actif": True
            }
            
            admin = user_repo.create(admin_data)
            print(f"✓ Utilisateur Super Admin créé: {admin.email}")
        
        print("\n" + "=" * 60)
        print("✅ Super Admin initialisé avec succès!")
        print("=" * 60)
        print(f"\n🔑 Identifiants Super Admin:")
        print(f"   Email: admin@example.com")
        print(f"   Mot de passe: admin123")
        print(f"\n⚠️  Pensez à changer le mot de passe après la première connexion!")
        
    except Exception as e:
        print(f"\n❌ Erreur: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()