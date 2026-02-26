"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";

export default function SuperAdminDashboard() {
  const sidebarLinks = [
    { href: ROUTES.SUPER_ADMIN, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SUPER_ADMIN}/users`, icon: "group", label: "Users" },
    { href: `${ROUTES.SUPER_ADMIN}/projects`, icon: "view_kanban", label: "Projects" },
    { href: `${ROUTES.SUPER_ADMIN}/automation`, icon: "smart_toy", label: "Automation" },
  ];

  const headerActions = (
    <button className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20">
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span>New Project</span>
    </button>
  );

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
          title="Dashboard Overview"
          subtitle="Welcome back, here's what's happening today."
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value="1,245"
            icon="group"
            trend={{ value: "+12%", isPositive: true, label: "vs last week" }}
          />
          <StatCard
            title="Active Projects"
            value="48"
            icon="folder_open"
            trend={{ value: "+3", isPositive: true, label: "new today" }}
          />
          <StatCard
            title="System Health"
            value="99.9%"
            icon="health_and_safety"
            status={{ text: "All systems operational", color: "green" }}
          />
          <StatCard
            title="Test Executions"
            value="14.2k"
            icon="bug_report"
            trend={{ value: "Daily average", isPositive: true, label: "" }}
          />
        </div>

        {/* Main Chart Section */}
        <div className="w-full bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-white text-lg font-bold">Platform Activity</h3>
              <p className="text-[#9dabb9] text-sm">
                User logins vs Automated tests run (Last 30 Days)
              </p>
            </div>
            <div className="flex bg-[#283039] rounded-lg p-1 self-start sm:self-auto">
              <button className="px-3 py-1 bg-primary text-white text-xs font-bold rounded shadow-sm">
                30 Days
              </button>
              <button className="px-3 py-1 text-[#9dabb9] hover:text-white text-xs font-medium rounded transition-colors">
                7 Days
              </button>
              <button className="px-3 py-1 text-[#9dabb9] hover:text-white text-xs font-medium rounded transition-colors">
                24 Hours
              </button>
            </div>
          </div>
          <div className="h-60 w-full relative">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 1000 240"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#137fec" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line
                x1="0"
                y1="0"
                x2="1000"
                y2="0"
                stroke="#283039"
                strokeWidth="1"
                strokeDasharray="4"
              />
              <line
                x1="0"
                y1="60"
                x2="1000"
                y2="60"
                stroke="#283039"
                strokeWidth="1"
                strokeDasharray="4"
              />
              <line
                x1="0"
                y1="120"
                x2="1000"
                y2="120"
                stroke="#283039"
                strokeWidth="1"
                strokeDasharray="4"
              />
              <line
                x1="0"
                y1="180"
                x2="1000"
                y2="180"
                stroke="#283039"
                strokeWidth="1"
                strokeDasharray="4"
              />
              <line
                x1="0"
                y1="240"
                x2="1000"
                y2="240"
                stroke="#283039"
                strokeWidth="1"
              />
              <path
                d="M0,180 C100,160 150,200 250,140 C350,80 400,100 500,60 C600,20 650,80 750,40 C850,0 900,60 1000,20 V240 H0 Z"
                fill="url(#chartGradient)"
              />
              <path
                d="M0,180 C100,160 150,200 250,140 C350,80 400,100 500,60 C600,20 650,80 750,40 C850,0 900,60 1000,20"
                fill="none"
                stroke="#137fec"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute top-[20%] left-[50%] bg-[#283039] border border-[#3b4754] rounded-lg px-3 py-2 shadow-xl transform -translate-x-1/2 -translate-y-1/2">
              <p className="text-xs text-[#9dabb9] mb-1">Oct 24</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-white font-bold text-sm">8,432 Executions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: User Table & System Logs */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* User Management Table */}
          <div className="xl:col-span-2 bg-surface-dark border border-[#3b4754] rounded-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#283039] flex items-center justify-between">
              <h3 className="text-white text-lg font-bold">User Management</h3>
              <button className="text-primary text-sm font-bold hover:underline">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e293b]/50 border-b border-[#283039]">
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">
                      User
                    </th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">
                      Role
                    </th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">
                      Status
                    </th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Michael Chen",
                      email: "michael@example.com",
                      role: "DevOps",
                      status: "Active",
                      lastLogin: "2 mins ago",
                      initial: "M",
                    },
                    {
                      name: "Sarah Wilson",
                      email: "sarah.w@example.com",
                      role: "Manager",
                      status: "Active",
                      lastLogin: "4 hours ago",
                      initial: "S",
                    },
                    {
                      name: "David Kim",
                      email: "david.kim@example.com",
                      role: "Guest",
                      status: "Inactive",
                      lastLogin: "2 days ago",
                      initial: "D",
                    },
                    {
                      name: "James Carter",
                      email: "jcarter@example.com",
                      role: "Admin",
                      status: "Active",
                      lastLogin: "1 hour ago",
                      initial: "J",
                    },
                  ].map((user, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[#283039] hover:bg-[#283039]/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/20 rounded-full h-9 w-9 flex items-center justify-center text-primary font-bold text-sm">
                            {user.initial}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white text-sm font-medium">
                              {user.name}
                            </span>
                            <span className="text-[#9dabb9] text-xs">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                            user.role === "DevOps"
                              ? "bg-blue-500/20 text-blue-400"
                              : user.role === "Manager"
                              ? "bg-purple-500/20 text-purple-400"
                              : user.role === "Guest"
                              ? "bg-gray-500/20 text-gray-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.status === "Active" ? "bg-[#0bda5b]" : "bg-gray-500"
                            }`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${
                              user.status === "Active"
                                ? "text-[#0bda5b]"
                                : "text-gray-400"
                            }`}
                          >
                            {user.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[#9dabb9] text-sm">{user.lastLogin}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button className="text-[#9dabb9] hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button className="text-[#9dabb9] hover:text-red-400 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#283039] flex items-center justify-between">
              <h3 className="text-white text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">terminal</span>
                LIVE SYSTEM LOGS
              </h3>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-[#0bda5b]"></div>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-100 font-mono text-xs space-y-2">
              {[
                {
                  time: "10:42:15",
                  level: "INFO",
                  color: "text-blue-400",
                  message: 'New project "Omega" initialized by user #492.',
                },
                {
                  time: "10:41:02",
                  level: "DEPLOY",
                  color: "text-[#0bda5b]",
                  message: "Deployment to Staging-US-East completed successfully (v2.3.1).",
                },
                {
                  time: "10:40:55",
                  level: "WARN",
                  color: "text-yellow-500",
                  message: "High latency detected on Node-01 (>400ms). Auto-scaling triggered.",
                },
                {
                  time: "10:35:12",
                  level: "INFO",
                  color: "text-blue-400",
                  message: "Scheduled backup task started. Target: S3-Bucket-Primary.",
                },
              ].map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-[#9dabb9]">{log.time}</span>{" "}
                  <span className={`font-bold ${log.color}`}>{log.level}</span>
                  <br />
                  <span className="text-[#9dabb9] pl-4">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
