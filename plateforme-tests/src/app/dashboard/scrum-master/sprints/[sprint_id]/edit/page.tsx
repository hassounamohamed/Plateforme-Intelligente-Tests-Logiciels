"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getSprintById, updateSprint } from "@/features/sprints/api";
import { getUserStories } from "@/features/userstories/api";
import { getModules } from "@/features/modules/api";
import { getEpics } from "@/features/epics/api";
import { Project, Module, Epic, UserStory, Sprint } from "@/types";

export default function EditSprintPage() {
  const router = useRouter();
  const params = useParams();
  const sprintId = Number(params.sprint_id);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [availableStories, setAvailableStories] = useState<UserStory[]>([]);
  const [selectedStories, setSelectedStories] = useState<number[]>([]);

  // Form fields
  const [nom, setNom] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [objectifSprint, setObjectifSprint] = useState("");
  const [capaciteEquipe, setCapaciteEquipe] = useState<number>(0);
  const [dureeJours, setDureeJours] = useState<number>(14);
  const [statut, setStatut] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dureesSprint = [7, 10, 14, 21, 30];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject && sprintId) {
      loadSprintData(selectedProject, sprintId);
      loadProjectData(selectedProject);
    }
  }, [selectedProject, sprintId]);

  useEffect(() => {
    // Auto-calculate dureeJours based on dates
    if (dateDebut && dateFin) {
      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);
      const diffTime = Math.abs(fin.getTime() - debut.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDureeJours(diffDays);
    }
  }, [dateDebut, dateFin]);

  const loadProjects = async () => {
    try {
      const projectsData = await getMyProjectsAsMember();
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (error: any) {
      console.error("Erreur chargement projets:", error);
      setError("Impossible de charger les projets");
    }
  };

  const loadSprintData = async (projectId: number, sprintId: number) => {
    setIsLoading(true);
    try {
      const sprintData = await getSprintById(projectId, sprintId);
      
      // Populate form fields with existing data
      setNom(sprintData.nom);
      setDateDebut(sprintData.dateDebut || "");
      setDateFin(sprintData.dateFin || "");
      setObjectifSprint(sprintData.objectifSprint || "");
      setCapaciteEquipe(sprintData.capaciteEquipe || 0);
      setStatut(sprintData.statut);

      // Calculate duration
      if (sprintData.dateDebut && sprintData.dateFin) {
        const debut = new Date(sprintData.dateDebut);
        const fin = new Date(sprintData.dateFin);
        const diffTime = Math.abs(fin.getTime() - debut.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDureeJours(diffDays);
      }

    } catch (error: any) {
      console.error("Erreur chargement sprint:", error);
      setError("Impossible de charger le sprint");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectData = async (projectId: number) => {
    try {
      // Load modules
      const modulesData = await getModules(projectId);
      setModules(modulesData);

      // Load all epics from all modules
      const allEpics: Epic[] = [];
      const allStories: UserStory[] = [];

      for (const module of modulesData) {
        const epicsData = await getEpics(projectId, module.id);
        allEpics.push(...epicsData);

        // Load user stories from each epic
        for (const epic of epicsData) {
          try {
            const storiesData = await getUserStories(projectId, module.id, epic.id);
            allStories.push(...storiesData);
          } catch (err) {
            console.warn("Erreur chargement stories pour epic:", epic.id);
          }
        }
      }

      setEpics(allEpics);
      setAvailableStories(allStories);
    } catch (error: any) {
      console.error("Erreur chargement données projet:", error);
    }
  };

  const handleToggleStory = (storyId: number) => {
    setSelectedStories((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  const handleDateDebutChange = (newDateDebut: string) => {
    setDateDebut(newDateDebut);
    // Auto-calculate dateFin based on dureeJours
    if (newDateDebut && dureeJours) {
      const debut = new Date(newDateDebut);
      const fin = new Date(debut);
      fin.setDate(debut.getDate() + dureeJours);
      setDateFin(fin.toISOString().split("T")[0]);
    }
  };

  const handleDureeChange = (newDuree: number) => {
    setDureeJours(newDuree);
    // Auto-calculate dateFin based on dateDebut
    if (dateDebut) {
      const debut = new Date(dateDebut);
      const fin = new Date(debut);
      fin.setDate(debut.getDate() + newDuree);
      setDateFin(fin.toISOString().split("T")[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      setError("Veuillez sélectionner un projet");
      return;
    }

    if (!nom.trim()) {
      setError("Veuillez saisir un nom de sprint");
      return;
    }

    if (!dateDebut || !dateFin) {
      setError("Veuillez définir les dates de début et fin");
      return;
    }

    if (new Date(dateFin) <= new Date(dateDebut)) {
      setError("La date de fin doit être après la date de début");
      return;
    }

    if (capaciteEquipe <= 0) {
      setError("La capacité de l'équipe doit être supérieure à 0");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateSprint(selectedProject, sprintId, {
        nom: nom.trim(),
        dateDebut,
        dateFin,
        objectifSprint: objectifSprint.trim() || undefined,
        capaciteEquipe,
      });

      router.push(`${ROUTES.SCRUM_MASTER}/sprints/${sprintId}`);
    } catch (error: any) {
      console.error("Erreur modification sprint:", error);
      setError(error.response?.data?.detail || "Erreur lors de la modification du sprint");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPointsSelected = availableStories
    .filter((s) => selectedStories.includes(s.id))
    .reduce((sum, s) => sum + (s.points || 0), 0);

  const sidebarLinks = [
    { href: ROUTES.SCRUM_MASTER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SCRUM_MASTER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.SCRUM_MASTER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.SCRUM_MASTER}/user-stories`, icon: "description", label: "User Stories" },
    { href: `${ROUTES.SCRUM_MASTER}/team`, icon: "groups", label: "Équipe" },
  ];

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
        headerContent={
          <DashboardHeader
            title="Éditer Sprint"
            subtitle="Modification d'un sprint existant"
          />
        }
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          title="Éditer Sprint"
          subtitle={`Modification du ${nom}`}
        />
      }
    >
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-400 text-xl">error</span>
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold mb-1">Erreur</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">info</span>
              <div>
                <p className="text-white text-sm">
                  Statut actuel: <span className="font-bold">{statut}</span>
                </p>
                {statut !== "planifie" && (
                  <p className="text-[#9dabb9] text-xs mt-1">
                    ⚠️ Certaines modifications peuvent être limitées pour un sprint en cours ou terminé
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Project Selection */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Projet</h3>
            {projects.length > 0 ? (
              <select
                id="project-select"
                name="project"
                value={selectedProject || ""}
                onChange={(e) => setSelectedProject(Number(e.target.value))}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                required
                disabled={statut !== "planifie"}
              >
                <option value="">Sélectionner un projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nom}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-red-400 text-sm">Aucun projet disponible</p>
            )}
          </div>

          {/* Sprint Details */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 space-y-4">
            <h3 className="text-white text-lg font-bold mb-4">Informations du Sprint</h3>

            {/* Sprint Name */}
            <div>
              <label htmlFor="sprint-name" className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Nom du Sprint <span className="text-red-400">*</span>
              </label>
              <input
                id="sprint-name"
                name="nom"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="ex: Sprint 1, Sprint Planning Q1"
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white placeholder-[#9dabb9]/50 focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Sprint Goal */}
            <div>
              <label htmlFor="sprint-goal" className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Objectif du Sprint
              </label>
              <textarea
                id="sprint-goal"
                name="objectifSprint"
                value={objectifSprint}
                onChange={(e) => setObjectifSprint(e.target.value)}
                placeholder="Quel est l'objectif principal de ce sprint ?"
                rows={3}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white placeholder-[#9dabb9]/50 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Sprint Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                  Durée du Sprint (jours) <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {dureesSprint.map((duree) => (
                    <button
                      key={duree}
                      type="button"
                      onClick={() => handleDureeChange(duree)}
                      disabled={statut !== "planifie"}
                      className={`py-2 rounded-lg text-sm font-bold transition-all ${
                        dureeJours === duree
                          ? "bg-primary text-white"
                          : "bg-[#283039] text-[#9dabb9] hover:bg-[#3b4754]"
                      } ${statut !== "planifie" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {duree}j
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="team-capacity" className="text-[#9dabb9] text-sm font-bold mb-2 block">
                  Capacité de l'Équipe (story points) <span className="text-red-400">*</span>
                </label>
                <input
                  id="team-capacity"
                  name="capaciteEquipe"
                  type="number"
                  value={capaciteEquipe || ""}
                  onChange={(e) => setCapaciteEquipe(Number(e.target.value))}
                  placeholder="ex: 50"
                  min="1"
                  className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white placeholder-[#9dabb9]/50 focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date-debut" className="text-[#9dabb9] text-sm font-bold mb-2 block">
                  Date de Début <span className="text-red-400">*</span>
                </label>
                <input
                  id="date-debut"
                  name="dateDebut"
                  type="date"
                  value={dateDebut}
                  onChange={(e) => handleDateDebutChange(e.target.value)}
                  className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                  required
                  disabled={statut !== "planifie"}
                />
              </div>

              <div>
                <label htmlFor="date-fin" className="text-[#9dabb9] text-sm font-bold mb-2 block">
                  Date de Fin <span className="text-red-400">*</span>
                </label>
                <input
                  id="date-fin"
                  name="dateFin"
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>
          </div>

          {/* User Stories Selection */}
          {availableStories.length > 0 && (
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-bold">User Stories du Sprint</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[#9dabb9]">
                    {selectedStories.length} stories sélectionnées
                  </span>
                  <span
                    className={`font-bold ${
                      totalPointsSelected > capaciteEquipe
                        ? "text-red-400"
                        : "text-[#0bda5b]"
                    }`}
                  >
                    {totalPointsSelected} / {capaciteEquipe} points
                  </span>
                </div>
              </div>

              {totalPointsSelected > capaciteEquipe && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">
                    ⚠️ Attention : Le total des points dépasse la capacité de l'équipe
                  </p>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => handleToggleStory(story.id)}
                    className={`bg-[#283039] border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedStories.includes(story.id)
                        ? "border-primary bg-primary/10"
                        : "border-[#3b4754] hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStories.includes(story.id)}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm mb-1">{story.titre}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-bold">
                            {story.priorite}
                          </span>
                          {story.points && (
                            <span className="px-2 py-0.5 bg-[#9dabb9]/20 text-[#9dabb9] rounded text-xs font-bold">
                              {story.points} pts
                            </span>
                          )}
                          <span className="text-[#9dabb9] text-xs">
                            Epic #{story.epic_id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Link
              href={`${ROUTES.SCRUM_MASTER}/sprints/${sprintId}`}
              className="px-6 py-2.5 bg-[#283039] border border-[#3b4754] text-white text-sm font-bold rounded-lg hover:bg-[#3b4754] transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
