"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";

export default function ProductOwnerDashboard() {
  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list_alt", label: "Product Backlog" },
    { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "timeline", label: "Roadmap" },
    { href: `${ROUTES.PRODUCT_OWNER}/releases`, icon: "rocket_launch", label: "Releases" },
  ];

  const headerActions = (
    <button className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20">
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span>New Story</span>
    </button>
  );

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
          title="Product Owner Dashboard"
          subtitle="Manage backlog, priorities, and product roadmap."
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350uto flex flex-col gap-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Backlog Items"
            value="128"
            icon="list_alt"
            trend={{ value: "+15", isPositive: true, label: "this sprint" }}
          />
          <StatCard
            title="Story Points"
            value="342"
            icon="trending_up"
            trend={{ value: "78", isPositive: true, label: "completed" }}
          />
          <StatCard
            title="Sprint Progress"
            value="67%"
            icon="donut_small"
            trend={{ value: "On track", isPositive: true, label: "" }}
          />
          <StatCard
            title="Team Velocity"
            value="45"
            icon="speed"
            trend={{ value: "+8%", isPositive: true, label: "vs last sprint" }}
          />
        </div>

        {/* Sprint Overview */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-lg font-bold">Current Sprint - Sprint 24</h3>
              <p className="text-[#9dabb9] text-sm">Feb 12 - Feb 26, 2026 • 5 days remaining</p>
            </div>
            <button className="text-primary text-sm font-bold hover:underline">
              View Details
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#9dabb9] text-sm">Sprint Completion</span>
              <span className="text-white font-bold text-sm">67%</span>
            </div>
            <div className="w-full bg-[#283039] rounded-full h-3 overflow-hidden">
              <div className="bg-linear-to-r from-primary to-blue-400 h-full rounded-full transition-all" style={{ width: "67%" }}></div>
            </div>
          </div>

          {/* Sprint Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Stories", value: "18", color: "text-blue-400" },
              { label: "Completed", value: "12", color: "text-[#0bda5b]" },
              { label: "In Progress", value: "4", color: "text-yellow-500" },
              { label: "Pending", value: "2", color: "text-[#9dabb9]" },
            ].map((stat, idx) => (
              <div key={idx} className="bg-[#283039] rounded-lg p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[#9dabb9] text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Backlog & Team Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Backlog Items */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">High Priority Backlog</h3>
            <div className="space-y-3">
              {[
                { id: "US-245", title: "Implement advanced search filters", points: "8", priority: "High" },
                { id: "US-244", title: "Add export to Excel functionality", points: "5", priority: "High" },
                { id: "US-243", title: "Improve dashboard loading speed", points: "13", priority: "Critical" },
                { id: "US-242", title: "Mobile responsive design updates", points: "8", priority: "Medium" },
              ].map((story, idx) => (
                <div
                  key={idx}
                  className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-primary text-xs font-mono font-bold">{story.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            story.priority === "Critical"
                              ? "bg-red-500/20 text-red-400"
                              : story.priority === "High"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {story.priority}
                        </span>
                      </div>
                      <h4 className="text-white text-sm font-medium">{story.title}</h4>
                    </div>
                    <div className="bg-primary/20 text-primary px-2.5 py-1 rounded-lg text-xs font-bold ml-3">
                      {story.points} SP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Velocity Chart */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Team Velocity</h3>
            <p className="text-[#9dabb9] text-sm mb-6">Story points completed per sprint</p>
            <div className="h-48 flex items-end justify-around gap-2">
              {[38, 42, 35, 45, 41, 47].map((value, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full">
                    <div className="absolute -top-6 w-full text-center">
                      <span className="text-white text-xs font-bold">{value}</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#283039] rounded-t-lg relative overflow-hidden" style={{ height: "150px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-linear-to-t from-primary to-primary/60 rounded-t-lg transition-all"
                      style={{ height: `${(value / 50) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[#9dabb9] text-xs">S{19 + idx}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span className="text-[#9dabb9]">Avg: 41.3 SP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
