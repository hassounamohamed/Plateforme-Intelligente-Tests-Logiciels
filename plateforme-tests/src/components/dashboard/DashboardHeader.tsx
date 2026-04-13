"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeModeToggle } from "@/components/theme/ThemeModeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/features/auth/store";
import {
  getUnreadNotificationsCount,
  listMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifications/api";
import { ROLES, ROUTES } from "@/lib/constants";
import { NotificationItem, NotificationType } from "@/types";

type DashboardRole = (typeof ROLES)[keyof typeof ROLES];

interface DashboardSearchItem {
  title: string;
  href: string;
  description: string;
  keywords: string[];
  roles: DashboardRole[];
}

const DASHBOARD_SEARCH_ITEMS: DashboardSearchItem[] = [
  {
    title: "Dashboard super admin",
    href: ROUTES.SUPER_ADMIN,
    description: "Vue d'ensemble du super administrateur",
    keywords: ["admin", "super admin", "dashboard"],
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    title: "Utilisateurs",
    href: `${ROUTES.SUPER_ADMIN}/users`,
    description: "Gestion des comptes utilisateurs",
    keywords: ["users", "comptes", "membres"],
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    title: "Rôles",
    href: `${ROUTES.SUPER_ADMIN}/roles`,
    description: "Gestion des rôles et permissions",
    keywords: ["permissions", "acces", "rbac"],
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    title: "Logs",
    href: `${ROUTES.SUPER_ADMIN}/logs`,
    description: "Journaux système et audit",
    keywords: ["journal", "audit", "traces"],
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    title: "Paramètres",
    href: `${ROUTES.SUPER_ADMIN}/settings`,
    description: "Configuration de la plateforme",
    keywords: ["settings", "configuration"],
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    title: "Profil super admin",
    href: `${ROUTES.SUPER_ADMIN}/profile`,
    description: "Profil du super administrateur",
    keywords: ["profil", "compte"],
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    title: "Dashboard product owner",
    href: ROUTES.PRODUCT_OWNER,
    description: "Vue d'ensemble du product owner",
    keywords: ["po", "product owner", "dashboard"],
    roles: [ROLES.PRODUCT_OWNER],
  },
  {
    title: "Projets",
    href: `${ROUTES.PRODUCT_OWNER}/projects`,
    description: "Gestion des projets",
    keywords: ["project", "projet"],
    roles: [ROLES.PRODUCT_OWNER],
  },
  {
    title: "Backlog produit",
    href: `${ROUTES.PRODUCT_OWNER}/backlog`,
    description: "Backlog et priorisation",
    keywords: ["stories", "priorites", "besoins"],
    roles: [ROLES.PRODUCT_OWNER],
  },
  {
    title: "Epics",
    href: `${ROUTES.PRODUCT_OWNER}/epics`,
    description: "Gestion des epics",
    keywords: ["epic", "epiques"],
    roles: [ROLES.PRODUCT_OWNER],
  },
  {
    title: "Sprints product owner",
    href: `${ROUTES.PRODUCT_OWNER}/sprints`,
    description: "Suivi des sprints",
    keywords: ["sprint", "iterations"],
    roles: [ROLES.PRODUCT_OWNER],
  },
  {
    title: "Backlog IA",
    href: `${ROUTES.PRODUCT_OWNER}/ai-backlog`,
    description: "Generation assistee du backlog",
    keywords: ["ia", "ai", "generation"],
    roles: [ROLES.PRODUCT_OWNER],
  },
  {
    title: "Validation des tests",
    href: `${ROUTES.PRODUCT_OWNER}/cahier-tests`,
    description: "Validation fonctionnelle des tests",
    keywords: ["tests", "validation", "qa"],
    roles: [ROLES.PRODUCT_OWNER],
  },
  {
    title: "Rapports QA",
    href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`,
    description: "Rapports qualite et couverture",
    keywords: ["rapport", "qa", "qualite"],
    roles: [ROLES.PRODUCT_OWNER],
  },
  {
    title: "Roadmap",
    href: `${ROUTES.PRODUCT_OWNER}/roadmap`,
    description: "Vision produit et planning",
    keywords: ["roadmap", "planning", "plan"],
    roles: [ROLES.PRODUCT_OWNER],
  },
  {
    title: "Profil product owner",
    href: `${ROUTES.PRODUCT_OWNER}/profile`,
    description: "Profil du product owner",
    keywords: ["profil", "compte"],
    roles: [ROLES.PRODUCT_OWNER],
  },
  {
    title: "Dashboard scrum master",
    href: ROUTES.SCRUM_MASTER,
    description: "Vue d'ensemble du scrum master",
    keywords: ["scrum", "dashboard"],
    roles: [ROLES.SCRUM_MASTER],
  },
  {
    title: "Equipe",
    href: `${ROUTES.SCRUM_MASTER}/team`,
    description: "Gestion de l'equipe",
    keywords: ["team", "membres", "equipe"],
    roles: [ROLES.SCRUM_MASTER],
  },
  {
    title: "Backlog scrum master",
    href: `${ROUTES.SCRUM_MASTER}/backlog`,
    description: "Backlog de l'equipe",
    keywords: ["backlog", "stories"],
    roles: [ROLES.SCRUM_MASTER],
  },
  {
    title: "User stories",
    href: `${ROUTES.SCRUM_MASTER}/user-stories`,
    description: "Gestion des user stories",
    keywords: ["stories", "user stories", "besoins"],
    roles: [ROLES.SCRUM_MASTER],
  },
  {
    title: "Sprints scrum master",
    href: `${ROUTES.SCRUM_MASTER}/sprints`,
    description: "Pilotage des sprints",
    keywords: ["sprint", "planning", "iterations"],
    roles: [ROLES.SCRUM_MASTER],
  },
  {
    title: "Cahier de tests scrum master",
    href: `${ROUTES.SCRUM_MASTER}/cahier-tests`,
    description: "Consultation du cahier de tests",
    keywords: ["tests", "cahier", "qa"],
    roles: [ROLES.SCRUM_MASTER],
  },
  {
    title: "Profil scrum master",
    href: `${ROUTES.SCRUM_MASTER}/profile`,
    description: "Profil du scrum master",
    keywords: ["profil", "compte"],
    roles: [ROLES.SCRUM_MASTER],
  },
  {
    title: "Dashboard QA",
    href: ROUTES.QA,
    description: "Vue d'ensemble du testeur QA",
    keywords: ["qa", "testeur", "dashboard"],
    roles: [ROLES.TESTEUR_QA],
  },
  {
    title: "Cahier de tests QA",
    href: `${ROUTES.QA}/cahier-tests`,
    description: "Execution et suivi des cas de test",
    keywords: ["tests", "cahier", "execution"],
    roles: [ROLES.TESTEUR_QA],
  },
  {
    title: "Sprints QA",
    href: `${ROUTES.QA}/sprints`,
    description: "Sprints a tester",
    keywords: ["sprint", "iterations"],
    roles: [ROLES.TESTEUR_QA],
  },
  {
    title: "Profil QA",
    href: `${ROUTES.QA}/profile`,
    description: "Profil du testeur QA",
    keywords: ["profil", "compte"],
    roles: [ROLES.TESTEUR_QA],
  },
  {
    title: "Dashboard developpeur",
    href: ROUTES.DEVELOPER,
    description: "Vue d'ensemble du developpeur",
    keywords: ["developpeur", "dev", "dashboard"],
    roles: [ROLES.DEVELOPPEUR],
  },
  {
    title: "Cahier de tests developpeur",
    href: `${ROUTES.DEVELOPER}/cahier-tests`,
    description: "Consultation des cas de test",
    keywords: ["tests", "cahier", "debug"],
    roles: [ROLES.DEVELOPPEUR],
  },
  {
    title: "Sprints developpeur",
    href: `${ROUTES.DEVELOPER}/sprints`,
    description: "Sprints assignes",
    keywords: ["sprint", "iterations"],
    roles: [ROLES.DEVELOPPEUR],
  },
  {
    title: "Profil developpeur",
    href: `${ROUTES.DEVELOPER}/profile`,
    description: "Profil du developpeur",
    keywords: ["profil", "compte"],
    roles: [ROLES.DEVELOPPEUR],
  },
];

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "PROJECT_CREATED":
      return "rocket_launch";
    case "PROJECT_UPDATED":
      return "edit";
    case "PROJECT_ARCHIVED":
      return "archive";
    case "PROJECT_MEMBER_ADDED":
      return "group_add";
    case "ADDED_TO_PROJECT":
      return "person_add";
    case "USER_STORY_CREATED":
      return "note_add";
    case "USER_STORY_UPDATED":
      return "edit_note";
    case "USER_STORY_DELETED":
      return "delete";
    case "USER_STORY_VALIDATED":
      return "task_alt";
    case "USER_STORY_ASSIGNED_TO_ME":
      return "assignment_ind";
    case "SPRINT_CREATED":
      return "flag";
    case "TEST_FAILED":
      return "cancel";
    case "SPRINT_STARTED":
      return "play_circle";
    case "SPRINT_COMPLETED":
      return "checkered_flag";
    case "USER_STORY_ADDED_TO_SPRINT":
      return "playlist_add";
    case "USER_STORY_REMOVED_FROM_SPRINT":
      return "playlist_remove";
    case "BACKLOG_UPDATED":
      return "inventory_2";
    case "TEST_CREATED":
      return "science";
    case "TEST_ASSIGNED_TO_ME":
      return "assignment";
    case "TEST_EXECUTED":
      return "play_arrow";
    case "TEST_RESULT_VALIDATED":
      return "verified";
    case "ANOMALY_CREATED":
      return "bug_report";
    case "BUG_DETECTED":
      return "pest_control";
    case "REPORT_EXPORTED":
      return "ios_share";
    case "AI_FAILED":
      return "smart_toy";
    case "DEADLINE_NEAR":
      return "schedule";
    case "SPRINT_DELAYED":
      return "warning";
    case "NEW_ASSIGNMENT":
      return "mark_email_unread";
    case "REPORT_GENERATED":
      return "bar_chart";
    case "TEST_PASSED":
      return "check_circle";
    case "SPRINT_ENDED":
      return "checkered_flag";
    case "VALIDATION_REQUIRED":
      return "fact_check";
    case "RECOMMENDATION_AVAILABLE":
      return "tips_and_updates";
    default:
      return "notifications";
  }
}

function formatNotificationTime(isoDate: string): string {
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) {
    return "";
  }
  return dt.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const notificationsContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const currentRole = user?.role?.code as DashboardRole | undefined;
  const normalizedQuery = normalizeSearchValue(searchQuery);
  const searchItems = DASHBOARD_SEARCH_ITEMS.filter((item) => {
    if (!currentRole) {
      return true;
    }

    return item.roles.includes(currentRole);
  });

  const searchResults = normalizedQuery
    ? searchItems
        .filter((item) => {
          const searchableText = normalizeSearchValue(
            `${item.title} ${item.description} ${item.keywords.join(" ")}`
          );

          return searchableText.includes(normalizedQuery) && item.href !== pathname;
        })
        .slice(0, 6)
    : [];

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    let isMounted = true;
    const loadNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const [items, countResp] = await Promise.all([
          listMyNotifications(false, 20),
          // Count is kept separate to avoid client-side recount drift.
          getUnreadNotificationsCount(),
        ]);
        if (!isMounted) return;
        setNotifications(items);
        setUnreadCount(countResp.unread_count);
      } catch {
        if (!isMounted) return;
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        if (isMounted) setLoadingNotifications(false);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [user, isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (!notificationsContainerRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTypingContext =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTypingContext) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
      setIsSearchOpen(true);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleShortcut);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  useEffect(() => {
    setSearchQuery("");
    setIsSearchOpen(false);
  }, [pathname]);

  const navigateToSearchResult = (href: string) => {
    router.push(href);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (searchResults.length > 0) {
      navigateToSearchResult(searchResults[0].href);
    }
  };

  const refreshNotifications = async () => {
    try {
      const [items, countResp] = await Promise.all([
        listMyNotifications(false, 20),
        getUnreadNotificationsCount(),
      ]);
      setNotifications(items);
      setUnreadCount(countResp.unread_count);
    } catch {
      // Silent fail in header UI.
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      await refreshNotifications();
    } catch {
      // Silent fail in header UI.
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await refreshNotifications();
    } catch {
      // Silent fail in header UI.
    }
  };

  return (
    <header className="flex items-center justify-between border-b px-6 py-4 z-10 sticky top-0 backdrop-blur-md bg-(--background)/95 border-border">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-3" />
        <div className="flex flex-col">
          <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden sm:block relative" ref={searchContainerRef}>
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center rounded-lg h-10 px-3 w-80 focus-within:ring-2 focus-within:ring-primary/50 transition-all bg-(--surface-2)"
          >
            <span className="material-symbols-outlined text-[20px] text-muted">
              search
            </span>
            <input
              ref={searchInputRef}
              className="bg-transparent border-none text-sm w-full focus:ring-0 text-foreground placeholder:text-muted"
              placeholder="Rechercher une page du dashboard..."
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }
              }}
              aria-label="Rechercher une page du dashboard"
            />
            <div className="flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold border-border text-muted">
              /
            </div>
          </form>

          {isSearchOpen && normalizedQuery && (
            <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-(--surface) shadow-2xl overflow-hidden">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => navigateToSearchResult(item.href)}
                      className="w-full px-4 py-3 text-left hover:bg-(--surface-2) transition-colors"
                    >
                      <div className="text-sm font-medium text-foreground">{item.title}</div>
                      <div className="text-xs text-muted mt-1">{item.description}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 text-sm text-muted">
                  Aucun resultat pour cette recherche.
                </div>
              )}
            </div>
          )}
        </div>
        <ThemeModeToggle />
        {/* Notifications */}
        <div className="relative" ref={notificationsContainerRef}>
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="flex items-center justify-center h-10 w-10 rounded-lg relative transition-colors bg-(--surface-2) text-muted hover:text-foreground"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 min-w-2 h-2 px-1 rounded-full text-[10px] leading-2 bg-red-500 text-white border border-background flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-(--surface) shadow-2xl overflow-hidden z-20">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Tout lire
                  </button>
                </div>
              </div>

              {loadingNotifications ? (
                <div className="px-4 py-5 text-sm text-muted">Chargement...</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-5 text-sm text-muted">Aucune notification.</div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="w-full text-left px-4 py-3 border-b border-border/60 hover:bg-(--surface-2) transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-muted">
                                {getNotificationIcon(notif.type)}
                              </span>
                              <span>{notif.titre}</span>
                            </span>
                          </p>
                          <p className="text-xs text-muted mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-[11px] text-muted mt-1">{formatNotificationTime(notif.dateEnvoi)}</p>
                        </div>
                        {!notif.lue && <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0"></span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Custom Actions */}
        {actions}
      </div>
    </header>
  );
}
