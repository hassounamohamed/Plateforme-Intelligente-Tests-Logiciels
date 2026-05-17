from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import Utilisateur
from models.scrum import Projet
from models.cahier_test_global import CasTest, CahierTestGlobal
from models.rapports import RapportQA

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", summary="Statistiques publiques de la plateforme")
def get_public_stats(db: Session = Depends(get_db)):
    """
    Retourne les statistiques globales de la plateforme sans authentification.
    Utilisé sur la page d'accueil pour afficher les métriques clés.
    """
    nb_utilisateurs = db.query(Utilisateur).count()
    nb_projets = db.query(Projet).count()
    nb_cas_tests = db.query(CasTest).count()
    nb_rapports = db.query(RapportQA).count()

    return {
        "utilisateurs": nb_utilisateurs,
        "projets": nb_projets,
        "cas_tests": nb_cas_tests,
        "rapports_qa": nb_rapports,
    }
