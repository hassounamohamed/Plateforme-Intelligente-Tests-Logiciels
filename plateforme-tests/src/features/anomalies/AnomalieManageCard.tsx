"use client";

import { Anomalie } from "@/types";
import AnomalieLifecycleTracker from "./AnomalieLifecycleTracker";
import {
  ANOMALIE_STATUT_LABELS,
  isDeveloperRole,
  severiteTextClass,
  statutBadgeClass,
} from "./constants";
import type { AssignableMember } from "./CreateAnomalieForm";

interface AnomalieManageCardProps {
  anomalie: Anomalie;
  developers: AssignableMember[];
  readOnly?: boolean;
  saving?: boolean;
  onAssign: (anomalieId: number, developerId: number) => void;
  onResolve: (anomalieId: number) => void;
  onReopen: (anomalieId: number) => void;
}

export default function AnomalieManageCard({
  anomalie,
  developers,
  readOnly = false,
  saving = false,
  onAssign,
  onResolve,
  onReopen,
}: AnomalieManageCardProps) {
  const devList = developers.filter((d) => isDeveloperRole(d.role_code));

  return (
    <article className="rounded-lg border border-border bg-surface-dark p-4 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{anomalie.titre}</p>
          {anomalie.cas_test_ref && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {anomalie.cas_test_ref}
              {anomalie.cas_test_titre ? ` — ${anomalie.cas_test_titre}` : ""}
            </p>
          )}
          {anomalie.description && (
            <p className="text-sm text-muted-foreground mt-2">{anomalie.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded ${statutBadgeClass(anomalie.statut)}`}>
            {ANOMALIE_STATUT_LABELS[anomalie.statut]}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded bg-(--surface-2) ${severiteTextClass(anomalie.severite)}`}
          >
            {anomalie.severite}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-(--surface-2) text-muted-foreground">
            {anomalie.priorite}
          </span>
        </div>
      </header>

      <AnomalieLifecycleTracker anomalie={anomalie} compact />

      <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border pt-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {anomalie.reporter_nom && <span>Signalée par {anomalie.reporter_nom}</span>}
          <span>Créée le {new Date(anomalie.dateCreation).toLocaleDateString("fr-FR")}</span>
          {anomalie.assigned_nom ? (
            <span className="text-foreground">Assignée à {anomalie.assigned_nom}</span>
          ) : (
            <span>Non assignée</span>
          )}
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {anomalie.statut !== "RESOLU" && (
              <>
                {devList.length > 0 && (
                  <select
                    id={`assign-dev-${anomalie.id}`}
                    aria-label={`Assigner l'anomalie ${anomalie.titre} à un développeur`}
                    className="text-xs px-2 py-1.5 bg-(--surface-2) border border-border text-foreground rounded-md"
                    value={anomalie.assignedTo ?? ""}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      if (id) onAssign(anomalie.id, id);
                    }}
                    disabled={saving}
                  >
                    <option value="" disabled>
                      Assigner un dev…
                    </option>
                    {devList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => onResolve(anomalie.id)}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                >
                  Marquer résolue
                </button>
              </>
            )}
            {anomalie.statut === "RESOLU" && (
              <button
                type="button"
                onClick={() => onReopen(anomalie.id)}
                disabled={saving}
                className="text-xs px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-(--surface-2)"
              >
                Réouvrir
              </button>
            )}
          </div>
        )}
      </footer>
    </article>
  );
}
