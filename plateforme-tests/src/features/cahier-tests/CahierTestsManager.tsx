"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  CahierTestGlobalDetail,
  StatistiquesCahier,
  AIGeneration,
  ImportExcelResult,
  CahierVersionHistoryItem,
  RapportQA,
} from "@/types";
import {
  getCahierDetail,
  getStatistiques,
  listGenerations,
  genererCahier,
  validerCahier,
  exporterExcel,
  exporterWord,
  exporterPDF,
  importerExcel,
  getCasTestHistory,
  getCahierVersions,
  downloadFile,
} from "./api";
import {
  exporterRapportQAPdf,
  exporterRapportQAWord,
  genererRapportQA,
  getRapportQA,
  updateRapportQA,
} from "@/features/rapports/api";
import { GenererRapportQAPayload, UpdateRapportQAPayload } from "@/types";
import RapportQAPanel from "@/features/rapports/RapportQAPanel";
import CahierStatistiques from "./CahierStatistiques";
import CasTestsTable from "./CasTestsTable";
import GenerationProgress from "./GenerationProgress";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";

interface CahierTestsManagerProps {
  projectId: number;
  projectName?: string;
  readOnly?: boolean;
  canGenerate?: boolean;
  canAssignMember?: boolean;
  showRapportPanel?: boolean;
  rapportOnly?: boolean;
  rapportReadOnly?: boolean;
}

