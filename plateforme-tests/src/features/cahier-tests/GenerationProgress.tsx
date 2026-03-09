"use client";

import React, { useEffect, useState } from "react";
import { AIGenerationDetail } from "@/types";
import { getGeneration } from "./api";

interface GenerationProgressProps {
  projectId: number;
  generationId: number;
  onComplete: () => void;
}

export default function GenerationProgress({
  projectId,
  generationId,
  onComplete,
}: GenerationProgressProps) {
  const [generation, setGeneration] = useState<AIGenerationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchProgress = async () => {
      try {
        const data = await getGeneration(projectId, generationId);
        setGeneration(data);
        setLoading(false);

        // Si terminé ou échoué, arrêter le polling
        if (data.status === "completed") {
          if (interval) clearInterval(interval);
          setTimeout(onComplete, 1000); // Délai pour laisser voir 100%
        } else if (data.status === "failed") {
          if (interval) clearInterval(interval);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la progression:", error);
        setLoading(false);
      }
    };

    // Premier chargement
    fetchProgress();

    // Polling toutes les 2 secondes
    interval = setInterval(fetchProgress, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [projectId, generationId, onComplete]);

  if (loading || !generation) {
    return (
      <div className="bg-surface-dark rounded-lg border border-[#3b4754] p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-[#9dabb9]">Chargement de la progression...</p>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (generation.status) {
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "processing":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = () => {
    switch (generation.status) {
      case "pending":
        return "En attente...";
      case "processing":
        return "Génération en cours...";
      case "completed":
        return "✓ Génération terminée !";
      case "failed":
        return "✗ Échec de la génération";
      default:
        return generation.status;
    }
  };

  return (
    <div className="bg-surface-dark rounded-lg border border-[#3b4754] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Génération du Cahier de Tests</h3>
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-white">Progression</span>
          <span className="font-medium text-white">{generation.progress}%</span>
        </div>
        <div className="w-full bg-[#283039] rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              generation.status === "failed"
                ? "bg-red-500"
                : generation.status === "completed"
                ? "bg-green-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${generation.progress}%` }}
          />
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-white mb-3">
          Étapes de génération
        </h4>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {generation.logs && generation.logs.length > 0 ? (
            generation.logs.map((log, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 text-sm p-2 bg-[#283039] rounded"
              >
                <span className="text-blue-500 font-medium w-15">
                  {log.progress}%
                </span>
                <div className="flex-1">
                  <p className="text-white">{log.message}</p>
                  <p className="text-xs text-[#9dabb9] mt-1">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[#9dabb9] text-sm">Aucun log disponible</p>
          )}
        </div>
      </div>

      {/* Message d'erreur */}
      {generation.status === "failed" && (
        <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-sm text-red-700">
            La génération a échoué. Consultez les logs ci-dessus pour plus de détails.
          </p>
        </div>
      )}
    </div>
  );
}
