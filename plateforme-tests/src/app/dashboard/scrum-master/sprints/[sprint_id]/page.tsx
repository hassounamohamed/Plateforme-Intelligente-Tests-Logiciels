"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getSprintById, getSprintVelocite } from "@/features/sprints/api";
import { Sprint, SprintVelocite } from "@/types";

export default function SprintDetailsPage() {
  const params = useParams();
  const sprintId = Number(params.sprint_id);
  
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [velocite, setVelocite] = useState<SprintVelocite | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [sprintId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get the first project (in real app, you'd get the project ID from context)
      const projectsData = await getMyProjectsAsMember();
      if (projectsData.length === 0) {
        setError("Aucun projet trouvé");
        return;
      }
      
      const pid = projectsData[0].id;
      setProjectId(pid);

      // Load sprint details
      const sprintData = await getSprintById(pid, sprintId);
      setSprint(sprintData);

      // Load velocite
      try {
        const velociteData = await getSprintVelocite(pid, sprintId);
        setVelocite(velociteData);
      } catch (err) {
        console.warn("Impossible de charger la vélocité");
      }
    } catch (error: any) {
      console.error("Erreur chargement sprint:", error);
      setError(error.response?.data?.detail || "Impossible de charger les détails du sprint");
    } finally {
      setIsLoading(false);
    }
  };

  const sidebarLinks = [
    { href: ROUTES.SCRUM_MASTER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SCRUM_MASTER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.SCRUM_MASTER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.SCRUM_MASTER}/user-stories`, icon: "description", label: "User Stories" },
    { href: `${ROUTES.SCRUM_MASTER}/team`, icon: "groups", label: "Équipe" },
  ];

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "done":
        return "bg-[#0bda5b]/20 text-[#0bda5b]";
      case "in_progress":
        return "bg-primary/20 text-primary";
      case "to_do":
      default:
        return "bg-[#9dabb9]/20 text-[#9dabb9]";
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "done":
        return "Terminée";
      case "in_progress":
        return "En cours";
      case "to_do":
      default:
        return "À faire";
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case "must_have":
        return "text-red-400";
      case "should_have":
        return "text-yellow-400";
      case "could_have":
        return "text-primary";
      case "wont_have":
      default:
        return "text-[#9dabb9]";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        sidebarContent={
          <Sidebar
            title="Scrum Master"
            subtitle="Agile & QA Platform"
            icon="groups"
            links={sidebarLinks}
          />
        }
        headerContent={<DashboardHeader title="Chargement..." subtitle="" />}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !sprint) {
    return (
      <DashboardLayout
        sidebarContent={
          <Sidebar
            title="Scrum Master"
            subtitle="Agile & QA Platform"
            icon="groups"
            links={sidebarLinks}
          />
        }
        headerContent={<DashboardHeader title="Erreur" subtitle="" />}
      >
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-400 text-xl">error</span>
          <div className="flex-1">
            <h3 className="text-red-400 font-semibold mb-1">Erreur</h3>
            <p className="text-red-300 text-sm">{error || "Sprint introuvable"}</p>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/sprints`}
              className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
            >
              Retour aux sprints
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Scrum Master"
          subtitle="Agile & QA Platform"
          icon="groups"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title={sprint.nom}
          subtitle="Détails du sprint"
          actions={
            <Link
              href={`${ROUTES.SCRUM_MASTER}/sprints/${sprintId}/edit`}
              className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Modifier</span>
            </Link>
          }
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Sprint Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Statut</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                sprint.statut === "en_cours"
                  ? "bg-primary/20 text-primary"
                  : sprint.statut === "termine"
                  ? "bg-[#0bda5b]/20 text-[#0bda5b]"
                  : "bg-[#9dabb9]/20 text-[#9dabb9]"
              }`}
            >
              {sprint.statut === "en_cours"
                ? "En cours"
                : sprint.statut === "termine"
                ? "Terminé"
                : "Planifié"}
            </span>
          </div>

          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Période</p>
            <p className="text-white text-sm">
              {sprint.dateDebut
                ? new Date(sprint.dateDebut).toLocaleDateString("fr-FR")
                : "Non défini"}{" "}
              -{" "}
              {sprint.dateFin
                ? new Date(sprint.dateFin).toLocaleDateString("fr-FR")
                : "Non défini"}
            </p>
          </div>

          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Capacité</p>
            <p className="text-white text-lg font-bold">
              {sprint.capaciteEquipe || "Non défini"} points
            </p>
          </div>
        </div>

        {/* Objectif */}
        {sprint.objectifSprint && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Objectif du Sprint</p>
            <p className="text-white text-sm">{sprint.objectifSprint}</p>
          </div>
        )}

        {/* Vélocité */}
        {velocite && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Métriques du Sprint</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Vélocité</p>
                <p className="text-white text-2xl font-bold">{velocite.velocite}</p>
              </div>
              <div>
                <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Points Total</p>
                <p className="text-white text-2xl font-bold">{velocite.points_total}</p>
              </div>
              <div>
                <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Points Terminés</p>
                <p className="text-[#0bda5b] text-2xl font-bold">{velocite.points_termines}</p>
              </div>
              <div>
                <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">US Terminées</p>
                <p className="text-white text-2xl font-bold">
                  {velocite.nb_terminees} / {velocite.nb_userstories}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Stories */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <h3 className="text-white text-lg font-bold mb-4">
            User Stories ({sprint.userstories?.length || 0})
          </h3>
          {!sprint.userstories || sprint.userstories.length === 0 ? (
            <p className="text-[#9dabb9] text-sm text-center py-4">
              Aucune user story dans ce sprint
            </p>
          ) : (
            <div className="space-y-3">
              {sprint.userstories.map((us) => (
                <div
                  key={us.id}
                  className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm mb-2">{us.titre}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(us.statut || "to_do")}`}>
                          {getStatusLabel(us.statut || "to_do")}
                        </span>
                        {us.priorite && (
                          <span className={`text-xs font-bold ${getPriorityColor(us.priorite)}`}>
                            {us.priorite.replace("_", " ").toUpperCase()}
                          </span>
                        )}
                        {us.points !== null && us.points !== undefined && (
                          <span className="text-[#9dabb9] text-xs">{us.points} pts</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <Link
          href={`${ROUTES.SCRUM_MASTER}/sprints`}
          className="text-primary hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Retour aux sprints</span>
        </Link>
      </div>
    </DashboardLayout>
  );
}
