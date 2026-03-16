"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { Project } from "@/types";
import CahierTestsManager from "@/features/cahier-tests/CahierTestsManager";

export default function CahierTestsDeveloperPage() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    { href: ROUTES.DEVELOPER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.DEVELOPER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.DEVELOPER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.DEVELOPER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projects.length === 0) return;

    const projectIdParam = searchParams.get("projectId");
    if (!projectIdParam) {
      setSelectedProject(null);
      return;
    }

    const projectId = Number(projectIdParam);
    if (Number.isNaN(projectId)) {
      setSelectedProject(null);
      return;
    }

    const project = projects.find((p) => p.id === projectId) ?? null;
    setSelectedProject(project);
  }, [projects, searchParams]);

  const openProjectInNewTab = (projectId: number) => {
    window.open(`${ROUTES.DEVELOPER}/cahier-tests?projectId=${projectId}`, "_blank", "noopener,noreferrer");
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
          <CahierTestsManager projectId={selectedProject.id} canGenerate={false} />
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
                      openProjectInNewTab(parseInt(value, 10));
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
