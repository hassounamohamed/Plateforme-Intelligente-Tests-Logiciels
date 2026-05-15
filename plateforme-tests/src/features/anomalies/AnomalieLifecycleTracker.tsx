"use client";

import { Anomalie, AnomalieStatut } from "@/types";
import { ANOMALIE_STATUT_LABELS, LIFECYCLE_STEPS, lifecycleStepIndex } from "./constants";

interface AnomalieLifecycleTrackerProps {
  anomalie: Anomalie;
  compact?: boolean;
}

export default function AnomalieLifecycleTracker({
  anomalie,
  compact = false,
}: AnomalieLifecycleTrackerProps) {
  const current = lifecycleStepIndex(anomalie.statut);
  const isReopened = anomalie.statut === "REOUVERT";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center gap-2">
        {LIFECYCLE_STEPS.map((step, index) => {
          const done = index < current || (index === 2 && anomalie.statut === "RESOLU");
          const active = index === current;
          return (
            <div key={step.key} className="flex flex-1 items-center gap-2 min-w-0">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-blue-600 text-white"
                      : "bg-(--surface-2) text-muted-foreground border border-border"
                }`}
                aria-hidden
              >
                {done ? "✓" : index + 1}
              </div>
              <span
                className={`text-xs truncate ${
                  active ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {index < LIFECYCLE_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-4 ${
                    index < current ? "bg-emerald-500/60" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-muted-foreground">
          Statut actuel :{" "}
          <strong className="text-foreground">
            {ANOMALIE_STATUT_LABELS[anomalie.statut as AnomalieStatut]}
          </strong>
        </span>
        {isReopened && (
          <span className="text-orange-400">— réouverte après résolution</span>
        )}
        {anomalie.dateResolution && (
          <span className="text-muted-foreground">
            Résolue le{" "}
            {new Date(anomalie.dateResolution).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>
    </div>
  );
}
