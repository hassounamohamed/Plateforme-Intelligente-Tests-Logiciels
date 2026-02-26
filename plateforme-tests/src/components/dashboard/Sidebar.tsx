"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { logout } from "@/lib/auth";

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

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="w-64 bg-background-dark border-r border-[#283039] shrink-0 z-20 hidden md:flex md:flex-col">
      {/* Logo */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 rounded-lg p-2 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
              {icon}
            </span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-base font-bold leading-tight tracking-tight">
              {title}
            </h1>
            <p className="text-[#9dabb9] text-xs font-medium">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-[#9dabb9] hover:text-white hover:bg-[#283039]"
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? "fill" : ""}`}>
                {link.icon}
              </span>
              <span className="text-sm font-medium">{link.label}</span>
              {link.badge && (
                <span className="ml-auto bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
        <div className="h-px bg-[#283039] my-2 mx-3"></div>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-[#283039]">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#283039] cursor-pointer transition-colors group">
          <div className="relative">
            <div className="bg-primary/20 rounded-full h-9 w-9 ring-2 ring-[#283039] flex items-center justify-center text-primary font-bold">
              {user?.nom?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background-dark rounded-full"></div>
          </div>
          <div className="flex flex-col overflow-hidden flex-1">
            <p className="text-white text-sm font-medium truncate">
              {user?.nom || "User"}
            </p>
            <p className="text-[#9dabb9] text-xs truncate">
              {user?.role?.nom || "User"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-[#9dabb9] hover:text-red-400 text-lg">
              logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
