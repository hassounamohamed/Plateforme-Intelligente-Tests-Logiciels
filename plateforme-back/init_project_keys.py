"""
Script pour initialiser les clés (key) des projets existants
qui n'en ont pas encore.

La clé est générée à partir du nom du projet (ex: "Mon Projet" -> "MON")
ou peut être définie manuellement.

Usage: python init_project_keys.py
"""
from sqlalchemy.orm import Session
from db.database import SessionLocal
from models.scrum import Projet
import re


def generate_key_from_name(nom: str) -> str:
    """
    Génère une clé de projet à partir du nom.
    Ex: "Mon Projet de Test" -> "MPT"
         "Plateforme Agile" -> "PLAT"
         "CRM" -> "CRM"
    """
    # Supprimer les caractères spéciaux et garder les lettres
    mots = re.findall(r'\b[A-Za-zÀ-ÿ]+\b', nom)
    
    if not mots:
        return "PROJ"
    
    # Si un seul mot, prendre les 4 premières lettres
    if len(mots) == 1:
        return mots[0][:4].upper()
    
    # Sinon, prendre la première lettre de chaque mot (max 4)
    key = "".join([mot[0].upper() for mot in mots[:4]])
    
    # Minimum 2 caractères
    if len(key) < 2:
        key = mots[0][:4].upper()
    
    return key


def init_project_keys():
    """Initialise les clés pour tous les projets sans clé"""
    db: Session = SessionLocal()
    
    try:
        # Récupérer tous les projets sans clé
        projets_sans_key = db.query(Projet).filter(
            (Projet.key == None) | (Projet.key == "")
        ).all()
        
        print(f"Trouvé {len(projets_sans_key)} projets sans clé")
        
        if len(projets_sans_key) == 0:
            print("Tous les projets ont déjà une clé !")
            return
        
        # Ensemble pour vérifier les duplications
        existing_keys = set()
        all_projets = db.query(Projet).all()
        for p in all_projets:
            if p.key:
                existing_keys.add(p.key.upper())
        
        updated_count = 0
        
        for projet in projets_sans_key:
            # Générer une clé à partir du nom
            base_key = generate_key_from_name(projet.nom)
            key = base_key
            
            # Si la clé existe déjà, ajouter un suffixe numérique
            counter = 1
            while key.upper() in existing_keys:
                key = f"{base_key}{counter}"
                counter += 1
            
            # Mettre à jour le projet
            projet.key = key.upper()
            
            # Initialiser le compteur d'issues si nécessaire
            if projet.issue_counter is None:
                projet.issue_counter = 0
            
            existing_keys.add(key.upper())
            updated_count += 1
            
            print(f"✓ Projet #{projet.id} '{projet.nom}' -> {key.upper()}")
        
        # Commit les changements
        db.commit()
        print(f"\n✅ Initialisation terminée : {updated_count} projets mis à jour")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation : {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=== Initialisation des clés de projets ===\n")
    init_project_keys()
    print("\n=== Initialisation terminée ===")
