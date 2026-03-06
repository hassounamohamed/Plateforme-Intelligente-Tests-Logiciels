"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";

export default function RoadmapPage() {
  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
    { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
    { href: `${ROUTES.PRODUCT_OWNER}/ai-backlog`, icon: "smart_toy", label: "AI Backlog" },
    { href: `${ROUTES.PRODUCT_OWNER}/validation-tests`, icon: "check_circle", label: "Validation Tests" },
    { href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "map", label: "Roadmap" },
    { href: `${ROUTES.PRODUCT_OWNER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

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
          title="Roadmap Produit"
          subtitle="Visualisez la roadmap stratégique de vos projets"
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-[#9dabb9] text-[64px] mb-4">
            map
          </span>
          <h2 className="text-white text-2xl font-bold mb-2">
            Roadmap en développement
          </h2>
          <p className="text-[#9dabb9] text-lg">
            Cette fonctionnalité sera disponible prochainement
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
