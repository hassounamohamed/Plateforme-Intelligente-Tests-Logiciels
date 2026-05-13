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

import { Modal } from "@/components/Modal";
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
  onUpdate: (payload: UpdateRapportQAPayload) => void | Promise<void>;
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
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editSaving, setEditSaving] = React.useState(false);
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

  const chartGridStroke = "var(--border)";
  const chartAxisStroke = "var(--muted)";

  const btnPrimary =
    "rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50";
  const btnSecondary =
    "rounded-md border border-border px-4 py-2 font-medium text-foreground transition-colors hover:bg-(--surface-2) disabled:opacity-50 dark:border-[#3b4754] dark:text-white dark:hover:bg-[#283039]";

  const aiGenerationActive = generatingMode === "ai";
  const manualGenerationActive =
    generatingMode === "manuelle" || (!aiGenerationActive && showManualForm);

  const rapportStatutOk = ((rapport?.statut || "") as string).toLowerCase() === "valide";

  const handleSaveEdit = React.useCallback(async () => {
    if (!rapport) return;
    setEditSaving(true);
    try {
      await onUpdate({
        version: editVersion || undefined,
        statut: editStatut || undefined,
        recommandations: editRecommandations || undefined,
      });
      setEditModalOpen(false);
    } catch {
      /* erreur affichee par le parent */
    } finally {
      setEditSaving(false);
    }
  }, [rapport, editVersion, editStatut, editRecommandations, onUpdate]);

  const btnOutlineAction =
    "inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-(--surface-2) disabled:opacity-50 dark:border-[#3b4754] dark:hover:bg-[#283039]";

  return (
    <div className="space-y-4">
      {!loading && (canGenerate || rapport) && (
        <div className="rounded-2xl border border-border bg-linear-to-br from-(--surface-2) via-background to-(--surface-2) p-4 shadow-md ring-1 ring-border/50 dark:from-[#1a222c] dark:via-[#151b24] dark:to-[#1a222c] dark:ring-white/10">
          <div className="flex flex-col gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              {rapport && canGenerate && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Si la derniere generation ne convient pas, utilisez{" "}
                  <span className="font-semibold text-foreground">Regenerer</span> ci-dessous (manuel ou IA).
                </p>
              )}
              {!rapport && canGenerate && (
                <p className="text-sm text-muted-foreground">
                  Aucun rapport pour ce cahier. Generez une premiere version (manuel ou IA).
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {canGenerate && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/80 p-1.5 shadow-inner dark:bg-background/40">
                    {rapport && (
                      <span className="hidden px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:inline">
                        Regenerer
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowManualForm((prev) => !prev)}
                      disabled={generatingMode !== null || readOnly}
                      className={manualGenerationActive ? btnPrimary : btnSecondary}
                    >
                      {generatingMode === "manuelle" ? "Generation..." : "Generer manuelle"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualForm(false);
                        onGenerate("ai");
                      }}
                      disabled={generatingMode !== null || readOnly}
                      className={aiGenerationActive ? btnPrimary : btnSecondary}
                    >
                      {generatingMode === "ai" ? "Generation IA..." : "Generer avec IA"}
                    </button>
                  </div>
                )}
                {rapport && !readOnly && (
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(true)}
                    disabled={updating}
                    className={btnOutlineAction}
                  >
                    <span className="material-symbols-outlined text-[20px]">edit_document</span>
                    Modifier le rapport
                  </button>
                )}
                {rapport && (
                  <>
                    <button
                      type="button"
                      onClick={() => onExport("pdf")}
                      disabled={exporting !== null}
                      className={btnOutlineAction}
                    >
                      <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                      {exporting === "pdf" ? "Export..." : "Export PDF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onExport("word")}
                      disabled={exporting !== null}
                      className={btnOutlineAction}
                    >
                      <span className="material-symbols-outlined text-[20px]">description</span>
                      {exporting === "word" ? "Export..." : "Export Word"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showManualForm && canGenerate && (
        <div className="space-y-3 rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#334155] dark:bg-[#1f2a36]">
          <h4 className="font-semibold text-foreground">Generation manuelle</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="rapport-qa-manual-version" className="text-xs text-muted-foreground">
                Version (optionnel)
              </label>
              <input
                id="rapport-qa-manual-version"
                value={manualVersion}
                onChange={(e) => setManualVersion(e.target.value)}
                placeholder="Ex: 1.5.0"
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-[#334155] dark:bg-[#0f172a]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="rapport-qa-manual-recommandations" className="text-xs text-muted-foreground">
              Recommandations manuelles
            </label>
            <textarea
              id="rapport-qa-manual-recommandations"
              value={manualRecommandations}
              onChange={(e) => setManualRecommandations(e.target.value)}
              rows={4}
              placeholder="Saisir les recommandations manuelles..."
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-[#334155] dark:bg-[#0f172a]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onGenerate("manuelle", {
                  version: manualVersion || undefined,
                  recommandations: manualRecommandations || undefined,
                })
              }
              disabled={generatingMode !== null}
              className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Confirmer generation manuelle
            </button>
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="rounded-md border border-border px-4 py-2 text-foreground transition-colors hover:bg-(--surface) dark:border-[#334155] dark:text-white dark:hover:bg-[#283039]"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-dark p-6 space-y-6">
        <div className="flex flex-col gap-4 border-b border-border/80 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-foreground">
                Rapport QA {rapport?.version ? `v${rapport.version}` : ""}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Projet: {projectName || `Projet ${projectId}`} • Cahier: {cahierName || `Cahier ${cahierId}`}
                {rapport ? ` • Mis à jour ${formatDate(rapport.dateGeneration)}` : ""}
              </p>
            </div>
            {rapport && !loading && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    rapportStatutOk
                      ? "bg-green-500/15 text-green-800 dark:text-green-300"
                      : "bg-amber-500/12 text-amber-900 dark:text-amber-200"
                  }`}
                >
                  {rapport.statut || "brouillon"}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    computed.decision === "GO"
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                      : "bg-red-500/12 text-red-800 dark:text-red-200"
                  }`}
                >
                  Release {computed.decision}
                </span>
              </div>
            )}
          </div>
          {rapport && !loading && !rapportStatutOk && (
            <p className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-sm leading-relaxed text-muted-foreground">
              Quand le contenu vous convient, ouvrez <strong className="text-foreground">Modifier le rapport</strong> et
              passez le statut à <strong className="text-foreground">Valide</strong> : la décision de release devient{" "}
              <strong className="text-foreground">GO</strong> et une notification est envoyée aux membres du projet.
            </p>
          )}
          {rapport && !loading && rapportStatutOk && (
            <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm font-medium text-green-900 dark:text-green-100">
              Rapport validé : release <span className="font-bold">GO</span>. Les membres du projet ont été notifiés.
            </p>
          )}
        </div>

        {loading ? (
        <div className="flex h-52 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : !rapport ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">Aucun rapport QA genere pour ce cahier.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#334155] dark:bg-[#1f2a36]">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Test Coverage</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{toPercent(computed.coverage)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {computed.executed} / {computed.total} tests
              </p>
            </div>
            <div className="rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#334155] dark:bg-[#1f2a36]">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pass Rate</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{toPercent(computed.passRate)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Passed: {computed.passed}</p>
            </div>
            <div className="rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#334155] dark:bg-[#1f2a36]">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Failed Tests</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{computed.failed}</p>
              <p className="mt-1 text-xs text-muted-foreground">Critical: {computed.critical}</p>
            </div>
            <div className="rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#334155] dark:bg-[#1f2a36]">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Decision</p>
              <p
                className={`mt-2 text-3xl font-bold ${computed.decision === "GO" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {computed.decision}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Indice qualite: {computed.qualityIndex}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#334155] dark:bg-[#1f2a36]">
              <h4 className="mb-3 font-semibold text-foreground">Test Results</h4>
              <div className="h-64 [&_.recharts-cartesian-axis-tick-value]:fill-foreground [&_.recharts-legend-item-text]:fill-foreground [&_.recharts-pie-label-text]:fill-foreground">
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#334155] dark:bg-[#1f2a36]">
              <h4 className="mb-3 font-semibold text-foreground">Test Executions Over Time</h4>
              <div className="h-64 [&_.recharts-cartesian-axis-tick-value]:fill-foreground [&_.recharts-legend-item-text]:fill-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={computed.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                    <XAxis dataKey="label" stroke={chartAxisStroke} />
                    <YAxis stroke={chartAxisStroke} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="exec" name="Tests executes" stroke={CHART_COLORS.lineExec} strokeWidth={2} />
                    <Line type="monotone" dataKey="fail" name="Failures" stroke={CHART_COLORS.lineFail} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#334155] dark:bg-[#1f2a36]">
            <h4 className="mb-3 font-semibold text-foreground">Execution Summary</h4>
            <div className="h-56 [&_.recharts-cartesian-axis-tick-value]:fill-foreground [&_.recharts-legend-item-text]:fill-foreground">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computed.stackData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                  <XAxis dataKey="name" stroke={chartAxisStroke} />
                  <YAxis stroke={chartAxisStroke} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Reussis" stackId="a" fill={CHART_COLORS.passed} />
                  <Bar dataKey="Echoues" stackId="a" fill={CHART_COLORS.failed} />
                  <Bar dataKey="Bloques" stackId="a" fill={CHART_COLORS.blocked} />
                  <Bar dataKey="EnAttente" stackId="a" fill={CHART_COLORS.pending} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#334155] dark:bg-[#1f2a36]">
              <h4 className="mb-3 font-semibold text-foreground">Analyse</h4>
              <p className="text-sm text-muted-foreground">
                Tendance: <span className="font-semibold text-foreground">{computed.trend}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Indice qualite: <span className="font-semibold text-foreground">{computed.qualityIndex}</span>
              </p>
              <div className="mt-4 rounded-md border border-border bg-muted/25 p-3 dark:bg-[#0f172a] dark:border-[#334155]">
                <p className="text-sm text-muted-foreground">{computed.observation}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#334155] dark:bg-[#1f2a36]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="font-semibold text-foreground">Actions recommandees</h4>
                <button
                  onClick={() => {
                    if (showRecommendationsEditor) {
                      setRecommendationsDraft(rapport.recommandations || "");
                    }
                    setShowRecommendationsEditor((prev) => !prev);
                  }}
                  disabled={readOnly || updating}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-(--surface) disabled:opacity-50 dark:border-[#3b4754] dark:text-white dark:hover:bg-[#283039]"
                >
                  {showRecommendationsEditor ? "Annuler" : "Modifier"}
                </button>
              </div>
              {showRecommendationsEditor && (
                <div className="mb-4 space-y-2">
                  <label htmlFor="rapport-qa-recommendations-draft" className="sr-only">
                    Actions recommandees (edition)
                  </label>
                  <textarea
                    id="rapport-qa-recommendations-draft"
                    value={recommendationsDraft}
                    onChange={(e) => setRecommendationsDraft(e.target.value)}
                    rows={5}
                    placeholder="Saisir les actions recommandees..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-[#334155] dark:bg-[#0f172a]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onUpdate({
                          recommandations: recommendationsDraft || undefined,
                        })
                      }
                      disabled={updating || readOnly}
                      className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {updating ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {computed.recommendations.length > 0 ? (
                  computed.recommendations.map((line, index) => (
                    <p key={`${line}-${index}`} className="text-sm text-muted-foreground">
                      {index + 1}. {line}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune recommandation libre.</p>
                )}
                {(rapport.recommandations_qualite || []).map((rec, index) => (
                  <p key={`${rec.id}-${index}`} className="text-sm text-muted-foreground">
                    {computed.recommendations.length + index + 1}. {rec.titre || "Action qualite"} (priorite:{" "}
                    {rec.priorite || "moyenne"})
                  </p>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      </div>

      <Modal
        isOpen={editModalOpen && !!rapport}
        onClose={() => {
          if (!editSaving) setEditModalOpen(false);
        }}
        title="Modifier le rapport QA"
        size="md"
      >
        {rapport && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSaveEdit();
            }}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="rapport-qa-edit-version" className="text-xs text-muted-foreground">
                  Version
                </label>
                <input
                  id="rapport-qa-edit-version"
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-[#334155] dark:bg-[#0f172a]"
                />
              </div>
              <div>
                <label htmlFor="rapport-qa-edit-statut" className="text-xs text-muted-foreground">
                  Statut
                </label>
                <select
                  id="rapport-qa-edit-statut"
                  value={editStatut}
                  onChange={(e) => setEditStatut(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-[#334155] dark:bg-[#0f172a]"
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="valide">Valide</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="rapport-qa-edit-recommandations" className="text-xs text-muted-foreground">
                Recommandations
              </label>
              <textarea
                id="rapport-qa-edit-recommandations"
                value={editRecommandations}
                onChange={(e) => setEditRecommandations(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-[#334155] dark:bg-[#0f172a]"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Passer le statut à <strong className="text-foreground">Valide</strong> lorsque le rapport est prêt : la
              décision de release devient <strong className="text-foreground">GO</strong> et les membres du projet
              reçoivent une notification.
            </p>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => !editSaving && setEditModalOpen(false)}
                disabled={editSaving}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-(--surface-2) disabled:opacity-50 dark:border-[#334155]"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={updating || editSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {updating || editSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
