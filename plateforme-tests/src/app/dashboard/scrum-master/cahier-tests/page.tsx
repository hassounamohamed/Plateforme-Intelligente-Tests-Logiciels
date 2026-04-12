"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectSelectorCard } from "@/components/dashboard/ProjectSelectorCard";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { Project } from "@/types";
import CahierTestsManager from "@/features/cahier-tests/CahierTestsManager";

export default function CahierTestsScrumMasterPage() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    { href: ROUTES.SCRUM_MASTER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SCRUM_MASTER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.SCRUM_MASTER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.SCRUM_MASTER}/user-stories`, icon: "description", label: "User Stories" },
    { href: `${ROUTES.SCRUM_MASTER}/team`, icon: "groups", label: "Équipe" },
    { href: `${ROUTES.SCRUM_MASTER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.SCRUM_MASTER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.SCRUM_MASTER}/profile`, icon: "account_circle", label: "Mon Profil" },
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
      title="Scrum Master"
      subtitle="Agile & QA Platform"
      icon="manage_accounts"
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
        {projects.length > 0 && (
          <ProjectSelectorCard
            projects={projects.map((project) => ({ id: project.id, nom: project.nom }))}
            selectedProjectId={selectedProject?.id ?? null}
            selectedProjectName={selectedProject?.nom ?? null}
            onSelectProject={(projectId) => {
              const project = projects.find((project) => project.id === projectId) ?? null;
              setSelectedProject(project);
            }}
            badgeText="Consultation du cahier de tests"
            title="Projet"
            description="Sélectionnez un projet pour consulter son cahier de tests."
            placeholder="-- Sélectionnez un projet --"
          />
        )}

        {selectedProject ? (
          <CahierTestsManager
            projectId={selectedProject.id}
            projectName={selectedProject.nom}
            readOnly
            canGenerate={false}
            canAssignMember
            showRapportPanel={false}
          />
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
              <p className="text-[#9dabb9] text-sm">
                Utilisez le sélecteur de projet ci-dessus pour afficher le contenu.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
