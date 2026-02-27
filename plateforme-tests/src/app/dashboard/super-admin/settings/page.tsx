"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { SettingsModal } from "@/components/super-admin/SettingsModal";

export default function SettingsPage() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const sidebarLinks = [
    { href: ROUTES.SUPER_ADMIN, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SUPER_ADMIN}/users`, icon: "group", label: "Utilisateurs" },
    { href: `${ROUTES.SUPER_ADMIN}/roles`, icon: "shield", label: "Rôles" },
    { href: `${ROUTES.SUPER_ADMIN}/projects`, icon: "view_kanban", label: "Projets" },
    { href: `${ROUTES.SUPER_ADMIN}/logs`, icon: "terminal", label: "Logs" },
    { href: `${ROUTES.SUPER_ADMIN}/profile`, icon: "account_circle", label: "Mon Profil" },
    { href: `${ROUTES.SUPER_ADMIN}/settings`, icon: "settings", label: "Paramètres" },
  ];

  const handleSettingsSubmit = (settingsData: any) => {
    // TODO: Implement settings save
    console.log("Settings data:", settingsData);
    alert("Paramètres sauvegardés avec succès");
  };

  const settingsCategories = [
    {
      title: "Général",
      icon: "tune",
      description: "Configuration générale de la plateforme",
      settings: [
        { label: "Nom de la plateforme", value: "Agile & QA Platform", type: "text" },
        { label: "Mode maintenance", value: "Désactivé", type: "toggle" },
        { label: "Langue par défaut", value: "Français", type: "select" },
      ],
    },
    {
      title: "Sécurité",
      icon: "security",
      description: "Paramètres de sécurité et d'authentification",
      settings: [
        { label: "Authentification à deux facteurs", value: "Activé", type: "toggle" },
        { label: "Durée de session", value: "8 heures", type: "text" },
        { label: "Complexité mot de passe", value: "Élevée", type: "select" },
      ],
    },
    {
      title: "Email",
      icon: "email",
      description: "Configuration des emails et notifications",
      settings: [
        { label: "Serveur SMTP", value: "smtp.example.com", type: "text" },
        { label: "Port SMTP", value: "587", type: "text" },
        { label: "Notifications activées", value: "Oui", type: "toggle" },
      ],
    },
    {
      title: "Sauvegarde",
      icon: "backup",
      description: "Gestion des sauvegardes automatiques",
      settings: [
        { label: "Sauvegarde automatique", value: "Activée", type: "toggle" },
        { label: "Fréquence", value: "Quotidienne", type: "select" },
        { label: "Rétention", value: "30 jours", type: "text" },
      ],
    },
  ];

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Super Admin"
          subtitle="Agile & QA Platform"
          icon="admin_panel_settings"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Paramètres de la Plateforme"
          subtitle="Configuration et personnalisation du système"
        />
      }
    >
      <div className="max-w-350 mx-auto">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Modifier les Paramètres
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {settingsCategories.map((category, index) => (
            <div
              key={index}
              className="bg-surface-dark border border-[#3b4754] rounded-xl overflow-hidden"
            >
              <div className="p-5 border-b border-[#283039]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/20 rounded-lg p-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                      {category.icon}
                    </span>
                  </div>
                  <h3 className="text-white text-lg font-bold">{category.title}</h3>
                </div>
                <p className="text-[#9dabb9] text-xs">{category.description}</p>
              </div>
              <div className="p-5 space-y-4">
                {category.settings.map((setting, settingIndex) => (
                  <div
                    key={settingIndex}
                    className="flex items-center justify-between py-2 border-b border-[#283039] last:border-0"
                  >
                    <span className="text-white text-sm font-medium">
                      {setting.label}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        setting.type === "toggle"
                          ? setting.value === "Activé" || setting.value === "Oui"
                            ? "text-[#0bda5b]"
                            : "text-gray-400"
                          : "text-primary"
                      }`}
                    >
                      {setting.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* System Info Section */}
        <div className="mt-6 bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">info</span>
            Informations Système
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1e293b] rounded-lg p-4">
              <p className="text-[#9dabb9] text-xs mb-1">Version</p>
              <p className="text-white text-lg font-bold">v1.0.0</p>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-4">
              <p className="text-[#9dabb9] text-xs mb-1">Dernière MAJ</p>
              <p className="text-white text-lg font-bold">26 Fév 2026</p>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-4">
              <p className="text-[#9dabb9] text-xs mb-1">Uptime</p>
              <p className="text-white text-lg font-bold">99.9%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </DashboardLayout>
  );
}
