"use client";

import { ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-[#283039] px-6 py-4 bg-background-light dark:bg-background-dark z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-[#9dabb9]">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex flex-col">
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
            {title}
          </h2>
          <p className="text-[#9dabb9] text-xs">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden sm:flex items-center bg-[#283039] rounded-lg h-10 px-3 w-64 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <span className="material-symbols-outlined text-[#9dabb9] text-[20px]">
            search
          </span>
          <input
            className="bg-transparent border-none text-white text-sm placeholder-[#9dabb9] w-full focus:ring-0"
            placeholder="Search users, projects..."
            type="text"
          />
          <div className="flex items-center justify-center h-5 w-5 rounded border border-[#3b4754] text-[#9dabb9] text-[10px] font-bold">
            /
          </div>
        </div>
        {/* Notifications */}
        <button className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-[#283039] text-[#9dabb9] hover:text-white relative transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-background-dark"></span>
        </button>
        {/* Custom Actions */}
        {actions}
      </div>
    </header>
  );
}
