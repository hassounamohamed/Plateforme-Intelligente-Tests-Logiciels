"use client";

import React from "react";
import { StatistiquesCahier } from "@/types";

interface CahierStatistiquesProps {
  stats: StatistiquesCahier;
}

export default function CahierStatistiques({ stats }: CahierStatistiquesProps) {
  const completionRate =
    stats.nombre_total > 0 ? (stats.nombre_reussi / stats.nombre_total) * 100 : 0;

  return (
    <div className="bg-surface-dark rounded-lg border border-[#3b4754] p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Statistiques du Cahier (v{stats.version})
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white">
            {stats.nombre_total}
          </div>
          <div className="text-sm text-[#9dabb9] mt-1">Total</div>
        </div>

        {/* Réussi */}
        <div className="text-center">
          <div className="text-3xl font-bold text-green-500">
            {stats.nombre_reussi}
          </div>
          <div className="text-sm text-[#9dabb9] mt-1">
            Réussi ({stats.pct_reussi.toFixed(1)}%)
          </div>
        </div>

        {/* Échoué */}
        <div className="text-center">
          <div className="text-3xl font-bold text-red-500">
            {stats.nombre_echoue}
          </div>
          <div className="text-sm text-[#9dabb9] mt-1">
            Échoué ({stats.pct_echoue.toFixed(1)}%)
          </div>
        </div>

        {/* Bloqué */}
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-500">
            {stats.nombre_bloque}
          </div>
          <div className="text-sm text-[#9dabb9] mt-1">
            Bloqué ({stats.pct_bloque.toFixed(1)}%)
          </div>
        </div>

        {/* Non exécuté */}
        <div className="text-center">
          <div className="text-3xl font-bold text-[#9dabb9]">
            {stats.nombre_non_execute}
          </div>
          <div className="text-sm text-[#9dabb9] mt-1">
            Non exécuté ({stats.pct_non_execute.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-white">Progression</span>
          <span className="font-medium text-white">
            {completionRate.toFixed(1)}% terminé
          </span>
        </div>
        <div className="w-full bg-[#283039] rounded-full h-4 overflow-hidden">
          <div className="flex h-full">
            {/* Réussi */}
            <div
              className="bg-green-500"
              style={{ width: `${stats.pct_reussi}%` }}
            />
            {/* Échoué */}
            <div
              className="bg-red-500"
              style={{ width: `${stats.pct_echoue}%` }}
            />
            {/* Bloqué */}
            <div
              className="bg-orange-500"
              style={{ width: `${stats.pct_bloque}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
