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

export default function QARapportsPage() {
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
    router.push(`${ROUTES.QA}/rapports-qa?project=${encodeURIComponent(projectName)}`);
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
    { href: ROUTES.QA, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.QA}/cahier-tests`, icon: "science", label: "Cahier de Tests" },
    { href: `${ROUTES.QA}/anomalies`, icon: "bug_report", label: "Anomalies" },
    { href: `${ROUTES.QA}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.QA}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.QA}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  if (loading) {
    return (
      <DashboardLayout
        sidebarContent={
          <Sidebar
            title="Testeur QA"
            subtitle="FlowPilot Platform"
            icon="science"
            links={sidebarLinks}
          />
        }
        headerContent={
          <DashboardHeader
            title="Rapports QA"
            subtitle="Generation, edition et export des rapports QA"
          />
        }
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
            title="Testeur QA"
            subtitle="FlowPilot Platform"
            icon="science"
            links={sidebarLinks}
          />
        }
        headerContent={
          <DashboardHeader
            title="Rapports QA"
            subtitle="Generation, edition et export des rapports QA"
          />
        }
      >
        <div className="rounded-xl border border-border bg-surface-dark p-8 text-center">
          <div className="mb-4 text-muted-foreground">
            <span className="material-symbols-outlined text-6xl">folder_open</span>
          </div>
          <h3 className="mb-2 text-lg font-bold text-foreground">Aucun projet assigne</h3>
          <p className="text-muted-foreground">Vous n'etes membre d'aucun projet pour le moment.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Testeur QA"
          subtitle="FlowPilot Platform"
          icon="science"
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
          />
        ) : (
          <div className="rounded-xl border border-border bg-surface-dark p-12">
            <div className="mx-auto max-w-md text-center">
              <div className="mb-6 text-muted-foreground">
                <span className="material-symbols-outlined text-8xl">assessment</span>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Selectionnez un projet</h3>
              <p className="text-base text-muted-foreground">
                Choisissez le projet pour lequel vous souhaitez consulter le rapport QA.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
