"use client";

import React, { useState, useEffect } from "react";
import {
  CahierTestGlobalDetail,
  StatistiquesCahier,
  AIGeneration,
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
  downloadFile,
} from "./api";
import CahierStatistiques from "./CahierStatistiques";
import CasTestsTable from "./CasTestsTable";
import GenerationProgress from "./GenerationProgress";

interface CahierTestsManagerProps {
  projectId: number;
  readOnly?: boolean;
  canGenerate?: boolean;
}

export default function CahierTestsManager({
  projectId,
  readOnly = false,
  canGenerate = true,
}: CahierTestsManagerProps) {
  const [cahier, setCahier] = useState<CahierTestGlobalDetail | null>(null);
  const [stats, setStats] = useState<StatistiquesCahier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] =
    useState<AIGeneration | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const loadCahier = async () => {
    setLoading(true);
    setError(null);
    try {
      const generations = await listGenerations(projectId);
      const activeGeneration = generations.find(
        (generation) =>
          generation.status === "pending" || generation.status === "processing"
      );
      const hasCompletedGeneration = generations.some(
        (generation) => generation.status === "completed"
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

      if (!hasCompletedGeneration) {
        setCahier(null);
        setStats(null);
        setError("Aucun cahier de tests disponible pour ce projet.");
        return;
      }

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
    setGenerating(true);
    setError(null);
    try {
      const generation = await genererCahier(projectId, { version: "1.0.0" });
      setCurrentGeneration(generation);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Erreur lors du lancement de la génération"
      );
      setGenerating(false);
    }
  };

  const handleGenerationComplete = () => {
    setGenerating(false);
    setCurrentGeneration(null);
    loadCahier();
  };

  const handleValidate = async () => {
    if (!cahier) return;
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir valider ce cahier de tests ?"
      )
    )
      return;

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

      switch (format) {
        case "excel":
          blob = await exporterExcel(projectId, cahier.id);
          filename = `cahier_tests_projet_${projectId}.xlsx`;
          break;
        case "word":
          blob = await exporterWord(projectId, cahier.id);
          filename = `cahier_tests_projet_${projectId}.docx`;
          break;
        case "pdf":
          blob = await exporterPDF(projectId, cahier.id);
          filename = `cahier_tests_projet_${projectId}.pdf`;
          break;
      }

      downloadFile(blob, filename);
    } catch (err: any) {
      alert(err.response?.data?.detail || `Erreur lors de l'export ${format}`);
    } finally {
      setExporting(null);
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
            <button
              onClick={handleGenerate}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              🤖 Générer le Cahier avec l'IA
            </button>
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
            {/* Bouton Regénérer - uniquement pour les testeurs */}
            {canGenerate && (
              <button
                onClick={handleGenerate}
                className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039] font-medium"
              >
                🔄 Regénérer
              </button>
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
        />
      )}
    </div>
  );
}
