"use client";

import { useState, useEffect } from "react";
import { Test, CahierTests, Project } from "@/types";
import { getMyProjects } from "@/features/projects/api";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";

export default function ValidationTestsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [cahiers, setCahiers] = useState<CahierTests[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("tous");
  const [isLoading, setIsLoading] = useState(true);

  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
    { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
    { href: `${ROUTES.PRODUCT_OWNER}/ai-backlog`, icon: "smart_toy", label: "AI Backlog" },
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
      loadCahiersTests(selectedProject);
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

  const loadCahiersTests = async (projectId: number) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const data = await getCahiersTestsByProject(projectId);

      // Mock data
      const mockCahiers: CahierTests[] = [
        {
          id: 1,
          dateGeneration: "2026-02-20T10:00:00",
          statut: "valide",
          nombreTests: 15,
          userstory_id: 1,
          userstory_titre: "Authentification utilisateur",
          tests: [
            {
              id: 1,
              nom: "Test connexion valide",
              description: "Vérifier la connexion avec des identifiants valides",
              type: "unitaire",
              statut: "reussi",
              derniere_execution: {
                id: 1,
                dateExecution: "2026-02-20T14:30:00",
                statut: "reussi",
                duree: 125,
                testId: 1,
              },
            },
            {
              id: 2,
              nom: "Test connexion invalide",
              description: "Vérifier le rejet des identifiants invalides",
              type: "unitaire",
              statut: "reussi",
              derniere_execution: {
                id: 2,
                dateExecution: "2026-02-20T14:31:00",
                statut: "reussi",
                duree: 98,
                testId: 2,
              },
            },
          ],
        },
        {
          id: 2,
          dateGeneration: "2026-02-22T09:00:00",
          statut: "en_attente",
          nombreTests: 12,
          userstory_id: 4,
          userstory_titre: "Gestion des projets",
          tests: [
            {
              id: 3,
              nom: "Test création projet",
              description: "Vérifier la création d'un nouveau projet",
              type: "integration",
              statut: "reussi",
              derniere_execution: {
                id: 3,
                dateExecution: "2026-02-22T11:00:00",
                statut: "reussi",
                duree: 543,
                testId: 3,
              },
            },
            {
              id: 4,
              nom: "Test modification projet",
              description: "Vérifier la modification des données projet",
              type: "integration",
              statut: "echoue",
              derniere_execution: {
                id: 4,
                dateExecution: "2026-02-22T11:05:00",
                statut: "echoue",
                duree: 231,
                erreurs: "Erreur de validation des dates",
                testId: 4,
              },
            },
          ],
        },
        {
          id: 3,
          dateGeneration: "2026-02-25T16:00:00",
          statut: "rejete",
          nombreTests: 8,
          userstory_id: 5,
          userstory_titre: "Gestion des modules",
          tests: [
            {
              id: 5,
              nom: "Test ajout module",
              description: "Vérifier l'ajout d'un module au projet",
              type: "e2e",
              statut: "echoue",
              derniere_execution: {
                id: 5,
                dateExecution: "2026-02-25T17:30:00",
                statut: "echoue",
                duree: 1234,
                erreurs: "Timeout lors du chargement de la page",
                testId: 5,
              },
            },
          ],
        },
      ];

      setCahiers(mockCahiers);
    } catch (error) {
      console.error("Failed to load cahiers tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = (cahierId: number, valid: boolean) => {
    // TODO: API call to validate
    console.log(`Validation cahier ${cahierId}: ${valid ? "Validé" : "Rejeté"}`);
    setCahiers((prev) =>
      prev.map((c) =>
        c.id === cahierId ? { ...c, statut: valid ? "valide" : "rejete" } : c
      )
    );
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "valide":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "en_attente":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "rejete":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTestStatusColor = (statut: string) => {
    switch (statut) {
      case "reussi":
        return "text-green-400";
      case "echoue":
        return "text-red-400";
      case "en_cours":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const getTestStatusIcon = (statut: string) => {
    switch (statut) {
      case "reussi":
        return "check_circle";
      case "echoue":
        return "cancel";
      case "en_cours":
        return "pending";
      default:
        return "radio_button_unchecked";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredCahiers = cahiers.filter((cahier) => {
    if (selectedFilter === "tous") return true;
    return cahier.statut === selectedFilter;
  });

  const stats = {
    total: cahiers.length,
    valides: cahiers.filter((c) => c.statut === "valide").length,
    enAttente: cahiers.filter((c) => c.statut === "en_attente").length,
    rejetes: cahiers.filter((c) => c.statut === "rejete").length,
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
          title="Validation des Tests"
          subtitle="Validation des livrables et des résultats de tests par user story"
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Cahiers</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="text-sm text-green-300 mb-1">Validés</div>
          <div className="text-2xl font-bold text-green-400">{stats.valides}</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-sm text-yellow-300 mb-1">En Attente</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.enAttente}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="text-sm text-red-300 mb-1">Rejetés</div>
          <div className="text-2xl font-bold text-red-400">{stats.rejetes}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Projet
          </label>
          <select
            value={selectedProject || ""}
            onChange={(e) => setSelectedProject(Number(e.target.value))}
            className="w-full bg-surface-dark border border-[#3b4754] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Statut
          </label>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="w-full bg-surface-dark border border-[#3b4754] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="tous">Tous</option>
            <option value="en_attente">En Attente</option>
            <option value="valide">Validés</option>
            <option value="rejete">Rejetés</option>
          </select>
        </div>
      </div>

      {/* Cahiers List */}
      {isLoading ? (
        <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : filteredCahiers.length === 0 ? (
        <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-gray-600">
            assignment_turned_in
          </span>
          <p className="text-gray-400 mt-4">Aucun cahier de tests trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCahiers.map((cahier) => (
            <div
              key={cahier.id}
              className="bg-surface-dark border border-[#3b4754] rounded-lg p-6"
            >
              {/* Cahier Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#3b4754]">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">
                      {cahier.userstory_titre}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatutColor(
                        cahier.statut
                      )}`}
                    >
                      {cahier.statut === "en_attente"
                        ? "En Attente"
                        : cahier.statut === "valide"
                        ? "Validé"
                        : "Rejeté"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      <span className="material-symbols-outlined text-xs align-middle mr-1">
                        calendar_today
                      </span>
                      {formatDate(cahier.dateGeneration)}
                    </span>
                    <span>
                      <span className="material-symbols-outlined text-xs align-middle mr-1">
                        assignment
                      </span>
                      {cahier.nombreTests} tests
                    </span>
                  </div>
                </div>

                {/* Validation Actions */}
                {cahier.statut === "en_attente" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleValidate(cahier.id, true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Valider
                    </button>
                    <button
                      onClick={() => handleValidate(cahier.id, false)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Rejeter
                    </button>
                  </div>
                )}
              </div>

              {/* Tests List */}
              {cahier.tests && cahier.tests.length > 0 && (
                <div className="space-y-2">
                  {cahier.tests.map((test) => (
                    <div
                      key={test.id}
                      className="bg-surface-dark rounded-lg p-4 flex items-start gap-4"
                    >
                      <span
                        className={`material-symbols-outlined ${getTestStatusColor(
                          test.statut
                        )}`}
                      >
                        {getTestStatusIcon(test.statut)}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-white">{test.nom}</h4>
                          <span className="text-xs text-gray-400 bg-[#283039] px-2 py-1 rounded">
                            {test.type}
                          </span>
                        </div>
                        {test.description && (
                          <p className="text-sm text-gray-400 mb-2">
                            {test.description}
                          </p>
                        )}
                        {test.derniere_execution && (
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Exécuté le {formatDate(test.derniere_execution.dateExecution)}
                            </span>
                            {test.derniere_execution.duree && (
                              <span>Durée: {test.derniere_execution.duree}ms</span>
                            )}
                          </div>
                        )}
                        {test.derniere_execution?.erreurs && (
                          <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded p-2 text-xs text-red-300">
                            <span className="font-semibold">Erreur: </span>
                            {test.derniere_execution.erreurs}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-400 text-xl">info</span>
        <div className="flex-1 text-sm text-blue-300">
          <strong>Note:</strong> Les données affichées sont actuellement des exemples.
          Les endpoints API pour la validation des tests seront bientôt disponibles.
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