export default function CahierTestsManager({
  projectId,
  projectName,
  readOnly = false,
  canGenerate = true,
  canAssignMember = false,
  showRapportPanel = true,
  rapportOnly = false,
  rapportReadOnly,
}: CahierTestsManagerProps) {
  type CasHistoryTimelineItem = {
    id: number;
    casId: number;
    casRef: string;
    casTitle: string;
    changedAt: string;
    changes: string[];
  };

  const confirmDialog = useConfirmDialog();
  const [cahier, setCahier] = useState<CahierTestGlobalDetail | null>(null);
  const [stats, setStats] = useState<StatistiquesCahier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] =
    useState<AIGeneration | null>(null);
  const [creatingManual, setCreatingManual] = useState(false);
  const [showRegenerateMenu, setShowRegenerateMenu] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<CahierVersionHistoryItem[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("1.0.0");
  const [showHistoryTimeline, setShowHistoryTimeline] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyTimeline, setHistoryTimeline] = useState<CasHistoryTimelineItem[]>([]);
  const [rapport, setRapport] = useState<RapportQA | null>(null);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [generatingRapportMode, setGeneratingRapportMode] = useState<
    "manuelle" | "ai" | null
  >(null);
  const [exportingRapport, setExportingRapport] = useState<
    "pdf" | "word" | null
  >(null);
  const [updatingRapport, setUpdatingRapport] = useState(false);
  const [enableAutoRefresh, setEnableAutoRefresh] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const getExportFileNameBase = () => {
    const rawName = (projectName || `projet_${projectId}`).trim();
    return rawName
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || `projet_${projectId}`;
  };

  const versionOptions = React.useMemo(() => {
    const fromApi = availableVersions.map((item) => item.version);
    const base = cahier?.version ? [cahier.version, ...fromApi] : fromApi;
    return Array.from(new Set(base));
  }, [availableVersions, cahier?.version]);

  const selectedVersionIsCurrent = !cahier || selectedVersion === cahier.version;

  const describeHistoryChanges = (entry: any): string[] => {
    const changes: string[] = [];
    if (entry.old_statut_test !== entry.new_statut_test) {
      changes.push(`Statut: ${entry.old_statut_test || "-"} -> ${entry.new_statut_test || "-"}`);
    }
    if (entry.old_type_test !== entry.new_type_test) {
      changes.push(`Type: ${entry.old_type_test || "-"} -> ${entry.new_type_test || "-"}`);
    }
    if (entry.old_commentaire !== entry.new_commentaire) {
      changes.push("Commentaire mis à jour");
    }
    if (entry.old_bug_titre_correction !== entry.new_bug_titre_correction) {
      changes.push("Titre de correction bug mis à jour");
    }
    if (entry.old_bug_nom_tache !== entry.new_bug_nom_tache) {
      changes.push("Nom de tâche bug mis à jour");
    }

    return changes.length > 0 ? changes : ["Modification du cas de test"];
  };

  const loadHistoryTimeline = async () => {
    if (!cahier) return;

    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const entriesByCase = await Promise.all(
        cahier.cas_tests.map(async (cas) => {
          const entries = await getCasTestHistory(projectId, cahier.id, cas.id);
          return entries.map((entry) => ({
            id: entry.id,
            casId: cas.id,
            casRef: cas.test_ref,
            casTitle: cas.test_case,
            changedAt: entry.changed_at,
            changes: describeHistoryChanges(entry),
          }));
        })
      );

      const merged = entriesByCase
        .flat()
        .sort(
          (a, b) =>
            new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
        );

      setHistoryTimeline(merged);
    } catch (err: any) {
      setHistoryError(
        err?.response?.data?.detail || "Impossible de charger l'historique global."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadCahier = async () => {
    setLoading(true);
    setError(null);
    try {
      const generations = await listGenerations(projectId);
      const activeGeneration = generations.find(
        (generation) =>
          generation.status === "pending" || generation.status === "processing"
      );

      if (activeGeneration) {
        setGenerating(true);
        setCurrentGeneration(activeGeneration);
        setCahier(null);
        setStats(null);
        setRapport(null);
        return;
      }

      setGenerating(false);
      setCurrentGeneration(null);

      const [cahierData, statsData, versionsData] = await Promise.all([
        getCahierDetail(projectId),
        getStatistiques(projectId),
        getCahierVersions(projectId),
      ]);
      setCahier(cahierData);
      setStats(statsData);
      setAvailableVersions(versionsData);
      setSelectedVersion((prev) =>
        versionsData.some((entry) => entry.version === prev) ? prev : cahierData.version
      );
      setHistoryTimeline([]);
      setHistoryError(null);

      setRapportLoading(true);
      try {
        const rapportData = await getRapportQA(projectId, cahierData.id);
        setRapport(rapportData);
      } catch (rapportErr: any) {
        if (rapportErr?.response?.status === 404) {
          setRapport(null);
        } else {
          console.warn("Erreur lors du chargement du rapport QA:", rapportErr);
          setRapport(null);
        }
      } finally {
        setRapportLoading(false);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setCahier(null);
        setStats(null);
        setAvailableVersions([]);
        setRapport(null);
        setError("Aucun cahier de tests disponible pour ce projet.");
      } else {
        setError(
          err.response?.data?.detail || "Erreur lors du chargement du cahier"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCahier();
  }, [projectId]);

  useEffect(() => {
    if (!cahier) return;
    if (!versionOptions.includes(selectedVersion)) {
      setSelectedVersion(cahier.version);
    }
  }, [cahier, selectedVersion, versionOptions]);

  useEffect(() => {
    if (!cahier) return;
    if (!selectedVersionIsCurrent && showHistoryTimeline && historyTimeline.length === 0 && !historyLoading) {
      loadHistoryTimeline();
    }
  }, [
    cahier,
    selectedVersionIsCurrent,
    showHistoryTimeline,
    historyTimeline.length,
    historyLoading,
  ]);

  // Auto-refresh polling to keep UI in sync with backend changes
  useEffect(() => {
    if (!cahier || !enableAutoRefresh) {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
      return;
    }

    // Set up polling interval - refresh every 30 seconds if user story status might have changed
    const interval = setInterval(() => {
      // Only refresh if not currently generating or performing other operations
      if (!generating && !creatingManual && !importing && !rapportLoading) {
        loadCahier();
      }
    }, 30000); // 30 seconds

    setAutoRefreshInterval(interval as any);

    return () => {
      clearInterval(interval);
    };
  }, [cahier, enableAutoRefresh, generating, creatingManual, importing, rapportLoading]);

  const handleGenerate = async () => {
    setShowRegenerateMenu(false);
    setGenerating(true);
    setError(null);
    try {
      const generation = await genererCahier(projectId, { version: "1.0.0" });
      if ("status" in generation) {
        setCurrentGeneration(generation);
      } else {
        setGenerating(false);
        await loadCahier();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Erreur lors du lancement de la génération"
      );
      setGenerating(false);
    }
  };

  const handleCreateManual = async () => {
    setShowRegenerateMenu(false);
    setCreatingManual(true);
    setError(null);
    try {
      await genererCahier(projectId, {
        version: "1.0.0",
        mode_generation: "manuelle",
      });
      await loadCahier();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Erreur lors de la création manuelle"
      );
    } finally {
      setCreatingManual(false);
    }
  };

  const handleGenerationComplete = () => {
    setGenerating(false);
    setCurrentGeneration(null);
    loadCahier();
  };

  const handleGenerateRapport = async (
    mode: "manuelle" | "ai",
    payload?: GenererRapportQAPayload
  ) => {
    if (!cahier) return;
    setGeneratingRapportMode(mode);
    try {
      const rapportData = await genererRapportQA(projectId, cahier.id, {
        mode_generation: mode,
        ...payload,
      });
      setRapport(rapportData);
      alert(
        mode === "ai"
          ? "Rapport QA généré avec IA avec succès."
          : "Rapport QA généré manuellement avec succès."
      );
    } catch (err: any) {
      alert(
        err.response?.data?.detail ||
          "Erreur lors de la génération du rapport QA."
      );
    } finally {
      setGeneratingRapportMode(null);
    }
  };

  const handleUpdateRapport = async (payload: UpdateRapportQAPayload) => {
    if (!cahier || !rapport) return;
    setUpdatingRapport(true);
    try {
      const updated = await updateRapportQA(projectId, cahier.id, payload);
      setRapport(updated);
      alert("Rapport QA modifié avec succès.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors de la modification du rapport QA.");
      throw err;
    } finally {
      setUpdatingRapport(false);
    }
  };

  const handleExportRapport = async (format: "pdf" | "word") => {
    if (!cahier || !rapport) return;
    setExportingRapport(format);
    try {
      const blob =
        format === "pdf"
          ? await exporterRapportQAPdf(projectId, cahier.id)
          : await exporterRapportQAWord(projectId, cahier.id);
      const base = getExportFileNameBase();
      const extension = format === "pdf" ? "pdf" : "docx";
      downloadFile(blob, `rapport_qa_${base}.${extension}`);
    } catch (err: any) {
      alert(
        err.response?.data?.detail ||
          `Erreur lors de l'export ${format.toUpperCase()} du rapport QA.`
      );
    } finally {
      setExportingRapport(null);
    }
  };

  const handleValidate = async () => {
    if (!cahier) return;
    const confirmed = await confirmDialog({
      title: "Valider le cahier de tests",
      description: "Êtes-vous sûr de vouloir valider ce cahier de tests ?",
      confirmText: "Valider",
      cancelText: "Annuler",
    });

    if (!confirmed) return;

    try {
      await validerCahier(projectId, cahier.id, {});
      await loadCahier();
      alert("Cahier validé avec succès !");
    } catch (err: any) {
      alert(
        err.response?.data?.detail || "Erreur lors de la validation du cahier"
      );
    }
  };

  const handleExport = async (format: "excel" | "word" | "pdf") => {
    if (!cahier) return;
    setShowExportMenu(false);
    setExporting(format);
    try {
      let blob: Blob;
      let filename: string;
      const fileNameBase = getExportFileNameBase();

      switch (format) {
        case "excel":
          blob = await exporterExcel(projectId, cahier.id);
          filename = `cahier_tests_${fileNameBase}.xlsx`;
          break;
        case "word":
          blob = await exporterWord(projectId, cahier.id);
          filename = `cahier_tests_${fileNameBase}.docx`;
          break;
        case "pdf":
          blob = await exporterPDF(projectId, cahier.id);
          filename = `cahier_tests_${fileNameBase}.pdf`;
          break;
      }

      downloadFile(blob, filename);
    } catch (err: any) {
      alert(err.response?.data?.detail || `Erreur lors de l'export ${format}`);
    } finally {
      setExporting(null);
    }
  };

  const handleImportClick = () => {
    if (!cahier || importing) return;
    importInputRef.current?.click();
  };

  const formatImportSummary = (result: ImportExcelResult): string => {
    const lines = [
      `Import terminé.`,
      `- Lignes importées: ${result.imported_count}`,
      `- Lignes ignorées: ${result.skipped_count}`,
      `- Lignes en erreur: ${result.error_count}`,
    ];

    if (result.skipped_refs.length > 0) {
      lines.push(`Cas ignorés (non assignés/vides): ${result.skipped_refs.slice(0, 10).join(", ")}`);
    }

    if (result.errors.length > 0) {
      lines.push("Erreurs:");
      result.errors.slice(0, 8).forEach((err) => lines.push(`• ${err}`));
    }

    return lines.join("\n");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !cahier) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      alert("Veuillez sélectionner un fichier Excel .xlsx");
      return;
    }

    setImporting(true);
    try {
      const result = await importerExcel(projectId, cahier.id, file);
      await loadCahier();
      alert(formatImportSummary(result));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors de l'import Excel");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (generating && currentGeneration) {
    return (
      <GenerationProgress
        projectId={projectId}
        generationId={currentGeneration.id}
        onComplete={handleGenerationComplete}
      />
    );
  }

  if (error && !cahier) {
    return (
      <div className="bg-surface-dark rounded-lg border border-[#3b4754] p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Aucun cahier de tests
          </h3>
          <p className="text-[#9dabb9] mb-6">{error}</p>
          {canGenerate && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={handleGenerate}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                🤖 Générer le Cahier avec l'IA
              </button>
              <button
                onClick={handleCreateManual}
                disabled={creatingManual}
                className="px-6 py-3 border border-[#3b4754] text-white rounded-md hover:bg-[#283039] font-medium disabled:opacity-60"
              >
                {creatingManual ? "Création..." : "✍️ Créer manuellement"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      {!rapportOnly && (
      <div className="bg-surface-dark rounded-lg border border-[#3b4754] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Cahier de Tests Global
            </h2>
            <p className="text-[#9dabb9] mt-1">
              Version {cahier?.version} •{" "}
              <span
                className={`font-medium ${
                  cahier?.statut === "valide"
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                {cahier?.statut}
              </span>
            </p>
            <div className="mt-3 flex items-center gap-3">
              <label htmlFor="cahier-tests-version-select" className="text-sm text-[#9dabb9]">
                Versions:
              </label>
              <select
                id="cahier-tests-version-select"
                value={selectedVersion}
                onChange={(e) => {
                  setSelectedVersion(e.target.value);
                  setShowHistoryTimeline(e.target.value !== cahier?.version);
                }}
                className="px-3 py-1.5 rounded-md bg-[#1f2731] border border-[#3b4754] text-white text-sm"
              >
                {versionOptions.map((version) => (
                  <option key={version} value={version}>
                    v{version}
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  setShowHistoryTimeline((prev) => !prev);
                  if (!showHistoryTimeline && historyTimeline.length === 0 && !historyLoading) {
                    await loadHistoryTimeline();
                  }
                }}
                className="px-3 py-1.5 border border-[#3b4754] rounded-md text-white text-sm hover:bg-[#283039]"
              >
                {showHistoryTimeline ? "Masquer historique" : "Voir historique"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!readOnly && (
              <>
                <input
                  ref={importInputRef}
                  id="cahier-tests-import-excel"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleImportFile}
                  className="hidden"
                  aria-label="Importer un fichier Excel .xlsx pour le cahier de tests"
                />
                <button
                  onClick={handleImportClick}
                  disabled={!cahier || importing}
                  className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039] font-medium disabled:opacity-50"
                >
                  {importing ? "⏳ Import..." : "📤 Import Excel"}
                </button>
              </>
            )}

            {/* Bouton Regénérer - uniquement pour les testeurs */}
            {canGenerate && (
              <div className="relative">
                <button
                  onClick={() => setShowRegenerateMenu(!showRegenerateMenu)}
                  className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039] font-medium"
                >
                   Regénérer
                </button>
                {showRegenerateMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowRegenerateMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-surface-dark rounded-md shadow-lg z-20 border border-[#3b4754]">
                      <button
                        onClick={handleGenerate}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#283039]"
                      >
                         Regénérer avec l'IA
                      </button>
                      <button
                        onClick={handleCreateManual}
                        disabled={creatingManual}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#283039] disabled:opacity-50"
                      >
                        {creatingManual
                          ? "⏳ Création manuelle..."
                          : "✍️ Régénérer en manuel"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Bouton Valider - uniquement pour les testeurs */}
            {canGenerate && cahier?.statut === "brouillon" && (
              <button
                onClick={handleValidate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                ✓ Valider
              </button>
            )}

            {/* Menu Export */}
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                 Exporter
              </button>
              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-40 bg-surface-dark rounded-md shadow-lg z-20 border border-[#3b4754]">
                    <button
                      onClick={() => handleExport("excel")}
                      disabled={!!exporting}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#283039] disabled:opacity-50"
                    >
                      {exporting === "excel" ? "⏳ Export..." : "📊 Excel"}
                    </button>
                    <button
                      onClick={() => handleExport("word")}
                      disabled={!!exporting}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#283039] disabled:opacity-50"
                    >
                      {exporting === "word" ? "⏳ Export..." : "📝 Word"}
                    </button>
                    <button
                      onClick={() => handleExport("pdf")}
                      disabled={!!exporting}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#283039] disabled:opacity-50"
                    >
                      {exporting === "pdf" ? "⏳ Export..." : "📄 PDF"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {!rapportOnly && cahier && !selectedVersionIsCurrent && (
        <div className="bg-[#101722] border border-[#3b4754] rounded-lg p-4">
          <p className="text-sm text-[#d6e3f0]">
            Vous consultez la version <span className="font-semibold">v{selectedVersion}</span> en mode historique.
            Le projet conserve un cahier actif ({`v${cahier.version}`}) et l'historique des modifications des cas de test.
          </p>
        </div>
      )}

      {!rapportOnly && showHistoryTimeline && (
        <div className="bg-surface-dark rounded-lg border border-[#3b4754] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">Historique des modifications</h3>
            <button
              onClick={loadHistoryTimeline}
              disabled={historyLoading}
              className="px-3 py-1.5 border border-[#3b4754] rounded-md text-sm text-white hover:bg-[#283039] disabled:opacity-60"
            >
              {historyLoading ? "Chargement..." : "Rafraîchir"}
            </button>
          </div>

          {historyError && (
            <div className="text-sm text-red-400">{historyError}</div>
          )}

          {!historyLoading && !historyError && historyTimeline.length === 0 && (
            <div className="text-sm text-[#9dabb9]">Aucune modification historique trouvée.</div>
          )}

          {!historyLoading && historyTimeline.length > 0 && (
            <div className="space-y-3 max-h-95 overflow-y-auto pr-1">
              {historyTimeline.map((item) => (
                <div
                  key={`${item.casId}-${item.id}`}
                  className="rounded-md border border-[#2e3945] bg-[#111924] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white font-medium">
                      {item.casRef} - {item.casTitle}
                    </p>
                    <p className="text-xs text-[#9dabb9]">
                      {new Date(item.changedAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[#c4d2df]">{item.changes.join(" • ")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rapport QA */}
      {showRapportPanel && cahier && (
        <RapportQAPanel
          projectId={projectId}
          projectName={projectName}
          cahierId={cahier.id}
          cahierName={`Cahier de Tests v${cahier.version}`}
          rapport={rapport}
          loading={rapportLoading}
          canGenerate={canGenerate}
          readOnly={rapportReadOnly ?? readOnly}
          generatingMode={generatingRapportMode}
          exporting={exportingRapport}
          updating={updatingRapport}
          onGenerate={handleGenerateRapport}
          onUpdate={handleUpdateRapport}
          onExport={handleExportRapport}
        />
      )}

      {/* Statistiques */}
      {!rapportOnly && stats && <CahierStatistiques stats={stats} />}

      {/* Tableau des cas de tests */}
      {!rapportOnly && cahier && (
        <CasTestsTable
          projectId={projectId}
          cahierId={cahier.id}
          casTests={cahier.cas_tests}
          onRefresh={loadCahier}
          readOnly={readOnly}
          canAssignMember={canAssignMember}
        />
      )}
    </div>
  );
}
