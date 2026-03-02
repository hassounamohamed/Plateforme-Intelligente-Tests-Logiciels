"use client";

import { useState, useEffect } from "react";
import { RapportQA, Project } from "@/types";
import { getMyProjects } from "@/features/projects/api";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";

export default function RapportsQAPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [rapports, setRapports] = useState<RapportQA[]>([]);
  const [selectedRapport, setSelectedRapport] = useState<RapportQA | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
    { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
    { href: `${ROUTES.PRODUCT_OWNER}/validation-tests`, icon: "check_circle", label: "Validation Tests" },
    { href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "map", label: "Roadmap" },
    { href: `${ROUTES.PRODUCT_OWNER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadRapports(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const projectsData = await getMyProjects();
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRapports = async (projectId: number) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const data = await getRapportsQAByProject(projectId);

      // Mock data
      const mockRapports: RapportQA[] = [
        {
          id: 1,
          dateGeneration: "2026-02-27T18:00:00",
          statut: "valide",
          tauxReussite: 94.2,
          nombreTestsExecutes: 156,
          nombreTestsReussis: 147,
          nombreTestsEchoues: 9,
          recommandations: "Améliorer la couverture des tests d'intégration",
          sprintId: 2,
          sprint: {
            nom: "Sprint 2 - Core Features",
            dateDebut: "2026-02-16T00:00:00",
            dateFin: "2026-03-01T00:00:00",
          },
          indicateurs: {
            id: 1,
            tauxCouverture: 87.5,
            tauxReussite: 94.2,
            nombreAnomalies: 12,
            nombreAnomaliesCritiques: 2,
            indiceQualite: 8.7,
            tendance: "croissante",
            rapportId: 1,
          },
          recommandations_qualite: [
            {
              id: 1,
              titre: "Augmenter la couverture des tests unitaires",
              description:
                "Certains modules critiques ont une couverture inférieure à 80%",
              categorie: "Tests",
              priorite: "haute",
              impact: 8,
              statut: "en_cours",
              rapportId: 1,
            },
            {
              id: 2,
              titre: "Optimiser les performances des tests E2E",
              description: "Réduire le temps d'exécution des tests end-to-end",
              categorie: "Performance",
              priorite: "moyenne",
              impact: 6,
              statut: "en_attente",
              rapportId: 1,
            },
            {
              id: 3,
              titre: "Corriger les anomalies critiques",
              description:
                "2 anomalies critiques doivent être résolues avant le déploiement",
              categorie: "Bugs",
              priorite: "haute",
              impact: 9,
              statut: "en_cours",
              rapportId: 1,
            },
          ],
        },
        {
          id: 2,
          dateGeneration: "2026-02-15T18:00:00",
          statut: "valide",
          tauxReussite: 92.5,
          nombreTestsExecutes: 120,
          nombreTestsReussis: 111,
          nombreTestsEchoues: 9,
          recommandations: "Bonne qualité globale, attention aux tests E2E",
          sprintId: 1,
          sprint: {
            nom: "Sprint 1 - Foundation",
            dateDebut: "2026-02-01T00:00:00",
            dateFin: "2026-02-15T00:00:00",
          },
          indicateurs: {
            id: 2,
            tauxCouverture: 82.3,
            tauxReussite: 92.5,
            nombreAnomalies: 15,
            nombreAnomaliesCritiques: 3,
            indiceQualite: 8.2,
            tendance: "stable",
            rapportId: 2,
          },
          recommandations_qualite: [
            {
              id: 4,
              titre: "Documentation des tests",
              description: "Améliorer la documentation des cas de test complexes",
              categorie: "Documentation",
              priorite: "basse",
              impact: 4,
              statut: "en_attente",
              rapportId: 2,
            },
          ],
        },
      ];

      setRapports(mockRapports);
      if (mockRapports.length > 0) {
        setSelectedRapport(mockRapports[0]);
      }
    } catch (error) {
      console.error("Failed to load rapports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTendanceColor = (tendance: string) => {
    switch (tendance) {
      case "croissante":
        return "text-green-400";
      case "decroissante":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  const getTendanceIcon = (tendance: string) => {
    switch (tendance) {
      case "croissante":
        return "trending_up";
      case "decroissante":
        return "trending_down";
      default:
        return "trending_flat";
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case "haute":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "moyenne":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "basse":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "appliquee":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "en_cours":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "en_attente":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "rejetee":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getQualityColor = (score: number) => {
    if (score >= 9) return "text-green-400";
    if (score >= 7) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Product Owner"
          subtitle="Agile & QA Platform"
          icon="account_tree"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Rapports QA"
          subtitle="Accès aux rapports de qualité globaux et recommandations d'amélioration"
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
      {/* Project Selector */}
      <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Sélectionner un projet
        </label>
        <select
          value={selectedProject || ""}
          onChange={(e) => setSelectedProject(Number(e.target.value))}
          className="w-full md:w-96 bg-surface-dark border border-[#3b4754] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.nom}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Chargement des rapports...</p>
        </div>
      ) : rapports.length === 0 ? (
        <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-gray-600">
            assessment
          </span>
          <p className="text-gray-400 mt-4">Aucun rapport QA disponible</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rapports List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold text-white mb-3">
              Rapports Disponibles
            </h2>
            {rapports.map((rapport) => (
              <div
                key={rapport.id}
                onClick={() => setSelectedRapport(rapport)}
                className={`bg-surface-dark border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedRapport?.id === rapport.id
                    ? "border-blue-500 bg-blue-500/5"
                    : "border-[#3b4754] hover:border-blue-500/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {rapport.sprint?.nom || `Rapport #${rapport.id}`}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {formatDate(rapport.dateGeneration)}
                    </p>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      rapport.tauxReussite >= 90
                        ? "text-green-400"
                        : rapport.tauxReussite >= 75
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {rapport.tauxReussite}%
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{rapport.nombreTestsExecutes} tests</span>
                  <span>•</span>
                  <span className="text-green-400">
                    {rapport.nombreTestsReussis} ✓
                  </span>
                  <span className="text-red-400">
                    {rapport.nombreTestsEchoues} ✗
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Rapport Details */}
          {selectedRapport && (
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  {selectedRapport.sprint?.nom || `Rapport #${selectedRapport.id}`}
                </h2>
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-surface-dark rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">Taux Réussite</div>
                    <div className="text-2xl font-bold text-green-400">
                      {selectedRapport.tauxReussite}%
                    </div>
                  </div>
                  <div className="bg-surface-dark rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">Tests Exécutés</div>
                    <div className="text-2xl font-bold text-white">
                      {selectedRapport.nombreTestsExecutes}
                    </div>
                  </div>
                  <div className="bg-surface-dark rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">Réussis</div>
                    <div className="text-2xl font-bold text-green-400">
                      {selectedRapport.nombreTestsReussis}
                    </div>
                  </div>
                  <div className="bg-surface-dark rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">Échoués</div>
                    <div className="text-2xl font-bold text-red-400">
                      {selectedRapport.nombreTestsEchoues}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {selectedRapport.recommandations && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400">
                        lightbulb
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-400 mb-1">
                          Recommandations Générales
                        </h4>
                        <p className="text-sm text-blue-300">
                          {selectedRapport.recommandations}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Indicateurs de Qualité */}
              {selectedRapport.indicateurs && (
                <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">analytics</span>
                    Indicateurs de Qualité
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-surface-dark rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-2">Couverture Tests</div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {selectedRapport.indicateurs.tauxCouverture}%
                      </div>
                      <div className="w-full bg-[#283039] rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${selectedRapport.indicateurs.tauxCouverture}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-surface-dark rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-2">Indice Qualité</div>
                      <div
                        className={`text-2xl font-bold mb-1 ${getQualityColor(
                          selectedRapport.indicateurs.indiceQualite
                        )}`}
                      >
                        {selectedRapport.indicateurs.indiceQualite}/10
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span
                          className={getTendanceColor(
                            selectedRapport.indicateurs.tendance
                          )}
                        >
                          <span className="material-symbols-outlined text-sm align-middle">
                            {getTendanceIcon(selectedRapport.indicateurs.tendance)}
                          </span>
                          {selectedRapport.indicateurs.tendance}
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface-dark rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-2">Anomalies</div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {selectedRapport.indicateurs.nombreAnomalies}
                      </div>
                      <div className="text-xs text-red-400">
                        {selectedRapport.indicateurs.nombreAnomaliesCritiques} critiques
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommandations Détaillées */}
              {selectedRapport.recommandations_qualite &&
                selectedRapport.recommandations_qualite.length > 0 && (
                  <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined">rule</span>
                      Recommandations Détaillées
                    </h3>

                    <div className="space-y-3">
                      {selectedRapport.recommandations_qualite.map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-surface-dark rounded-lg p-4 border-l-4 border-blue-500"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-white flex-1">
                              {rec.titre}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded border ${getPrioriteColor(
                                  rec.priorite
                                )}`}
                              >
                                {rec.priorite}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded border ${getStatutColor(
                                  rec.statut
                                )}`}
                              >
                                {rec.statut.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                          {rec.description && (
                            <p className="text-sm text-gray-400 mb-2">
                              {rec.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="bg-[#283039] px-2 py-1 rounded">
                              {rec.categorie}
                            </span>
                            <span>Impact: {rec.impact}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-400 text-xl">info</span>
        <div className="flex-1 text-sm text-blue-300">
          <strong>Note:</strong> Les données affichées sont actuellement des exemples.
          Les endpoints API pour les rapports QA seront bientôt disponibles dans le
          backend.
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
