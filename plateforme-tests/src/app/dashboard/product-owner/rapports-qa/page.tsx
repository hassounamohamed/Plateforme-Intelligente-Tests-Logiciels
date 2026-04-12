"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Project } from "@/types";
import { getMyProjects } from "@/features/projects/api";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectSelectorCard } from "@/components/dashboard/ProjectSelectorCard";
import { ROUTES } from "@/lib/constants";
import CahierTestsManager from "@/features/cahier-tests/CahierTestsManager";

export default function RapportsQAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
    { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
    { href: `${ROUTES.PRODUCT_OWNER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "map", label: "Roadmap" },
    { href: `${ROUTES.PRODUCT_OWNER}/profile`, icon: "account_circle", label: "Mon Profil" },
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

    const projectIdParam = searchParams.get("projectId");
    const projectId = Number(projectIdParam);
    const project = !Number.isNaN(projectId)
      ? projects.find((p) => p.id === projectId) ?? null
      : null;
    setSelectedProject(project);
  }, [projects, searchParams]);

  const navigateToProject = (projectName: string) => {
    router.push(`${ROUTES.PRODUCT_OWNER}/rapports-qa?project=${encodeURIComponent(projectName)}`);
  };

  const loadProjects = async () => {
    try {
      const projectsData = await getMyProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        headerContent={<DashboardHeader title="Rapports QA" subtitle="Consultation des rapports QA" />}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (projects.length === 0) {
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
        headerContent={<DashboardHeader title="Rapports QA" subtitle="Consultation des rapports QA" />}
      >
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-8 text-center">
          <div className="text-slate-500 dark:text-[#9dabb9] mb-4">
            <span className="material-symbols-outlined text-6xl">folder_open</span>
          </div>
          <h3 className="text-white text-lg font-bold mb-2">Aucun projet trouve</h3>
          <p className="text-slate-500 dark:text-[#9dabb9]">Vous n'avez aucun projet pour le moment.</p>
        </div>
      </DashboardLayout>
    );
  }

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
          subtitle={selectedProject?.nom || "Selectionnez un projet"}
        />
      }
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
