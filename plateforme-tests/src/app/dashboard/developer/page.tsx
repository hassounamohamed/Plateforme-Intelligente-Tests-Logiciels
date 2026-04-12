"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getBacklog } from "@/features/backlog/api";
import { getSprints } from "@/features/sprints/api";
import { getMeApi } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import {
  listMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifications/api";
import { getCahier, getCasTestHistory, listCasTests } from "@/features/cahier-tests/api";
import type { NotificationItem, NotificationType } from "@/types";

type TaskStatus = "to_do" | "in_progress" | "done";

interface DeveloperTask {
  key: string;
  id: number;
  title: string;
  status: TaskStatus;
  priority: string;
  projectName: string;
  sprintName?: string;
}

interface RecentChange {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  icon: "menu_book" | "calendar_month";
}

const STATUS_ORDER: Record<TaskStatus, number> = {
  in_progress: 0,
  to_do: 1,
  done: 2,
};

const PRIORITY_ORDER: Record<string, number> = {
  must_have: 0,
  should_have: 1,
  could_have: 2,
  wont_have: 3,
};

const toTaskStatus = (value: string | undefined): TaskStatus => {
  if (value === "in_progress" || value === "done") {
    return value;
  }
  return "to_do";
};

const getPriorityStyle = (priority: string): string => {
  switch (priority) {
    case "must_have":
      return "bg-red-500/20 text-red-400";
    case "should_have":
      return "bg-orange-500/20 text-orange-400";
    case "could_have":
      return "bg-yellow-500/20 text-yellow-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
};

const formatPriorityLabel = (priority: string): string => {
  switch (priority) {
    case "must_have":
      return "Must Have";
    case "should_have":
      return "Should Have";
    case "could_have":
      return "Could Have";
    case "wont_have":
      return "Won't Have";
    default:
      return "N/A";
  }
};

const formatStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return "To Do";
  }
};

