"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeModeToggle } from "@/components/theme/ThemeModeToggle";
import { useAuthStore } from "@/features/auth/store";
import { ROLES, ROUTES } from "@/lib/constants";

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
    href: `${ROUTES.PRODUCT_OWNER}/validation-tests`,
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

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
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
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
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

  return (
    <header className="flex items-center justify-between border-b px-6 py-4 z-10 sticky top-0 backdrop-blur-md bg-(--background)/95 border-(--border)">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-(--muted)">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-xs text-(--muted)">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden sm:block relative" ref={searchContainerRef}>
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center rounded-lg h-10 px-3 w-80 focus-within:ring-2 focus-within:ring-primary/50 transition-all bg-(--surface-2)"
          >
            <span className="material-symbols-outlined text-[20px] text-(--muted)">
              search
            </span>
            <input
              ref={searchInputRef}
              className="bg-transparent border-none text-sm w-full focus:ring-0 text-foreground placeholder:text-(--muted)"
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
            <div className="flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold border-(--border) text-(--muted)">
              /
            </div>
          </form>

          {isSearchOpen && normalizedQuery && (
            <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-(--border) bg-(--surface) shadow-2xl overflow-hidden">
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
                      <div className="text-xs text-(--muted) mt-1">{item.description}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 text-sm text-(--muted)">
                  Aucun resultat pour cette recherche.
                </div>
              )}
            </div>
          )}
        </div>
        <ThemeModeToggle />
        {/* Notifications */}
        <button className="flex items-center justify-center h-10 w-10 rounded-lg relative transition-colors bg-(--surface-2) text-(--muted) hover:text-foreground">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
        </button>
        {/* Custom Actions */}
        {actions}
      </div>
    </header>
  );
}
