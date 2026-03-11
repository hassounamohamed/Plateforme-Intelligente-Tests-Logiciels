"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { Project } from "@/types";
import CahierTestsManager from "@/features/cahier-tests/CahierTestsManager";

export default function CahierTestsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getMyProjectsAsMember();
      setProjects(data);
      // Ne pas sélectionner automatiquement un projet
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarLinks = [
    { href: ROUTES.QA, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.QA}/cahier-tests`, icon: "science", label: "Cahier de Tests" },
    { href: `${ROUTES.QA}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.QA}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  if (loading) {
    return (
      <DashboardLayout
        sidebarContent={
          <Sidebar
            title="Testeur QA"
            subtitle="Agile & QA Platform"
            icon="science"
            links={sidebarLinks}
          />
        }
        headerContent={
          <DashboardHeader
            title="Cahier de Tests"
            subtitle="Gestion des tests et scénarios"
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
            subtitle="Agile & QA Platform"
            icon="science"
            links={sidebarLinks}
          />
        }
        headerContent={
          <DashboardHeader
            title="Cahier de Tests"
            subtitle="Gestion des tests et scénarios"
          />
        }
      >
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
          <div className="text-[#9dabb9] mb-4">
            <span className="material-symbols-outlined text-6xl">folder_open</span>
          </div>
          <h3 className="text-white text-lg font-bold mb-2">
            Aucun projet assigné
          </h3>
          <p className="text-[#9dabb9]">
            Vous n'êtes membre d'aucun projet pour le moment.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Testeur QA"
          subtitle="Agile & QA Platform"
          icon="science"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Cahier de Tests"
          subtitle={selectedProject?.nom || "Gestion des tests"}
        />
      }
    >
      <div className="max-w-350 mx-auto">
        {selectedProject ? (
          <CahierTestsManager projectId={selectedProject.id} />
        ) : (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="text-[#9dabb9] mb-6">
                <span className="material-symbols-outlined text-8xl">folder_open</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-3">
                Sélectionnez un projet
              </h3>
              <p className="text-[#9dabb9] text-base mb-8">
                Choisissez le projet pour lequel vous souhaitez accéder au cahier de tests.
              </p>
              
              {/* Zone de sélection du projet */}
              <div className="space-y-4">
                <label className="block text-left text-sm font-medium text-white mb-2">
                  Projet
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value !== "") {
                      const project = projects.find(
                        (p) => p.id === parseInt(value)
                      );
                      setSelectedProject(project || null);
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
                
                {/* Info supplémentaire */}
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
