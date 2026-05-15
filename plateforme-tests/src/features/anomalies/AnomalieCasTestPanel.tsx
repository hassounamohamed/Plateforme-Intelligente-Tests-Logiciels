"use client";

import { useCallback, useEffect, useState } from "react";
import { CasTest } from "@/types";
import { getAssignableMembers } from "@/features/cahier-tests/api";
import { createAnomalie, listAnomaliesCasTest } from "./api";
import CreateAnomalieForm from "./CreateAnomalieForm";
import type { AssignableMember } from "./CreateAnomalieForm";
import { CreateAnomaliePayload } from "@/types";
import { ANOMALIE_STATUT_LABELS, severiteTextClass, statutBadgeClass } from "./constants";

interface AnomalieCasTestPanelProps {
  projectId: number;
  cahierId: number;
  casTest: CasTest;
  readOnly?: boolean;
  canCreate?: boolean;
  refreshKey?: number;
}

function isBugStatut(statut: string): boolean {
  return statut === "Échoué" || statut === "Bloqué";
}

export default function AnomalieCasTestPanel({
  projectId,
  cahierId,
  casTest,
  readOnly = false,
  canCreate = false,
  refreshKey = 0,
}: AnomalieCasTestPanelProps) {
  const [anomalies, setAnomalies] = useState<Awaited<ReturnType<typeof listAnomaliesCasTest>>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<AssignableMember[]>([]);
  const [showForm, setShowForm] = useState(false);

  const persistedBug = isBugStatut(casTest.statut_test);
  const allowCreate = canCreate && persistedBug && !readOnly;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAnomaliesCasTest(projectId, cahierId, casTest.id);
      setAnomalies(data);
    } catch {
      setError("Impossible de charger les anomalies.");
    } finally {
      setLoading(false);
    }
  }, [projectId, cahierId, casTest.id]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (!allowCreate) return;
    getAssignableMembers(projectId, cahierId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [projectId, cahierId, allowCreate]);

  const handleCreate = async (payload: CreateAnomaliePayload) => {
    setSaving(true);
    setError(null);
    try {
      await createAnomalie(projectId, cahierId, casTest.id, payload);
      setShowForm(false);
      await load();
      window.alert("Anomalie créée avec succès.");
    } catch {
      setError("Impossible de créer l'anomalie.");
    } finally {
      setSaving(false);
    }
  };

  if (!isBugStatut(casTest.statut_test) && anomalies.length === 0) {
    return null;
  }

  return (
    <section className="border border-orange-500/40 rounded-lg p-4 bg-orange-500/5 space-y-4">
      {/* En-tête */}
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-400">bug_report</span>
          <h3 className="text-sm font-semibold text-foreground">Anomalies liées au cas</h3>
          <span className="text-xs text-muted-foreground">({anomalies.length})</span>
        </div>

        {allowCreate && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
              bg-orange-500/20 hover:bg-orange-500/30 text-orange-300
              border border-orange-500/40 rounded-md transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Créer une anomalie
          </button>
        )}
      </header>

      {/* Avertissement si pas encore en statut bug */}
      {!persistedBug && (
        <p className="text-xs text-amber-400 border border-amber-500/30 rounded-md px-3 py-2 bg-amber-500/10">
          Enregistrez le cas avec le statut <strong>Échoué</strong> ou <strong>Bloqué</strong> avant
          de créer une anomalie.
        </p>
      )}

      {/* Formulaire de création */}
      {showForm && allowCreate && (
        <div className="rounded-lg border border-orange-500/30 p-4
          bg-white dark:bg-[#1a1f27]">
          <p className="text-xs font-medium text-orange-500 dark:text-orange-300 mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Nouvelle anomalie — Cas <span className="font-mono">{casTest.test_ref}</span>
          </p>
          <CreateAnomalieForm
            members={members}
            defaultTitre={casTest.bug_titre_correction || ""}
            casTestRef={casTest.test_ref}
            saving={saving}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400" role="alert">{error}</p>
      )}

      {/* Liste read-only des anomalies liées */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement des anomalies…</p>
      ) : anomalies.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {allowCreate
            ? "Aucune anomalie. Cliquez sur « Créer une anomalie » pour tracer le défaut."
            : "Aucune anomalie enregistrée pour ce cas."}
        </p>
      ) : (
        <div className="space-y-2">
          {anomalies.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2
                rounded-md border border-orange-500/20 bg-white/50 dark:bg-[#1e242c]/60
                px-3 py-2"
            >
              {/* Titre + meta */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {a.titre}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#9dabb9] mt-0.5">
                  {a.assigned_nom ? `Assignée à ${a.assigned_nom}` : "Non assignée"}
                  {" · "}
                  {new Date(a.dateCreation).toLocaleDateString("fr-FR")}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded ${statutBadgeClass(a.statut)}`}>
                  {ANOMALIE_STATUT_LABELS[a.statut]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-[#283039] ${severiteTextClass(a.severite)}`}>
                  {a.severite}
                </span>
              </div>
            </div>
          ))}

          {/* Lien vers le dashboard */}
          <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">info</span>
            Pour gérer les anomalies (assigner, résoudre), rendez-vous dans
            <a
              href="/dashboard/qa/anomalies"
              className="text-orange-400 hover:text-orange-300 underline underline-offset-2 ml-0.5"
            >
              Anomalies
            </a>.
          </p>
        </div>
      )}
    </section>
  );
}
