"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { logout } from "@/lib/auth";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SidebarProps {
  title: string;
  subtitle: string;
  icon: string;
  links: Array<{
    href: string;
    icon: string;
    label: string;
    badge?: string;
  }>;
}

export function Sidebar({ title, subtitle, icon, links }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Keep a single active item: prefer the most specific matching path.
  const activeHref =
    links
      .filter(
        (link) => pathname === link.href || pathname?.startsWith(link.href + "/"),
      )
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;

  // Derive groups from link labels
  const gestionLabels = [
    "Équipe",
    "Cahier de Tests",
    "Mon Profil",
    "Paramètres",
    "Utilisateurs",
    "Rôles",
    "Logs",
  ];

  const principalLinks = links.filter((l) => !gestionLabels.includes(l.label));
  const gestionLinks = links.filter((l) => gestionLabels.includes(l.label));

  const renderLinks = (linkItems: typeof links) => (
    <SidebarMenu className="gap-2">
      {linkItems.map((link) => {
        const isActive = link.href === activeHref;
        return (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={link.label}
              className={`font-medium min-h-10
                isActive
                  ? "bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary"
                  : "text-muted-foreground hover:text-sidebar-accent-foreground"
              }`}
            >
              <Link href={link.href}>
                <span
                  className={`material-symbols-outlined text-[22px] ${
                    isActive ? "fill text-primary" : ""
                  }`}
                >
                  {link.icon}
                </span>
                <span className="text-[15px]">{link.label}</span>
                {link.badge && (
                  <SidebarMenuBadge
                    className="ml-auto bg-primary text-white rounded-full min-w-5.5 h-5.5-1.5 flex items-center justify-center font-bold text-[11px]"
                  >
                    {link.badge}
                  </SidebarMenuBadge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <ShadcnSidebar>
      {/* Header */}
      <SidebarHeader className="p-4 pt-6">
        <div className="flex items-center gap-3.5 bg-sidebar-accent/50 p-2.5 rounded-xl border border-border/50 shadow-sm">
          <div className="bg-primary/20 rounded-lg p-2 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              {icon}
            </span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-foreground text-[15px] font-bold leading-tight tracking-tight">
              {title}
            </h1>
            <p className="text-muted-foreground text-[13px] font-medium leading-tight">
              {subtitle}
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-2 pb-4 gap-6 pt-2">
        {principalLinks.length > 0 && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase mb-1.5 px-3">
              PRINCIPAL
            </SidebarGroupLabel>
            <SidebarGroupContent>{renderLinks(principalLinks)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        {gestionLinks.length > 0 && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase mb-1.5 px-3">
              GESTION
            </SidebarGroupLabel>
            <SidebarGroupContent>{renderLinks(gestionLinks)}</SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-border/30">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="gap-3.5 w-full justify-start hover:bg-sidebar-accent/80 rounded-xl"
              onClick={() => logout()}
            >
              <div className="relative">
                <div className="bg-primary/10 border border-primary/20 rounded-full h-9.5 w-9.5 flex items-center justify-center text-primary font-bold text-[15px]">
                  {user?.nom?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
              </div>
              <div className="flex flex-col overflow-hidden text-left flex-1">
                <span className="text-[14px] font-bold text-foreground truncate">
                  {user?.nom || "User"}
                </span>
                <span className="text-[13px] text-muted-foreground truncate">
                  {user?.role?.nom || "User"}
                </span>
              </div>
              <span className="material-symbols-outlined ml-auto text-muted-foreground transition-colors hover:text-destructive">
                logout
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
