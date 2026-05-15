"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CasTest, CreateAnomaliePayload } from "@/types";
import { getAssignableMembers } from "@/features/cahier-tests/api";
import {
  assignAnomalie,
  createAnomalie,
  listAnomaliesCasTest,
  reopenAnomalie,
  resolveAnomalie,
} from "./api";
import AnomalieManageCard from "./AnomalieManageCard";
import CreateAnomalieForm, { AssignableMember } from "./CreateAnomalieForm";

interface AnomalieCasTestPanelProps {
  projectId: number;
  cahierId: number;
  casTest: CasTest;
  readOnly?: boolean;
  /** True when the cas is persisted as Échoué/Bloqué in DB */
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
  const [showForm, setShowForm] = useState(false);
  const [members, setMembers] = useState<AssignableMember[]>([]);

  const persistedBug = isBugStatut(casTest.statut_test);
  const allowCreate = canCreate && persistedBug && !readOnly;

  const defaultTitre = useMemo(
    () => casTest.bug_titre_correction?.trim() || casTest.test_case || "",
    [casTest.bug_titre_correction, casTest.test_case]
  );

  const defaultDescription = useMemo(() => {
    const parts: string[] = [];
    if (casTest.resultat_obtenu?.trim()) parts.push(`Résultat obtenu : ${casTest.resultat_obtenu}`);
    if (casTest.commentaire?.trim()) parts.push(casTest.commentaire);
    return parts.join("\n\n");
  }, [casTest.resultat_obtenu, casTest.commentaire]);

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
    if (readOnly) return;
    getAssignableMembers(projectId, cahierId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [projectId, cahierId, readOnly]);

  const handleCreate = async (payload: CreateAnomaliePayload) => {
    setSaving(true);
    setError(null);
    try {
      await createAnomalie(projectId, cahierId, casTest.id, payload);
      setShowForm(false);
      await load();
    } catch {
      setError(
        "Création impossible. Enregistrez d'abord le cas en statut Échoué ou Bloqué, puis réessayez."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (anomalieId: number, developerId: number) => {
    setSaving(true);
    try {
      await assignAnomalie(projectId, anomalieId, developerId);
      await load();
    } catch {
      setError("Impossible d'assigner au développeur.");
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (id: number) => {
    setSaving(true);
    try {
      await resolveAnomalie(projectId, id);
      await load();
    } catch {
      setError("Impossible de résoudre l'anomalie.");
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async (id: number) => {
    setSaving(true);
    try {
      await reopenAnomalie(projectId, id);
      await load();
    } catch {
      setError("Impossible de réouvrir l'anomalie.");
    } finally {
      setSaving(false);
    }
  };

  if (!isBugStatut(casTest.statut_test) && anomalies.length === 0) {
    return null;
  }

  return (
    <section className="border border-orange-500/40 rounded-lg p-4 bg-orange-500/5 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-400">bug_report</span>
          <h3 className="text-sm font-semibold text-foreground">Anomalies liées au cas</h3>
          <span className="text-xs text-muted-foreground">({anomalies.length})</span>
        </div>
        {allowCreate && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
          >
            {showForm ? "Fermer le formulaire" : "+ Créer une anomalie"}
          </button>
        )}
      </header>

      {!persistedBug && (
        <p className="text-xs text-amber-400 border border-amber-500/30 rounded-md px-3 py-2 bg-amber-500/10">
          Enregistrez le cas avec le statut <strong>Échoué</strong> ou <strong>Bloqué</strong> avant
          de créer une anomalie.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      {showForm && allowCreate && (
        <div className="rounded-lg border border-border bg-surface-dark p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Nouvelle anomalie</h4>
          <CreateAnomalieForm
            members={members}
            defaultTitre={defaultTitre}
            defaultDescription={defaultDescription}
            casTestRef={casTest.test_ref}
            saving={saving}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement des anomalies…</p>
      ) : anomalies.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucune anomalie. Après enregistrement du cas en échec/blocage, créez une anomalie pour
          tracer le défaut et l&apos;assigner à un développeur.
        </p>
      ) : (
        <div className="space-y-3">
          {anomalies.map((a) => (
            <AnomalieManageCard
              key={a.id}
              anomalie={a}
              developers={members}
              readOnly={readOnly}
              saving={saving}
              onAssign={handleAssign}
              onResolve={handleResolve}
              onReopen={handleReopen}
            />
          ))}
        </div>
      )}
    </section>
  );
}
