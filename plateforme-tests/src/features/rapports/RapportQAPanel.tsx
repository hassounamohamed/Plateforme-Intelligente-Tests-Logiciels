"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GenererRapportQAPayload, RapportQA, UpdateRapportQAPayload } from "@/types";

type GenerationMode = "manuelle" | "ai" | null;
type ExportFormat = "pdf" | "word" | null;

interface RapportQAPanelProps {
  projectId: number;
  projectName?: string;
  cahierId: number;
  cahierName?: string;
  rapport: RapportQA | null;
  loading: boolean;
  canGenerate: boolean;
  readOnly: boolean;
  generatingMode: GenerationMode;
  exporting: ExportFormat;
  updating: boolean;
  onGenerate: (mode: "manuelle" | "ai", payload?: GenererRapportQAPayload) => void;
  onUpdate: (payload: UpdateRapportQAPayload) => void;
  onExport: (format: "pdf" | "word") => void;
}

const CHART_COLORS = {
  passed: "#22c55e",
  failed: "#ef4444",
  blocked: "#f59e0b",
  pending: "#60a5fa",
  lineExec: "#3b82f6",
  lineFail: "#f97316",
};

function toPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function RapportQAPanel({
  projectId,
  projectName,
  cahierId,
  cahierName,
  rapport,
  loading,
  canGenerate,
  readOnly,
  generatingMode,
  exporting,
  updating,
  onGenerate,
  onUpdate,
  onExport,
}: RapportQAPanelProps) {
  const [showManualForm, setShowManualForm] = React.useState(false);
  const [showEditForm, setShowEditForm] = React.useState(false);
  const [manualVersion, setManualVersion] = React.useState("");
  const [manualRecommandations, setManualRecommandations] = React.useState("");
  const [editVersion, setEditVersion] = React.useState("");
  const [editStatut, setEditStatut] = React.useState("brouillon");
  const [editRecommandations, setEditRecommandations] = React.useState("");
  const [showRecommendationsEditor, setShowRecommendationsEditor] = React.useState(false);
  const [recommendationsDraft, setRecommendationsDraft] = React.useState("");

  React.useEffect(() => {
    if (!rapport) return;
    setEditVersion(rapport.version || "");
    setEditStatut(rapport.statut || "brouillon");
    setEditRecommandations(rapport.recommandations || "");
    setRecommendationsDraft(rapport.recommandations || "");
  }, [rapport]);

  const computed = useMemo(() => {
    const executed = rapport?.nombreTestsExecutes ?? 0;
    const passed = rapport?.nombreTestsReussis ?? 0;
    const failed = rapport?.nombreTestsEchoues ?? 0;
    const blocked = rapport?.nombreTestsBloques ?? 0;
    const total = rapport?.nombreTestsTotal ?? executed;
    const pending = rapport?.nombreTestsNonExecutes ?? 0;
    const passRate = rapport?.passRate ?? 0;
    const coverage = rapport?.coverageRate ?? 0;
    const critical = rapport?.indicateurs?.nombreAnomaliesCritiques ?? 0;
    const decision = (rapport?.decisionRelease as "GO" | "NO GO" | undefined) ?? "NO GO";
    const trend = rapport?.trendDisplay ?? "Stable";
    const qualityIndex = rapport?.qualityIndex ?? 0;
    const observation = rapport?.observationMessage || "";

    const pieData = [
      { name: "Reussis", value: passed, color: CHART_COLORS.passed },
      { name: "Echoues", value: failed, color: CHART_COLORS.failed },
      { name: "Bloques", value: blocked, color: CHART_COLORS.blocked },
      { name: "En attente", value: pending, color: CHART_COLORS.pending },
    ].filter((item) => item.value > 0 || item.name === "En attente");

    const stackData = [
      {
        name: "Execution",
        Reussis: passed,
        Echoues: failed,
        Bloques: blocked,
        EnAttente: pending,
      },
    ];

    const trendData = rapport?.trendData || [];
    const recommendations = rapport?.recommendationLines || [];

    return {
      executed,
      passed,
      failed,
      blocked,
      pending,
      passRate,
      coverage,
      total,
      critical,
      decision,
      trend,
      qualityIndex,
      observation,
      pieData,
      stackData,
      trendData,
      recommendations,
    };
  }, [rapport]);

  return (
    <div className="bg-surface-dark rounded-xl border border-[#3b4754] p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h3 className="text-white text-xl font-bold">Rapport QA {rapport?.version ? `v${rapport.version}` : ""}</h3>
          <p className="text-[#9dabb9] text-sm mt-1">
            Projet: {projectName || `Projet ${projectId}`} • Cahier: {cahierName || `Cahier ${cahierId}`} • Date: {formatDate(rapport?.dateGeneration)}
          </p>
          <p className="text-[#9dabb9] text-sm mt-1">
            Statut: <span className="text-white font-semibold">{rapport?.statut || "Brouillon"}</span>
          </p>
          {rapport && (
            <p className="text-[#9dabb9] text-sm mt-1">
              Decision release: <span className={`font-semibold ${computed.decision === "GO" ? "text-green-400" : "text-red-400"}`}>{computed.decision}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {canGenerate && (
            <>
              <button
                onClick={() => setShowManualForm((prev) => !prev)}
                disabled={generatingMode !== null || readOnly}
                className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039] font-medium disabled:opacity-50"
              >
                {generatingMode === "manuelle" ? "Generation..." : "Generer manuelle"}
              </button>
              <button
                onClick={() => onGenerate("ai")}
                disabled={generatingMode !== null || readOnly}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {generatingMode === "ai" ? "Generation IA..." : "Generer avec IA"}
              </button>
            </>
          )}

          {rapport && (
            <button
              onClick={() => setShowEditForm((prev) => !prev)}
              disabled={readOnly || updating}
              className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039] font-medium disabled:opacity-50"
            >
              {updating ? "Modification..." : "Modifier rapport"}
            </button>
          )}

          {rapport && (
            <>
              <button
                onClick={() => onExport("pdf")}
                disabled={exporting !== null}
                className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039] font-medium disabled:opacity-50"
              >
                {exporting === "pdf" ? "Export..." : "Export PDF"}
              </button>
              <button
                onClick={() => onExport("word")}
                disabled={exporting !== null}
                className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039] font-medium disabled:opacity-50"
              >
                {exporting === "word" ? "Export..." : "Export Word"}
              </button>
            </>
          )}
        </div>
      </div>

      {showManualForm && canGenerate && (
        <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4 space-y-3">
          <h4 className="text-white font-semibold">Generation manuelle</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9dabb9]">Version (optionnel)</label>
              <input
                value={manualVersion}
                onChange={(e) => setManualVersion(e.target.value)}
                placeholder="Ex: 1.5.0"
                className="mt-1 w-full h-10 px-3 bg-[#0f172a] border border-[#334155] rounded-md text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#9dabb9]">Recommandations manuelles</label>
            <textarea
              value={manualRecommandations}
              onChange={(e) => setManualRecommandations(e.target.value)}
              rows={4}
              placeholder="Saisir les recommandations manuelles..."
              className="mt-1 w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-md text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onGenerate("manuelle", {
                  version: manualVersion || undefined,
                  recommandations: manualRecommandations || undefined,
                })
              }
              disabled={generatingMode !== null}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              Confirmer generation manuelle
            </button>
            <button
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2 border border-[#334155] rounded-md text-white hover:bg-[#283039]"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {showEditForm && rapport && (
        <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4 space-y-3">
          <h4 className="text-white font-semibold">Modification rapport QA</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9dabb9]">Version</label>
              <input
                value={editVersion}
                onChange={(e) => setEditVersion(e.target.value)}
                className="mt-1 w-full h-10 px-3 bg-[#0f172a] border border-[#334155] rounded-md text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9dabb9]">Statut</label>
              <select
                value={editStatut}
                onChange={(e) => setEditStatut(e.target.value)}
                className="mt-1 w-full h-10 px-3 bg-[#0f172a] border border-[#334155] rounded-md text-white"
              >
                <option value="brouillon">Brouillon</option>
                <option value="valide">Valide</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#9dabb9]">Recommandations</label>
            <textarea
              value={editRecommandations}
              onChange={(e) => setEditRecommandations(e.target.value)}
              rows={4}
              className="mt-1 w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-md text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdate({
                  version: editVersion || undefined,
                  statut: editStatut || undefined,
                  recommandations: editRecommandations || undefined,
                })
              }
              disabled={updating}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              Enregistrer modifications
            </button>
            <button
              onClick={() => setShowEditForm(false)}
              className="px-4 py-2 border border-[#334155] rounded-md text-white hover:bg-[#283039]"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-52">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : !rapport ? (
        <div className="rounded-lg border border-dashed border-[#3b4754] p-8 text-center">
          <p className="text-[#9dabb9]">Aucun rapport QA genere pour ce cahier.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4">
              <p className="text-[#9dabb9] text-xs uppercase tracking-wide">Test Coverage</p>
              <p className="text-white text-3xl font-bold mt-2">{toPercent(computed.coverage)}</p>
              <p className="text-[#9dabb9] text-xs mt-1">{computed.executed} / {computed.total} tests</p>
            </div>
            <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4">
              <p className="text-[#9dabb9] text-xs uppercase tracking-wide">Pass Rate</p>
              <p className="text-white text-3xl font-bold mt-2">{toPercent(computed.passRate)}</p>
              <p className="text-[#9dabb9] text-xs mt-1">Passed: {computed.passed}</p>
            </div>
            <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4">
              <p className="text-[#9dabb9] text-xs uppercase tracking-wide">Failed Tests</p>
              <p className="text-white text-3xl font-bold mt-2">{computed.failed}</p>
              <p className="text-[#9dabb9] text-xs mt-1">Critical: {computed.critical}</p>
            </div>
            <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4">
              <p className="text-[#9dabb9] text-xs uppercase tracking-wide">Decision</p>
              <p className={`text-3xl font-bold mt-2 ${computed.decision === "GO" ? "text-green-400" : "text-red-400"}`}>
                {computed.decision}
              </p>
              <p className="text-[#9dabb9] text-xs mt-1">Indice qualite: {computed.qualityIndex}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Test Results</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={computed.pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={92}
                      innerRadius={48}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                    >
                      {computed.pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Test Executions Over Time</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={computed.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="exec" name="Tests executes" stroke={CHART_COLORS.lineExec} strokeWidth={2} />
                    <Line type="monotone" dataKey="fail" name="Failures" stroke={CHART_COLORS.lineFail} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">Execution Summary</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computed.stackData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Reussis" stackId="a" fill={CHART_COLORS.passed} />
                  <Bar dataKey="Echoues" stackId="a" fill={CHART_COLORS.failed} />
                  <Bar dataKey="Bloques" stackId="a" fill={CHART_COLORS.blocked} />
                  <Bar dataKey="EnAttente" stackId="a" fill={CHART_COLORS.pending} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Analyse</h4>
              <p className="text-[#cbd5e1] text-sm">Tendance: <span className="text-white font-semibold">{computed.trend}</span></p>
              <p className="text-[#cbd5e1] text-sm mt-1">Indice qualite: <span className="text-white font-semibold">{computed.qualityIndex}</span></p>
              <div className="mt-4 rounded-md bg-[#0f172a] border border-[#334155] p-3">
                <p className="text-[#cbd5e1] text-sm">{computed.observation}</p>
              </div>
            </div>

            <div className="bg-[#1f2a36] border border-[#334155] rounded-lg p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-white font-semibold">Actions recommandees</h4>
                <button
                  onClick={() => {
                    if (showRecommendationsEditor) {
                      setRecommendationsDraft(rapport.recommandations || "");
                    }
                    setShowRecommendationsEditor((prev) => !prev);
                  }}
                  disabled={readOnly || updating}
                  className="px-3 py-1.5 border border-[#3b4754] rounded-md text-white text-sm hover:bg-[#283039] disabled:opacity-50"
                >
                  {showRecommendationsEditor ? "Annuler" : "Modifier"}
                </button>
              </div>
              {showRecommendationsEditor && (
                <div className="mb-4 space-y-2">
                  <textarea
                    value={recommendationsDraft}
                    onChange={(e) => setRecommendationsDraft(e.target.value)}
                    rows={5}
                    placeholder="Saisir les actions recommandees..."
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-md text-white"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onUpdate({
                          recommandations: recommendationsDraft || undefined,
                        })
                      }
                      disabled={updating || readOnly}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                    >
                      {updating ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {computed.recommendations.length > 0 ? (
                  computed.recommendations.map((line, index) => (
                    <p key={`${line}-${index}`} className="text-[#cbd5e1] text-sm">
                      {index + 1}. {line}
                    </p>
                  ))
                ) : (
                  <p className="text-[#9dabb9] text-sm">Aucune recommandation libre.</p>
                )}
                {(rapport.recommandations_qualite || []).map((rec, index) => (
                  <p key={`${rec.id}-${index}`} className="text-[#cbd5e1] text-sm">
                    {computed.recommendations.length + index + 1}. {rec.titre || "Action qualite"} (priorite: {rec.priorite || "moyenne"})
                  </p>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
