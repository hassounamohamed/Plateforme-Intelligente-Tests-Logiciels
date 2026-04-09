"""
Repository pour le Cahier de Tests Global.
"""
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from models.cahier_test_global import CahierTestGlobal, CasTest, CasTestHistory
from repositories.base_repository import BaseRepository


class CahierTestGlobalRepository(BaseRepository[CahierTestGlobal]):

    def __init__(self, db: Session):
        super().__init__(CahierTestGlobal, db)

    # ── Cahier ────────────────────────────────────────────────────────────

    def get_by_projet(self, projet_id: int) -> Optional[CahierTestGlobal]:
        return (
            self.db.query(CahierTestGlobal)
            .filter(CahierTestGlobal.projet_id == projet_id)
            .first()
        )

    def get_detail(self, cahier_id: int) -> Optional[CahierTestGlobal]:
        return (
            self.db.query(CahierTestGlobal)
            .options(joinedload(CahierTestGlobal.cas_tests))
            .filter(CahierTestGlobal.id == cahier_id)
            .first()
        )

    def get_detail_by_projet(self, projet_id: int) -> Optional[CahierTestGlobal]:
        return (
            self.db.query(CahierTestGlobal)
            .options(joinedload(CahierTestGlobal.cas_tests))
            .filter(CahierTestGlobal.projet_id == projet_id)
            .first()
        )

    def create_cahier(self, projet_id: int, user_id: int, version: str = "1.0.0",
                      ai_generation_id: int = None) -> CahierTestGlobal:
        cahier = CahierTestGlobal(
            projet_id=projet_id,
            generated_by_id=user_id,
            version=version,
            statut="generating",
            ai_generation_id=ai_generation_id,
            nombre_total=0,
            nombre_reussi=0,
            nombre_echoue=0,
            nombre_bloque=0,
        )
        self.db.add(cahier)
        self.db.commit()
        self.db.refresh(cahier)
        return cahier

    def delete_cas_tests(self, cahier_id: int) -> None:
        """Supprime tous les cas de tests existants d'un cahier avant régénération."""
        self.db.query(CasTest).filter(CasTest.cahier_id == cahier_id).delete()
        self.db.commit()

    def recalculer_stats(self, cahier_id: int) -> CahierTestGlobal:
        """Recalcule les compteurs de statistiques du cahier."""
        cahier = self.get_by_id(cahier_id)
        if not cahier:
            return cahier
        cas = self.db.query(CasTest).filter(CasTest.cahier_id == cahier_id).all()
        cahier.nombre_total  = len(cas)
        cahier.nombre_reussi = sum(1 for c in cas if c.statut_test == "Réussi")
        cahier.nombre_echoue = sum(1 for c in cas if c.statut_test == "Échoué")
        cahier.nombre_bloque = sum(1 for c in cas if c.statut_test == "Bloqué")
        self.db.commit()
        self.db.refresh(cahier)
        return cahier

    def valider(self, cahier_id: int, version: Optional[str] = None) -> Optional[CahierTestGlobal]:
        cahier = self.get_by_id(cahier_id)
        if cahier:
            cahier.statut = "valide"
            if version:
                cahier.version = version
            self.db.commit()
            self.db.refresh(cahier)
        return cahier

    # ── Cas de tests ──────────────────────────────────────────────────────

    def add_cas_test(
        self,
        cahier_id: int,
        sprint: str,
        module: str,
        sous_module: str,
        test_ref: str,
        test_case: str,
        test_purpose: str,
        type_utilisateur: str,
        scenario_test: str,
        resultat_attendu: str,
        execution_time_seconds: int | None,
        type_test: str,
        ordre: int,
    ) -> CasTest:
        cas = CasTest(
            cahier_id=cahier_id,
            sprint=sprint,
            module=module,
            sous_module=sous_module,
            test_ref=test_ref,
            test_case=test_case,
            test_purpose=test_purpose,
            type_utilisateur=type_utilisateur,
            scenario_test=scenario_test,
            resultat_attendu=resultat_attendu,
            execution_time_seconds=execution_time_seconds,
            type_test=type_test,
            statut_test="Non exécuté",
            ordre=ordre,
        )
        self.db.add(cas)
        self.db.commit()
        self.db.refresh(cas)
        return cas

    def get_cas_test(self, cas_id: int, cahier_id: int) -> Optional[CasTest]:
        return (
            self.db.query(CasTest)
            .filter(CasTest.id == cas_id, CasTest.cahier_id == cahier_id)
            .first()
        )

    def update_cas_test(self, cas_id: int, cahier_id: int, data: dict) -> Optional[CasTest]:
        cas = self.get_cas_test(cas_id, cahier_id)
        if not cas:
            return None
        for field, value in data.items():
            if hasattr(cas, field) and value is not None:
                setattr(cas, field, value)
        self.db.commit()
        self.db.refresh(cas)
        return cas

    def list_cas_tests(self, cahier_id: int) -> List[CasTest]:
        return (
            self.db.query(CasTest)
            .filter(CasTest.cahier_id == cahier_id)
            .order_by(CasTest.ordre.asc())
            .all()
        )

    def add_cas_test_history(self, payload: dict) -> CasTestHistory:
        entry = CasTestHistory(**payload)
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def list_cas_test_history(self, cas_id: int, cahier_id: int) -> List[CasTestHistory]:
        return (
            self.db.query(CasTestHistory)
            .filter(CasTestHistory.cas_test_id == cas_id, CasTestHistory.cahier_id == cahier_id)
            .order_by(CasTestHistory.changed_at.desc())
            .all()
        )