const timeAgo = (isoDate: string): string => {
  const timestamp = new Date(isoDate).getTime();
  if (!Number.isFinite(timestamp)) {
    return "date inconnue";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays} j`;
};

const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case "TEST_FAILED":
      return "cancel";
    case "TEST_PASSED":
      return "check_circle";
    case "TEST_EXECUTED":
      return "play_arrow";
    case "BUG_DETECTED":
      return "bug_report";
    case "USER_STORY_ASSIGNED_TO_ME":
      return "assignment_ind";
    case "SPRINT_STARTED":
      return "play_circle";
    case "SPRINT_COMPLETED":
      return "checkered_flag";
    case "PROJECT_CREATED":
      return "rocket_launch";
    default:
      return "notifications";
  }
};

export default function DeveloperDashboard() {
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<DeveloperTask[]>([]);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [activeSprintsCount, setActiveSprintsCount] = useState(0);

  const sidebarLinks = [
    { href: ROUTES.DEVELOPER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.DEVELOPER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.DEVELOPER}/user-stories`, icon: "article", label: "User Stories" },
    { href: `${ROUTES.DEVELOPER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.DEVELOPER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.DEVELOPER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setNotifications([]);
      setNotificationsLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [currentUser, projects, myNotifications] = await Promise.all([
          getMeApi(),
          getMyProjectsAsMember(),
          listMyNotifications(false, 8),
        ]);

        setNotifications(myNotifications);
        setNotificationsLoading(false);

        const projectResults = await Promise.all(
          projects.map(async (project) => {
            const projectTasks: DeveloperTask[] = [];
            const projectChanges: RecentChange[] = [];
            let projectActiveSprints = 0;

            const [backlogItems, sprints] = await Promise.all([
              getBacklog(project.id, { tri: "priorite" }),
              getSprints(project.id),
            ]);

            backlogItems.forEach((item) => {
              if (item.developerId !== currentUser.id) return;

              projectTasks.push({
                key: `backlog-${project.id}-${item.id}`,
                id: item.id,
                title: item.titre,
                status: toTaskStatus(item.statut),
                priority: String(item.priorite || "wont_have"),
                projectName: project.nom,
              });
            });

            sprints.forEach((sprint) => {
              if (sprint.statut === "en_cours") {
                projectActiveSprints += 1;
              }

              if (sprint.dateDebut) {
                projectChanges.push({
                  id: `sprint-start-${project.id}-${sprint.id}`,
                  title: `Sprint démarré: ${sprint.nom}`,
                  subtitle: project.nom,
                  time: sprint.dateDebut,
                  icon: "calendar_month",
                });
              }

              if (sprint.dateFin && sprint.statut === "termine") {
                projectChanges.push({
                  id: `sprint-end-${project.id}-${sprint.id}`,
                  title: `Sprint clôturé: ${sprint.nom}`,
                  subtitle: project.nom,
                  time: sprint.dateFin,
                  icon: "calendar_month",
                });
              }

              (sprint.userstories || []).forEach((story) => {
                if (story.developerId !== currentUser.id) return;

                projectTasks.push({
                  key: `sprint-${project.id}-${story.id}`,
                  id: story.id,
                  title: story.titre,
                  status: toTaskStatus(story.statut),
                  priority: String(story.priorite || "wont_have"),
                  projectName: project.nom,
                  sprintName: sprint.nom,
                });
              });
            });

            try {
              const cahier = await getCahier(project.id);
              const casTests = await listCasTests(project.id, cahier.id);

              const latestCases = [...casTests]
                .sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime())
                .slice(0, 4);

              const historyGroups = await Promise.all(
                latestCases.map(async (cas) => {
                  try {
                    const history = await getCasTestHistory(project.id, cahier.id, cas.id);
                    return history.slice(0, 1).map((entry) => ({
                      id: `cas-history-${project.id}-${cas.id}-${entry.id}`,
                      title: `Cas de test modifié: ${cas.test_ref}`,
                      subtitle: `${project.nom} · ${cas.test_case}`,
                      time: entry.changed_at,
                      icon: "menu_book" as const,
                    }));
                  } catch {
                    return [] as RecentChange[];
                  }
                })
              );

              historyGroups.forEach((history) => {
                projectChanges.push(...history);
              });
            } catch {
              // Some projects do not have a cahier yet.
            }

            return {
              tasks: projectTasks,
              changes: projectChanges,
              activeSprints: projectActiveSprints,
            };
          })
        );

        const dedupedTaskMap = new Map<string, DeveloperTask>();
        projectResults.forEach((result) => {
          result.tasks.forEach((task) => {
            if (!dedupedTaskMap.has(task.key)) {
              dedupedTaskMap.set(task.key, task);
            }
          });
        });

        const sortedTasks = [...dedupedTaskMap.values()].sort((a, b) => {
          const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          if (statusDiff !== 0) return statusDiff;

          const aPriority = PRIORITY_ORDER[a.priority] ?? 99;
          const bPriority = PRIORITY_ORDER[b.priority] ?? 99;
          return aPriority - bPriority;
        });

        const allChanges = projectResults
          .flatMap((result) => result.changes)
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 8);

        const totalActiveSprints = projectResults.reduce(
          (total, result) => total + result.activeSprints,
          0
        );

        setTasks(sortedTasks);
        setRecentChanges(allChanges);
        setActiveSprintsCount(totalActiveSprints);
      } catch (err) {
        console.error("Erreur de chargement du dashboard développeur:", err);
        setError("Impossible de charger le dashboard développeur.");
        setNotificationsLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setNotificationsLoading(false);
      return;
    }

    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const items = await listMyNotifications(false, 8);
        if (!isMounted) return;
        setNotifications(items);
      } catch {
        if (!isMounted) return;
        setNotifications([]);
      } finally {
        if (isMounted) setNotificationsLoading(false);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleMarkNotificationAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      const items = await listMyNotifications(false, 8);
      setNotifications(items);
    } catch {
      // Silent fail in card UI.
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      const items = await listMyNotifications(false, 8);
      setNotifications(items);
    } catch {
      // Silent fail in card UI.
    }
  };

  const stats = useMemo(() => {
    const activeTasks = tasks.filter((task) => task.status !== "done").length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    const done = tasks.filter((task) => task.status === "done").length;

    return {
      activeTasks,
      inProgress,
      done,
      activeSprints: activeSprintsCount,
    };
  }, [tasks, activeSprintsCount]);

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Developer"
          subtitle="Agile & QA Platform"
          icon="code"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Developer Dashboard"
          subtitle="Track your tasks, commits, and test coverage."
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-400 text-xl">error</span>
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-1">Erreur</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Tasks"
            value={loading ? "..." : stats.activeTasks}
            icon="task_alt"
            trend={{ value: String(stats.inProgress), isPositive: true, label: "in progress" }}
          />
          <StatCard
            title="In Progress"
            value={loading ? "..." : stats.inProgress}
            icon="progress_activity"
            trend={{ value: String(stats.activeTasks), isPositive: true, label: "assigned" }}
          />
          <StatCard
            title="Completed"
            value={loading ? "..." : stats.done}
            icon="verified"
            trend={{ value: String(tasks.length), isPositive: true, label: "total tasks" }}
          />
          <StatCard
            title="Active Sprints"
            value={loading ? "..." : stats.activeSprints}
            icon="calendar_month"
            status={{ text: stats.activeSprints > 0 ? "running" : "none", color: stats.activeSprints > 0 ? "green" : "red" }}
          />
        </div>

        {/* My Tasks */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-bold">My Assigned Tasks</h3>
            <Link className="text-primary text-sm font-bold hover:underline" href={`${ROUTES.DEVELOPER}/sprints`}>
              View Sprints
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-5xl text-[#9dabb9]">assignment</span>
              <p className="text-[#9dabb9] mt-3">Aucune tâche assignée pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 8).map((task) => (
              <div
                key={task.key}
                className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">{task.title}</h4>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${getPriorityStyle(task.priority)}`}
                  >
                    {formatPriorityLabel(task.priority)}
                  </span>
                </div>
                <p className="text-[#9dabb9] text-sm mt-2">
                  {formatStatusLabel(task.status)} · {task.projectName}
                  {task.sprintName ? ` · ${task.sprintName}` : ""}
                </p>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Recent Changes</h3>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : recentChanges.length === 0 ? (
              <div className="text-center py-8 text-[#9dabb9]">Aucun changement récent.</div>
            ) : (
              <div className="space-y-3">
                {recentChanges.map((change) => (
                <div key={change.id} className="flex items-start gap-3 p-3 bg-[#283039] rounded-lg">
                  <span className="material-symbols-outlined text-primary text-[20px]">{change.icon}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{change.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#9dabb9] text-xs">{change.subtitle}</span>
                      <span className="text-[#9dabb9] text-xs">•</span>
                      <span className="text-[#9dabb9] text-xs">{timeAgo(change.time)}</span>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold">My Notifications</h3>
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-primary text-xs font-bold hover:underline"
              >
                Tout lire
              </button>
            </div>
            {notificationsLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-[#9dabb9]">Aucune notification.</div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleMarkNotificationAsRead(notification.id)}
                  className="w-full text-left flex items-start gap-3 p-3 bg-[#283039] rounded-lg hover:border-primary/50 border border-transparent transition-colors"
                >
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-medium truncate">{notification.titre}</p>
                      {!notification.lue && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#9dabb9] text-xs line-clamp-1">{notification.message}</span>
                      <span className="text-[#9dabb9] text-xs">•</span>
                      <span className="text-xs font-bold text-blue-400">{timeAgo(notification.dateEnvoi)}</span>
                    </div>
                  </div>
                </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
