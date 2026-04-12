"use client";

import { useState, useEffect } from "react";
import { Project } from "@/types";
import { getMyProjects } from "@/features/projects/api";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectSelectorCard } from "@/components/dashboard/ProjectSelectorCard";
import { ROUTES } from "@/lib/constants";
import CahierTestsManager from "@/features/cahier-tests/CahierTestsManager";

export default function ValidationTestsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
    { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
    { href: `${ROUTES.PRODUCT_OWNER}/validation-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "map", label: "Roadmap" },
    { href: `${ROUTES.PRODUCT_OWNER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getMyProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarContent = (
    <Sidebar
      title="Product Owner"
      subtitle="Agile & QA Platform"
      icon="account_tree"
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
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-8 text-center">
          <div className="text-slate-500 dark:text-[#9dabb9] mb-4">
            <span className="material-symbols-outlined text-6xl">folder_open</span>
          </div>
          <h3 className="text-white text-lg font-bold mb-2">Aucun projet trouvé</h3>
          <p className="text-slate-500 dark:text-[#9dabb9]">Vous n&apos;avez aucun projet pour le moment.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarContent={sidebarContent} headerContent={headerContent}>
      <div className="max-w-350 mx-auto">
        <ProjectSelectorCard
          projects={projects}
          selectedProjectId={selectedProject?.id ?? null}
          selectedProjectName={selectedProject?.nom ?? null}
          onSelectProject={(projectId) => {
            const selected = projects.find((p) => p.id === projectId) ?? null;
            setSelectedProject(selected);
          }}
          badgeText="Validation des tests"
          description="Selectionnez un projet pour consulter son cahier de tests et ses validations." 
        />

        {selectedProject ? (
          <CahierTestsManager projectId={selectedProject.id} readOnly showRapportPanel={false} />
        ) : (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="text-slate-500 dark:text-[#9dabb9] mb-6">
                <span className="material-symbols-outlined text-8xl">menu_book</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-3">
                Sélectionnez un projet
              </h3>
              <p className="text-slate-500 dark:text-[#9dabb9] text-base mb-8">
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
                      const project = projects.find((p) => p.id === parseInt(value));
                      setSelectedProject(project || null);
                    }
                  }}
                  className="w-full h-12 px-4 bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] text-white text-base rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">-- Sélectionnez un projet --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.nom}
                    </option>
                  ))}
                </select>
                <p className="text-slate-500 dark:text-[#9dabb9] text-sm text-left mt-2">
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
