"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getSprints } from "@/features/sprints/api";
import { Project } from "@/types";
import CahierTestsManager from "@/features/cahier-tests/CahierTestsManager";
import type { Sprint } from "@/types";

export default function CahierTestsDeveloperPage() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    { href: ROUTES.DEVELOPER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.DEVELOPER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.DEVELOPER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.DEVELOPER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.DEVELOPER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projects.length === 0) return;

    const projectNameParam = searchParams.get("project");
    if (projectNameParam) {
      const decodedName = decodeURIComponent(projectNameParam);
      const byName = projects.find((p) => p.nom === decodedName) ?? null;
      setSelectedProject(byName);
      return;
    }

    // Backward compatibility with old URL format (?projectId=...)
    const projectIdParam = searchParams.get("projectId");
    const projectId = Number(projectIdParam);
    const project = !Number.isNaN(projectId)
      ? projects.find((p) => p.id === projectId) ?? null
      : null;
    setSelectedProject(project);
  }, [projects, searchParams]);

  useEffect(() => {
    if (!selectedProject) {
      setSprints([]);
      return;
    }

    let isMounted = true;

    const loadSprints = async () => {
      setSprintsLoading(true);
      try {
        const data = await getSprints(selectedProject.id);
        if (isMounted) {
          setSprints(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des sprints:", error);
        if (isMounted) {
          setSprints([]);
        }
      } finally {
        if (isMounted) {
          setSprintsLoading(false);
        }
      }
    };

    loadSprints();

    return () => {
      isMounted = false;
    };
  }, [selectedProject]);

  const openProjectInNewTab = (projectName: string) => {
    window.open(
      `${ROUTES.DEVELOPER}/cahier-tests?project=${encodeURIComponent(projectName)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const loadProjects = async () => {
    try {
      const data = await getMyProjectsAsMember();
      setProjects(data);
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarContent = (
    <Sidebar
      title="Developer"
      subtitle="Agile & QA Platform"
      icon="code"
      links={sidebarLinks}
    />
  );

  const headerContent = (
    <DashboardHeader
      title="Cahier de Tests"
      subtitle={selectedProject?.nom || "Consultation des tests du projet"}
    />
  );

  if (loading) {
    return (
      <DashboardLayout sidebarContent={sidebarContent} headerContent={headerContent}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <DashboardLayout sidebarContent={sidebarContent} headerContent={headerContent}>
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
          <div className="text-[#9dabb9] mb-4">
            <span className="material-symbols-outlined text-6xl">folder_open</span>
          </div>
          <h3 className="text-white text-lg font-bold mb-2">Aucun projet assigné</h3>
          <p className="text-[#9dabb9]">Vous n&apos;êtes membre d&apos;aucun projet pour le moment.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarContent={sidebarContent} headerContent={headerContent}>
      <div className="max-w-350 mx-auto">
        {selectedProject ? (
          <div className="space-y-6">
            <CahierTestsManager
              projectId={selectedProject.id}
              projectName={selectedProject.nom}
              canGenerate={false}
              rapportReadOnly
              showRapportPanel={false}
            />

            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white text-lg font-bold">User Stories</h3>
                  <p className="text-[#9dabb9] text-sm">
                    Vue lecture seule des user stories associées aux sprints du projet.
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide text-[#9dabb9]">
                  {sprintsLoading ? "Chargement..." : `${sprints.length} sprint(s)`}
                </span>
              </div>

              {sprintsLoading ? (
                <div className="flex items-center justify-center py-10 text-[#9dabb9]">
                  Chargement des user stories...
                </div>
              ) : sprints.some((sprint) => sprint.userstories && sprint.userstories.length > 0) ? (
                <div className="space-y-4">
                  {sprints.map((sprint) => {
                    const stories = sprint.userstories ?? [];

                    if (stories.length === 0) {
                      return null;
                    }

                    return (
                      <div
                        key={sprint.id}
                        className="rounded-lg border border-[#3b4754] bg-[#1e293b] p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-white font-semibold">{sprint.nom}</h4>
                            <p className="text-[#9dabb9] text-sm">{stories.length} user story(s)</p>
                          </div>
                          <span className="text-xs text-[#9dabb9] uppercase tracking-wide">
                            {sprint.statut}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {stories.map((story) => (
                            <div
                              key={story.id}
                              className="flex items-center justify-between gap-4 rounded-md border border-[#3b4754] bg-surface-dark px-4 py-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {story.reference && (
                                    <span className="text-xs font-mono text-[#9dabb9] bg-[#283039] px-2 py-0.5 rounded">
                                      {story.reference}
                                    </span>
                                  )}
                                  <p className="text-white font-medium truncate">{story.titre}</p>
                                </div>
                                <p className="text-[#9dabb9] text-sm mt-1">
                                  Statut: {story.statut || "n/a"}
                                  {story.developerNom ? ` · Dév: ${story.developerNom}` : ""}
                                </p>
                              </div>

                              {story.points != null && (
                                <span className="shrink-0 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                                  {story.points} pts
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#3b4754] p-6 text-center text-[#9dabb9]">
                  Aucune user story trouvée pour ce projet.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="text-[#9dabb9] mb-6">
                <span className="material-symbols-outlined text-8xl">menu_book</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-3">
                Sélectionnez un projet
              </h3>
              <p className="text-[#9dabb9] text-base mb-8">
                Choisissez le projet pour lequel vous souhaitez consulter le cahier de tests.
              </p>
              <div className="space-y-4">
                <label className="block text-left text-sm font-medium text-white mb-2">
                  Projet
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value !== "") {
                      const projectId = parseInt(value, 10);
                      const selected = projects.find((p) => p.id === projectId);
                      if (selected) openProjectInNewTab(selected.nom);
                    }
                  }}
                  className="w-full h-12 px-4 bg-[#283039] border border-[#3b4754] text-white text-base rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">-- Sélectionnez un projet --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.nom}
                    </option>
                  ))}
                </select>
                <p className="text-[#9dabb9] text-sm text-left mt-2">
                  {projects.length} projet{projects.length > 1 ? "s" : ""} disponible{projects.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
