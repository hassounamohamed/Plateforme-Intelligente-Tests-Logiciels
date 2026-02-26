"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";

export default function QADashboard() {
  const sidebarLinks = [
    { href: ROUTES.QA, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.QA}/tests`, icon: "science", label: "Test Cases" },
    { href: `${ROUTES.QA}/executions`, icon: "play_circle", label: "Test Runs" },
    { href: `${ROUTES.QA}/bugs`, icon: "bug_report", label: "Bugs", badge: "8" },
  ];

  const headerActions = (
    <button className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20">
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span>New Test</span>
    </button>
  );

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="QA Engineer"
          subtitle="Agile & QA Platform"
          icon="science"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="QA Dashboard"
          subtitle="Monitor test execution, coverage, and quality metrics."
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Test Cases"
            value="342"
            icon="science"
            trend={{ value: "+24", isPositive: true, label: "this month" }}
          />
          <StatCard
            title="Pass Rate"
            value="94.2%"
            icon="check_circle"
            trend={{ value: "+3.1%", isPositive: true, label: "vs last week" }}
          />
          <StatCard
            title="Active Bugs"
            value="8"
            icon="bug_report"
            trend={{ value: "-12", isPositive: true, label: "fixed this week" }}
          />
          <StatCard
            title="Automation"
            value="78%"
            icon="smart_toy"
            trend={{ value: "+5%", isPositive: true, label: "coverage" }}
          />
        </div>

        {/* Test Execution Chart */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white text-lg font-bold">Test Execution Trends</h3>
              <p className="text-[#9dabb9] text-sm">Pass vs Fail rate over time</p>
            </div>
            <div className="flex bg-[#283039] rounded-lg p-1">
              <button className="px-3 py-1 bg-primary text-white text-xs font-bold rounded">
                7 Days
              </button>
              <button className="px-3 py-1 text-[#9dabb9] hover:text-white text-xs font-medium rounded">
                30 Days
              </button>
            </div>
          </div>
          <div className="h-48 flex items-end justify-around gap-2">
            {[92, 88, 95, 91, 94, 89, 94].map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-[#283039] rounded-t-lg relative overflow-hidden" style={{ height: "150px" }}>
                  <div
                    className="absolute bottom-0 w-full bg-linear-to-t from-[#0bda5b] to-[#0bda5b]/60 rounded-t-lg transition-all"
                    style={{ height: `${value}%` }}
                  ></div>
                </div>
                <span className="text-[#9dabb9] text-xs">Day {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tests & Bugs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Test Runs */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Recent Test Runs</h3>
            <div className="space-y-3">
              {[
                { name: "Login Flow Tests", status: "Passed", tests: "24/24", time: "2 mins ago" },
                { name: "Payment Integration", status: "Failed", tests: "18/20", time: "1 hour ago" },
                { name: "API Endpoints Suite", status: "Passed", tests: "45/45", time: "3 hours ago" },
                { name: "UI Regression Tests", status: "Passed", tests: "67/67", time: "5 hours ago" },
              ].map((run, idx) => (
                <div
                  key={idx}
                  className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{run.name}</h4>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        run.status === "Passed"
                          ? "bg-[#0bda5b]/20 text-[#0bda5b]"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9dabb9]">{run.tests} tests</span>
                    <span className="text-[#9dabb9]">{run.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Bugs */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Active Bugs</h3>
            <div className="space-y-3">
              {[
                { id: "BUG-342", title: "Payment page crashes on submit", severity: "Critical", assignedTo: "Dev Team" },
                { id: "BUG-341", title: "Login button unresponsive", severity: "High", assignedTo: "Frontend" },
                { id: "BUG-340", title: "Incorrect date format in reports", severity: "Medium", assignedTo: "Backend" },
                { id: "BUG-339", title: "Minor UI alignment issue", severity: "Low", assignedTo: "Design" },
              ].map((bug, idx) => (
                <div
                  key={idx}
                  className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#9dabb9] text-xs font-mono">{bug.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            bug.severity === "Critical"
                              ? "bg-red-500/20 text-red-400"
                              : bug.severity === "High"
                              ? "bg-orange-500/20 text-orange-400"
                              : bug.severity === "Medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {bug.severity}
                        </span>
                      </div>
                      <h4 className="text-white text-sm font-medium">{bug.title}</h4>
                      <p className="text-[#9dabb9] text-xs mt-1">Assigned to {bug.assignedTo}</p>
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
