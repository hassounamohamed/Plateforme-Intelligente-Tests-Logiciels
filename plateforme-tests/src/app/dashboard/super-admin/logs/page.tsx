"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { useSystemLogs, useAuditLogs } from "@/features/logs/hooks";

export default function LogsPage() {
  const { data: systemLogs = [] } = useSystemLogs({ limit: 50 });
  const { data: auditLogs = [] } = useAuditLogs({ limit: 50 });

  const sidebarLinks = [
    { href: ROUTES.SUPER_ADMIN, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SUPER_ADMIN}/users`, icon: "group", label: "Utilisateurs" },
    { href: `${ROUTES.SUPER_ADMIN}/roles`, icon: "shield", label: "Rôles" },
    { href: `${ROUTES.SUPER_ADMIN}/projects`, icon: "view_kanban", label: "Projets" },
    { href: `${ROUTES.SUPER_ADMIN}/logs`, icon: "terminal", label: "Logs" },
    { href: `${ROUTES.SUPER_ADMIN}/profile`, icon: "account_circle", label: "Mon Profil" },
    { href: `${ROUTES.SUPER_ADMIN}/settings`, icon: "settings", label: "Paramètres" },
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
          title="Logs Système"
          subtitle="Surveillance des logs système et d'audit en temps réel"
        />
      }
    >
      <div className="max-w-350 mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* System Logs */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#283039] flex items-center justify-between">
              <h3 className="text-white text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">terminal</span>
                LOGS SYSTÈME EN DIRECT
              </h3>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-[#0bda5b]"></div>
              </div>
            </div>
            <div className="p-4 overflow-y-auto h-150 font-mono text-xs space-y-2">
              {systemLogs.length === 0 ? (
                <div className="text-[#9dabb9] text-center py-8">
                  Aucun log système disponible
                </div>
              ) : (
                systemLogs.map((log: any, index: number) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-[#9dabb9] whitespace-nowrap">
                      [{new Date(log.timestamp).toLocaleTimeString('fr-FR')}]
                    </span>
                    <span
                      className={`font-bold whitespace-nowrap ${
                        log.niveau === "ERROR" || log.niveau === "CRITICAL"
                          ? "text-red-400"
                          : log.niveau === "WARNING"
                          ? "text-yellow-400"
                          : "text-[#0bda5b]"
                      }`}
                    >
                      {log.niveau}
                    </span>
                    <span className="text-white break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#283039]">
              <h3 className="text-white text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">history</span>
                LOGS D&apos;AUDIT RÉCENTS
              </h3>
            </div>
            <div className="p-4 overflow-y-auto h-150 space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-[#9dabb9] text-center py-8">
                  Aucun log d&apos;audit disponible
                </div>
              ) : (
                auditLogs.map((log: any, index: number) => (
                  <div
                    key={index}
                    className="bg-[#1e293b] border border-[#283039] rounded-lg p-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/20 rounded-full h-7 w-7 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-[14px]">
                            person
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white text-xs font-bold">
                            {log.user?.nom || "Utilisateur inconnu"}
                          </span>
                          <span className="text-[#9dabb9] text-[10px]">
                            {log.user?.email || "N/A"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[#9dabb9] text-[10px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="pl-9">
                      <p className="text-white text-xs mb-1">
                        <span className="font-bold text-primary">{log.action}</span>
                        {log.entityType && (
                          <>
                            {" "}sur <span className="text-[#9dabb9]">{log.entityType}</span>
                            {log.entityId && (
                              <span className="text-[#9dabb9]"> #{log.entityId}</span>
                            )}
                          </>
                        )}
                      </p>
                      {log.details && (
                        <p className="text-[#9dabb9] text-[10px] mt-1">{log.details}</p>
                      )}
                      {log.ipAddress && (
                        <p className="text-[#9dabb9] text-[10px] mt-1">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
