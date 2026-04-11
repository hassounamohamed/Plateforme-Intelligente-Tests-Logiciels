"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  CahierTestGlobalDetail,
  StatistiquesCahier,
  AIGeneration,
  ImportExcelResult,
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
  downloadFile,
} from "./api";
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
}

export default function CahierTestsManager({
  projectId,
  projectName,
  readOnly = false,
  canGenerate = true,
  canAssignMember = false,
}: CahierTestsManagerProps) {
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
        return;
      }

      setGenerating(false);
      setCurrentGeneration(null);

      const [cahierData, statsData] = await Promise.all([
        getCahierDetail(projectId),
        getStatistiques(projectId),
      ]);
      setCahier(cahierData);
      setStats(statsData);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setCahier(null);
        setStats(null);
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
          </div>

          <div className="flex items-center gap-3">
            {!readOnly && (
              <>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleImportFile}
                  className="hidden"
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
                  🔄 Regénérer
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
                        🤖 Regénérer avec l'IA
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
                📥 Exporter
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

      {/* Statistiques */}
      {stats && <CahierStatistiques stats={stats} />}

      {/* Tableau des cas de tests */}
      {cahier && (
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
