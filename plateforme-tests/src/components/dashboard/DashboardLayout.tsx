"use client";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  status?: {
    text: string;
    color?: "green" | "yellow" | "red";
  };
}

export function StatCard({ title, value, icon, trend, status }: StatCardProps) {
  return (
    <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-5 flex flex-col gap-3 hover:border-primary/50 transition-colors group">
      <div className="flex items-center justify-between">
        <p className="text-[#9dabb9] text-sm font-medium">{title}</p>
        <div className="h-8 w-8 rounded-full bg-[#283039] flex items-center justify-center text-white group-hover:bg-primary/20 group-hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-white text-2xl font-bold">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={`material-symbols-outlined text-[16px] ${
                trend.isPositive ? "text-[#0bda5b]" : "text-red-500"
              }`}
            >
              {trend.isPositive ? "trending_up" : "trending_down"}
            </span>
            <p
              className={`text-xs font-medium ${
                trend.isPositive ? "text-[#0bda5b]" : "text-red-500"
              }`}
            >
              {trend.value} {trend.label}
            </p>
          </div>
        )}
        {status && (
          <div className="flex items-center gap-1 mt-1">
            <div
              className={`w-2 h-2 rounded-full ${
                status.color === "green"
                  ? "bg-[#0bda5b]"
                  : status.color === "yellow"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              } animate-pulse`}
            ></div>
            <p className="text-[#9dabb9] text-xs font-medium">{status.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarContent: ReactNode;
  headerContent: ReactNode;
}

export function DashboardLayout({
  children,
  sidebarContent,
  headerContent,
}: DashboardLayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
      {/* Sidebar */}
      {sidebarContent}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        {headerContent}

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
