"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";

export default function DeveloperDashboard() {
  const sidebarLinks = [
    { href: ROUTES.DEVELOPER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.DEVELOPER}/tasks`, icon: "task_alt", label: "My Tasks", badge: "12" },
    { href: `${ROUTES.DEVELOPER}/code`, icon: "code", label: "Code Review" },
    { href: `${ROUTES.DEVELOPER}/tests`, icon: "bug_report", label: "Test Results" },
  ];

  const headerActions = (
    <button className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20">
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span>New Task</span>
    </button>
  );

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Developer"
          subtitle="Agile & QA Platform"
          icon="code"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Developer Dashboard"
          subtitle="Track your tasks, commits, and test coverage."
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Tasks"
            value="12"
            icon="task_alt"
            trend={{ value: "+3", isPositive: true, label: "this week" }}
          />
          <StatCard
            title="Code Commits"
            value="47"
            icon="commit"
            trend={{ value: "+15%", isPositive: true, label: "vs last week" }}
          />
          <StatCard
            title="Test Coverage"
            value="87%"
            icon="verified"
            trend={{ value: "+2%", isPositive: true, label: "improved" }}
          />
          <StatCard
            title="Code Reviews"
            value="5"
            icon="rate_review"
            trend={{ value: "2", isPositive: true, label: "pending" }}
          />
        </div>

        {/* My Tasks */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-bold">My Active Tasks</h3>
            <button className="text-primary text-sm font-bold hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {[
              { title: "Implement user authentication", status: "In Progress", priority: "High" },
              { title: "Fix bug in payment gateway", status: "To Do", priority: "Critical" },
              { title: "Add unit tests for API endpoints", status: "In Progress", priority: "Medium" },
              { title: "Refactor legacy code module", status: "To Do", priority: "Low" },
            ].map((task, idx) => (
              <div
                key={idx}
                className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">{task.title}</h4>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      task.priority === "Critical"
                        ? "bg-red-500/20 text-red-400"
                        : task.priority === "High"
                        ? "bg-orange-500/20 text-orange-400"
                        : task.priority === "Medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <p className="text-[#9dabb9] text-sm mt-2">{task.status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Recent Commits</h3>
            <div className="space-y-3">
              {[
                { message: "feat: Add user profile endpoint", time: "2 hours ago", branch: "feature/user-profile" },
                { message: "fix: Resolve CORS issue", time: "5 hours ago", branch: "bugfix/cors" },
                { message: "refactor: Clean up auth service", time: "1 day ago", branch: "main" },
              ].map((commit, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-[#283039] rounded-lg">
                  <span className="material-symbols-outlined text-primary text-[20px]">commit</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{commit.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#9dabb9] text-xs">{commit.branch}</span>
                      <span className="text-[#9dabb9] text-xs">•</span>
                      <span className="text-[#9dabb9] text-xs">{commit.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Code Review Requests</h3>
            <div className="space-y-3">
              {[
                { title: "PR #234: Add payment integration", author: "Sarah Wilson", status: "Pending" },
                { title: "PR #233: Update dashboard UI", author: "Michael Chen", status: "Changes Requested" },
                { title: "PR #232: Fix authentication bug", author: "David Kim", status: "Approved" },
              ].map((pr, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-[#283039] rounded-lg">
                  <span className="material-symbols-outlined text-primary text-[20px]">rate_review</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{pr.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#9dabb9] text-xs">by {pr.author}</span>
                      <span className="text-[#9dabb9] text-xs">•</span>
                      <span
                        className={`text-xs font-bold ${
                          pr.status === "Approved"
                            ? "text-[#0bda5b]"
                            : pr.status === "Changes Requested"
                            ? "text-yellow-500"
                            : "text-blue-400"
                        }`}
                      >
                        {pr.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
