"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";

export default function ScrumMasterDashboard() {
  const sidebarLinks = [
    { href: ROUTES.SCRUM_MASTER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SCRUM_MASTER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.SCRUM_MASTER}/team`, icon: "groups", label: "Team Management" },
    { href: `${ROUTES.SCRUM_MASTER}/retrospectives`, icon: "psychology", label: "Retrospectives" },
  ];

  const headerActions = (
    <button className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20">
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span>New Sprint</span>
    </button>
  );

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Scrum Master"
          subtitle="Agile & QA Platform"
          icon="groups"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Scrum Master Dashboard"
          subtitle="Facilitate sprints, remove blockers, and coach the team."
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Team Members"
            value="12"
            icon="groups"
            status={{ text: "All active", color: "green" }}
          />
          <StatCard
            title="Sprint Progress"
            value="72%"
            icon="donut_small"
            trend={{ value: "On schedule", isPositive: true, label: "" }}
          />
          <StatCard
            title="Active Blockers"
            value="3"
            icon="block"
            trend={{ value: "-2", isPositive: true, label: "vs yesterday" }}
          />
          <StatCard
            title="Team Satisfaction"
            value="4.2/5"
            icon="sentiment_satisfied"
            trend={{ value: "+0.3", isPositive: true, label: "this month" }}
          />
        </div>

        {/* Sprint Status & Burndown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Sprint Info */}
          <div className="lg:col-span-2 bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white text-lg font-bold">Sprint 24 - Burndown Chart</h3>
                <p className="text-[#9dabb9] text-sm">5 days remaining • Target: 45 SP</p>
              </div>
              <button className="text-primary text-sm font-bold hover:underline">
                View Details
              </button>
            </div>
            
            {/* Burndown Chart */}
            <div className="h-60 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="idealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9dabb9" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#9dabb9" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#137fec" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid */}
                {[0, 60, 120, 180, 240].map((y) => (
                  <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#283039" strokeWidth="1" strokeDasharray="4" />
                ))}
                {/* Ideal line */}
                <path d="M0,20 L1000,240" fill="none" stroke="#9dabb9" strokeWidth="2" strokeDasharray="8" />
                {/* Actual line */}
                <path d="M0,20 L200,60 L400,100 L600,150 L800,180 L1000,200" fill="none" stroke="#137fec" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#9dabb9] rounded"></div>
                <span className="text-[#9dabb9] text-sm">Ideal Burndown</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span className="text-white text-sm">Actual Progress</span>
              </div>
            </div>
          </div>

          {/* Daily Standup Notes */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Today's Standup</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Time</p>
                <p className="text-white text-sm">9:00 AM - 9:15 AM</p>
              </div>
              <div>
                <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Attendees</p>
                <p className="text-white text-sm">12/12 present</p>
              </div>
              <div>
                <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Key Points</p>
                <ul className="space-y-2 mt-2">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#0bda5b] text-[16px] mt-0.5">check_circle</span>
                    <span className="text-white text-sm">Payment feature deployed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-yellow-500 text-[16px] mt-0.5">warning</span>
                    <span className="text-white text-sm">API rate limit blocker</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">info</span>
                    <span className="text-white text-sm">Design review at 2 PM</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Team Activity & Blockers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Blockers */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400">block</span>
              Active Blockers
            </h3>
            <div className="space-y-3">
              {[
                { title: "API rate limit exceeded", team: "Backend Team", severity: "High", duration: "2 hours" },
                { title: "Waiting for design approval", team: "Frontend Team", severity: "Medium", duration: "1 day" },
                { title: "Database migration pending", team: "DevOps", severity: "High", duration: "4 hours" },
              ].map((blocker, idx) => (
                <div
                  key={idx}
                  className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-red-400/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm mb-1">{blocker.title}</h4>
                      <p className="text-[#9dabb9] text-xs">{blocker.team}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${
                        blocker.severity === "High"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {blocker.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="material-symbols-outlined text-[#9dabb9] text-[14px]">schedule</span>
                    <span className="text-[#9dabb9] text-xs">Blocked for {blocker.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Capacity */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Team Capacity</h3>
            <div className="space-y-4">
              {[
                { name: "Michael Chen", role: "Developer", capacity: 85, avatar: "M" },
                { name: "Sarah Wilson", role: "Developer", capacity: 92, avatar: "S" },
                { name: "David Kim", role: "QA Engineer", capacity: 70, avatar: "D" },
                { name: "Emma Rodriguez", role: "Designer", capacity: 95, avatar: "E" },
              ].map((member, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 rounded-full h-8 w-8 flex items-center justify-center text-primary font-bold text-sm">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{member.name}</p>
                        <p className="text-[#9dabb9] text-xs">{member.role}</p>
                      </div>
                    </div>
                    <span className="text-white font-bold text-sm">{member.capacity}%</span>
                  </div>
                  <div className="w-full bg-[#283039] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        member.capacity >= 90
                          ? "bg-red-500"
                          : member.capacity >= 75
                          ? "bg-yellow-500"
                          : "bg-[#0bda5b]"
                      }`}
                      style={{ width: `${member.capacity}%` }}
                    ></div>
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
