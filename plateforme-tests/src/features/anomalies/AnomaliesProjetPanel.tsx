"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { Anomalie } from "@/types";
import { getAssignableMembers, getCahier } from "@/features/cahier-tests/api";
import {
  assignAnomalie,
  listAnomaliesProjet,
  reopenAnomalie,
  resolveAnomalie,
} from "./api";
import AnomalieManageCard from "./AnomalieManageCard";
import { ANOMALIE_STATUT_LABELS, statutBadgeClass } from "./constants";
import type { AssignableMember } from "./CreateAnomalieForm";

interface AnomaliesProjetPanelProps {
  projectId: number;
}

export default function AnomaliesProjetPanel({ projectId }: AnomaliesProjetPanelProps) {
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statutFilter, setStatutFilter] = useState("");
  const [members, setMembers] = useState<AssignableMember[]>([]);
  const [selected, setSelected] = useState<Anomalie | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAnomaliesProjet(
        projectId,
        statutFilter || undefined
      );
      setAnomalies(data);
    } catch {
      setError("Impossible de charger les anomalies du projet.");
    } finally {
      setLoading(false);
    }
  }, [projectId, statutFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getCahier(projectId)
      .then((cahier) => getAssignableMembers(projectId, cahier.id))
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [projectId]);

  const openCount = useMemo(
    () => anomalies.filter((a) => a.statut !== "RESOLU").length,
    [anomalies]
  );

  const handleAssign = async (anomalieId: number, developerId: number) => {
    setSaving(true);
    try {
      const updated = await assignAnomalie(projectId, anomalieId, developerId);
      await load();
      setSelected((prev) => (prev?.id === updated.id ? updated : prev));
    } catch {
      setError("Impossible d'assigner au développeur.");
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (id: number) => {
    setSaving(true);
    try {
      const updated = await resolveAnomalie(projectId, id);
      await load();
      setSelected((prev) => (prev?.id === updated.id ? updated : prev));
    } catch {
      setError("Impossible de résoudre l'anomalie.");
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async (id: number) => {
    setSaving(true);
    try {
      const updated = await reopenAnomalie(projectId, id);
      await load();
      setSelected((prev) => (prev?.id === updated.id ? updated : prev));
    } catch {
      setError("Impossible de réouvrir l'anomalie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Suivi des anomalies</h2>
          <p className="text-sm text-muted-foreground">
            {openCount} ouverte{openCount > 1 ? "s" : ""} sur {anomalies.length} — cycle : Nouveau →
            En cours → Résolu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="anomalies-statut-filter" className="text-sm text-muted-foreground">
            Filtrer
          </label>
          <select
            id="anomalies-statut-filter"
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-surface-dark border border-border text-foreground rounded-md"
          >
            <option value="">Tous les statuts</option>
            <option value="NOUVEAU">Nouveau</option>
            <option value="EN_COURS">En cours</option>
            <option value="REOUVERT">Réouvert</option>
            <option value="RESOLU">Résolu</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : anomalies.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-dark p-8 text-center text-muted-foreground">
          Aucune anomalie. Créez-en depuis un cas de test <strong>Échoué</strong> ou{" "}
          <strong>Bloqué</strong> dans le cahier de tests.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-(--surface-2) text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Cas</th>
                <th className="text-left px-4 py-3 font-medium">Anomalie</th>
                <th className="text-left px-4 py-3 font-medium">Cycle</th>
                <th className="text-left px-4 py-3 font-medium">Développeur</th>
                <th className="text-right px-4 py-3 font-medium">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface-dark">
              {anomalies.map((a) => (
                <tr key={a.id} className="hover:bg-(--surface-2)/50">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {a.cas_test_ref || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{a.titre}</p>
                    <p className="text-xs text-muted-foreground">{a.severite} · {a.priorite}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${statutBadgeClass(a.statut)}`}>
                      {ANOMALIE_STATUT_LABELS[a.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.assigned_nom || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(a)}
                      className="text-xs px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-(--surface-2)"
                    >
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Anomalie — ${selected.titre}` : "Anomalie"}
        size="lg"
      >
        {selected && (
          <AnomalieManageCard
            anomalie={selected}
            developers={members}
            saving={saving}
            onAssign={handleAssign}
            onResolve={handleResolve}
            onReopen={handleReopen}
          />
        )}
      </Modal>
    </div>
  );
}
