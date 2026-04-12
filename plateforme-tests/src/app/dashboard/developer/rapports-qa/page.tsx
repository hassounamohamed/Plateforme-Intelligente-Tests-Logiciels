"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectSelectorCard } from "@/components/dashboard/ProjectSelectorCard";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { Project } from "@/types";
import CahierTestsManager from "@/features/cahier-tests/CahierTestsManager";

export default function DeveloperRapportsQAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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

    const projectIdParam = searchParams.get("projectId");
    const projectId = Number(projectIdParam);
    const project = !Number.isNaN(projectId)
      ? projects.find((p) => p.id === projectId) ?? null
      : null;
    setSelectedProject(project);
  }, [projects, searchParams]);

  const navigateToProject = (projectName: string) => {
    router.push(`${ROUTES.DEVELOPER}/rapports-qa?project=${encodeURIComponent(projectName)}`);
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

  const sidebarLinks = [
    { href: ROUTES.DEVELOPER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.DEVELOPER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.DEVELOPER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.DEVELOPER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.DEVELOPER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  if (loading) {
    return (
      <DashboardLayout
        sidebarContent={<Sidebar title="Developer" subtitle="Agile & QA Platform" icon="code" links={sidebarLinks} />}
        headerContent={<DashboardHeader title="Rapports QA" subtitle="Consultation des rapports QA" />}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarContent={<Sidebar title="Developer" subtitle="Agile & QA Platform" icon="code" links={sidebarLinks} />}
      headerContent={<DashboardHeader title="Rapports QA" subtitle={selectedProject?.nom || "Selectionnez un projet"} />}
    >
      <div className="max-w-350 mx-auto">
        <ProjectSelectorCard
          projects={projects}
          selectedProjectId={selectedProject?.id ?? null}
          selectedProjectName={selectedProject?.nom ?? null}
          onSelectProject={(projectId) => {
            const selected = projects.find((p) => p.id === projectId);
            if (selected) navigateToProject(selected.nom);
          }}
        />

        {selectedProject ? (
          <CahierTestsManager
            projectId={selectedProject.id}
            projectName={selectedProject.nom}
            rapportOnly
            rapportReadOnly
            canGenerate={false}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
