"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getUserStoryById } from "@/features/userstories/api";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getModules } from "@/features/modules/api";
import { getEpics } from "@/features/epics/api";
import { UserStory, Module, Epic } from "@/types";

export default function UserStoryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userStoryId = Number(params.id);
  
  // Lire les query params depuis l'URL
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  const [userStory, setUserStory] = useState<UserStory | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [epicId, setEpicId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extraire les query params côté client
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);

  useEffect(() => {
    if (searchParams !== null) {
      loadData();
    }
  }, [userStoryId, searchParams]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Essayer d'utiliser les query params s'ils existent
      const projectIdFromParams = searchParams?.get('projectId');
      const moduleIdFromParams = searchParams?.get('moduleId');
      const epicIdFromParams = searchParams?.get('epicId');

      if (projectIdFromParams && moduleIdFromParams && epicIdFromParams) {
        // Utiliser les paramètres fournis pour charger directement
        const pid = Number(projectIdFromParams);
        const mid = Number(moduleIdFromParams);
        const eid = Number(epicIdFromParams);
        
        setProjectId(pid);
        setModuleId(mid);
        setEpicId(eid);

        const userStoryData = await getUserStoryById(pid, mid, eid, userStoryId);
        setUserStory(userStoryData);
        return;
      }

      // Sinon, chercher dans tous les projets (ancien comportement)
      const projectsData = await getMyProjectsAsMember();
      if (projectsData.length === 0) {
        setError("Aucun projet trouvé");
        return;
      }

      // Chercher d'abord dans le premier projet, puis dans les autres si nécessaire
      for (const project of projectsData) {
        try {
          const modules = await getModules(project.id);
          
          for (const module of modules) {
            try {
              const epics = await getEpics(project.id, module.id);
              
              for (const epic of epics) {
                try {
                  const userStoryData = await getUserStoryById(project.id, module.id, epic.id, userStoryId);
                  // If successful, we found the user story
                  setUserStory(userStoryData);
                  setProjectId(project.id);
                  setModuleId(module.id);
                  setEpicId(epic.id);
                  return;
                } catch (err) {
                  // Continue searching in other epics
                  continue;
                }
              }
            } catch (err) {
              // Continue searching in other modules
              continue;
            }
          }
        } catch (err) {
          // Continue searching in other projects
          continue;
        }
      }
      
      // If we reach here, user story was not found
      setError("User story introuvable");
    } catch (error: any) {
      console.error("Erreur chargement user story:", error);
      setError(error.response?.data?.detail || "Impossible de charger la user story");
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
    { href: `${ROUTES.SCRUM_MASTER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.SCRUM_MASTER}/profile`, icon: "account_circle", label: "Mon Profil" },
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
        return "bg-red-500/20 text-red-400";
      case "should_have":
        return "bg-yellow-500/20 text-yellow-400";
      case "could_have":
        return "bg-primary/20 text-primary";
      case "wont_have":
      default:
        return "bg-[#9dabb9]/20 text-[#9dabb9]";
    }
  };

  const getPriorityLabel = (priorite: string) => {
    switch (priorite) {
      case "must_have":
        return "Must Have";
      case "should_have":
        return "Should Have";
      case "could_have":
        return "Could Have";
      case "wont_have":
      default:
        return "Won't Have";
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

  if (error || !userStory) {
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
            <p className="text-red-300 text-sm">{error || "User story introuvable"}</p>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/user-stories`}
              className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
            >
              Retour aux user stories
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
          title={userStory.titre}
          subtitle="Détails de la User Story"
          actions={
            projectId && moduleId && epicId && (
              <Link
                href={`${ROUTES.SCRUM_MASTER}/user-stories/${userStoryId}/edit?project=${projectId}&module=${moduleId}&epic=${epicId}`}
                className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span>Modifier</span>
              </Link>
            )
          }
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Info principale */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Référence</p>
            <p className="text-white text-lg font-mono font-bold">
              {userStory.reference || "Non définie"}
            </p>
          </div>

          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Statut</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                userStory.statut || "to_do"
              )}`}
            >
              {getStatusLabel(userStory.statut || "to_do")}
            </span>
          </div>

          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Points d'Effort</p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">speed</span>
              <p className="text-white text-2xl font-bold">
                {userStory.points !== null && userStory.points !== undefined 
                  ? userStory.points 
                  : "-"}
              </p>
            </div>
          </div>

          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Durée Estimée</p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">schedule</span>
              <p className="text-white text-2xl font-bold">
                {userStory.duree_estimee !== null && userStory.duree_estimee !== undefined 
                  ? `${userStory.duree_estimee}h` 
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Priorité */}
        {userStory.priorite && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Priorité</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getPriorityColor(userStory.priorite)}`}>
              {getPriorityLabel(userStory.priorite)}
            </span>
          </div>
        )}

        {/* Description */}
        {userStory.description && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Description</p>
            <p className="text-white text-sm whitespace-pre-wrap">{userStory.description}</p>
          </div>
        )}

        {/* Critères d'acceptation */}
        {userStory.criteresAcceptation && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Critères d'acceptation</p>
            <p className="text-white text-sm whitespace-pre-wrap">{userStory.criteresAcceptation}</p>
          </div>
        )}

        {/* Sprint assigné */}
        {userStory.sprint && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Sprint</p>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/sprints/${userStory.sprint.id}`}
              className="text-primary hover:underline font-medium"
            >
              {userStory.sprint.nom}
            </Link>
          </div>
        )}

        {/* Développeur assigné */}
        {userStory.developer && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Développeur assigné</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div>
                <p className="text-white font-medium">{userStory.developer.nom} {userStory.developer.nom}</p>
                <p className="text-[#9dabb9] text-sm">{userStory.developer.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Retour</span>
          </button>
          <Link
            href={`${ROUTES.SCRUM_MASTER}/user-stories`}
            className="text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">list</span>
            <span>Toutes les user stories</span>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
