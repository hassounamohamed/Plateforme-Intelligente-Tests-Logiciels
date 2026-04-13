from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from db.database import Base


class RapportQA(Base):
    __tablename__ = "rapport_qa"

    id = Column(Integer, primary_key=True)
    version = Column(String(20), default="1.0.0", nullable=False)
    dateGeneration = Column(DateTime, default=datetime.utcnow)
    statut = Column(String)
    tauxReussite = Column(Float)
    nombreTestsExecutes = Column(Integer, default=0)
    nombreTestsReussis = Column(Integer, default=0)
    nombreTestsEchoues = Column(Integer, default=0)
    recommandations = Column(Text)

    cahierId = Column(Integer, ForeignKey("cahier_test_global.id", ondelete="CASCADE"), unique=True)

    # Relations
    cahier = relationship("CahierTestGlobal", back_populates="rapport_qa")
    indicateurs = relationship("IndicateurQualite", back_populates="rapport", uselist=False, cascade="all, delete-orphan")
    recommandations_qualite = relationship("RecommandationQualite", back_populates="rapport", cascade="all, delete-orphan")

    @property
    def nombreTestsTotal(self) -> int:
        if not self.cahier:
            return self.nombreTestsExecutes or 0
        return self.cahier.nombre_total or 0

    @property
    def nombreTestsBloques(self) -> int:
        if self.cahier:
            return self.cahier.nombre_bloque or 0
        anomalies = self.indicateurs.nombreAnomalies if self.indicateurs else 0
        return max(0, (anomalies or 0) - (self.nombreTestsEchoues or 0))

    @property
    def nombreTestsNonExecutes(self) -> int:
        total = self.nombreTestsTotal
        executes = self.nombreTestsExecutes or 0
        return max(0, total - executes)

    @property
    def passRate(self) -> float:
        return float(self.tauxReussite or (self.indicateurs.tauxReussite if self.indicateurs else 0.0) or 0.0)

    @property
    def coverageRate(self) -> float:
        if self.indicateurs and self.indicateurs.tauxCouverture is not None:
            return float(self.indicateurs.tauxCouverture)
        total = self.nombreTestsTotal
        if total <= 0:
            return 0.0
        return round((float(self.nombreTestsExecutes or 0) / float(total)) * 100.0, 2)

    @property
    def qualityIndex(self) -> float:
        if self.indicateurs and self.indicateurs.indiceQualite is not None:
            return float(self.indicateurs.indiceQualite)
        return 0.0

    @property
    def trendDisplay(self) -> str:
        if (self.nombreTestsExecutes or 0) == 0:
            return "Non evaluable"
        tendance = ((self.indicateurs.tendance if self.indicateurs else None) or "stable").lower()
        if "amelior" in tendance:
            return "Amelioration"
        if "degrad" in tendance:
            return "Degradation"
        return "Stable"

    @property
    def decisionRelease(self) -> str:
        executes = self.nombreTestsExecutes or 0
        failed = self.nombreTestsEchoues or 0
        critical = self.indicateurs.nombreAnomaliesCritiques if self.indicateurs else 0
        pass_rate = self.passRate
        if executes == 0:
            return "NO GO"
        if critical and critical > 0:
            return "NO GO"
        if failed > 0:
            return "NO GO"
        if pass_rate < 75:
            return "NO GO"
        return "GO"

    @property
    def observationMessage(self) -> str:
        executes = self.nombreTestsExecutes or 0
        failed = self.nombreTestsEchoues or 0
        critical = self.indicateurs.nombreAnomaliesCritiques if self.indicateurs else 0
        if executes == 0:
            return "Aucun test n'a ete execute. Le rapport ne peut pas etre evalue."
        if failed > 0 or critical > 0:
            return "Le systeme n'est pas pret pour une mise en production. Une stabilisation est requise."
        return "Les indicateurs sont stables avec une execution exploitable pour validation de release."

    @property
    def recommendationLines(self) -> list[str]:
        text = (self.recommandations or "").strip()
        if not text:
            return []
        lines: list[str] = []
        for raw in text.splitlines():
            line = raw.strip().lstrip("-* ").strip()
            if line:
                lines.append(line)
        return lines

    @property
    def trendData(self) -> list[dict]:
        labels = ["J-5", "J-4", "J-3", "J-2", "J-1", "J"]
        today = datetime.utcnow().date()
        days = [today - timedelta(days=offset) for offset in range(5, -1, -1)]
        buckets = {day: {"exec": 0, "fail": 0} for day in days}

        executed_statuses = {"Réussi", "Reussi", "Échoué", "Echoue", "Bloqué", "Bloque"}
        failing_statuses = {"Échoué", "Echoue", "Bloqué", "Bloque"}

        if self.cahier and self.cahier.cas_tests:
            for cas in self.cahier.cas_tests:
                for history in cas.history_entries or []:
                    if not history.changed_at:
                        continue
                    day = history.changed_at.date()
                    if day not in buckets:
                        continue
                    statut = (history.new_statut_test or "").strip()
                    if statut in executed_statuses:
                        buckets[day]["exec"] += 1
                    if statut in failing_statuses:
                        buckets[day]["fail"] += 1

        # Fallback si aucun historique: on reflète le snapshot actuel sur J.
        if all(buckets[day]["exec"] == 0 and buckets[day]["fail"] == 0 for day in days):
            buckets[today]["exec"] = int(self.nombreTestsExecutes or 0)
            buckets[today]["fail"] = int(self.nombreTestsEchoues or 0)

        return [
            {
                "label": labels[i],
                "exec": int(buckets[day]["exec"]),
                "fail": int(buckets[day]["fail"]),
            }
            for i, day in enumerate(days)
        ]


class IndicateurQualite(Base):
    __tablename__ = "indicateur_qualite"

    id = Column(Integer, primary_key=True)
    tauxCouverture = Column(Float)
    tauxReussite = Column(Float)
    nombreAnomalies = Column(Integer, default=0)
    nombreAnomaliesCritiques = Column(Integer, default=0)
    indiceQualite = Column(Float)
    tendance = Column(String)

    rapportId = Column(Integer, ForeignKey("rapport_qa.id"))

    # Relations
    rapport = relationship("RapportQA", back_populates="indicateurs")


class RecommandationQualite(Base):
    __tablename__ = "recommandation_qualite"

    id = Column(Integer, primary_key=True)
    titre = Column(String)
    description = Column(Text)
    categorie = Column(String)
    priorite = Column(String)
    impact = Column(Float)
    statut = Column(String)

    rapportId = Column(Integer, ForeignKey("rapport_qa.id"))

    # Relations
    rapport = relationship("RapportQA", back_populates="recommandations_qualite")
