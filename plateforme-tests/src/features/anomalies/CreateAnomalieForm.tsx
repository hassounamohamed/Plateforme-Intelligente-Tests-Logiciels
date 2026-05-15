"use client";

import { useMemo, useState } from "react";
import {
  AnomaliePriorite,
  AnomalieSeverite,
  CreateAnomaliePayload,
} from "@/types";
import { isDeveloperRole } from "./constants";

export type AssignableMember = {
  id: number;
  nom: string;
  email: string;
  role_code: string;
};

interface CreateAnomalieFormProps {
  members: AssignableMember[];
  defaultTitre?: string;
  defaultDescription?: string;
  casTestRef?: string;
  saving?: boolean;
  onSubmit: (payload: CreateAnomaliePayload) => Promise<void>;
  onCancel?: () => void;
}

export default function CreateAnomalieForm({
  members,
  defaultTitre = "",
  defaultDescription = "",
  casTestRef,
  saving = false,
  onSubmit,
  onCancel,
}: CreateAnomalieFormProps) {
  const developers = useMemo(
    () => members.filter((m) => isDeveloperRole(m.role_code)),
    [members]
  );

  const [form, setForm] = useState<CreateAnomaliePayload & { assigned_to?: number }>({
    titre: defaultTitre,
    description: defaultDescription,
    severite: "MAJEURE",
    priorite: "MOYENNE",
    assigned_to: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) return;
    await onSubmit({
      titre: form.titre.trim(),
      description: form.description?.trim() || undefined,
      severite: form.severite,
      priorite: form.priorite,
      assigned_to: form.assigned_to || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {casTestRef && (
        <p className="text-xs text-muted-foreground rounded-md border border-border bg-surface-dark px-3 py-2">
          Cas lié : <span className="font-mono text-foreground">{casTestRef}</span>
        </p>
      )}

      <div>
        <label htmlFor="create-anomalie-titre" className="block text-sm font-medium text-foreground mb-1">
          Titre de l&apos;anomalie <span className="text-red-400">*</span>
        </label>
        <input
          id="create-anomalie-titre"
          type="text"
          required
          value={form.titre}
          onChange={(e) => setForm({ ...form, titre: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-surface-dark border border-border text-foreground rounded-md"
          placeholder="Ex : Validation du formulaire incorrecte"
        />
      </div>

      <div>
        <label htmlFor="create-anomalie-desc" className="block text-sm font-medium text-foreground mb-1">
          Description
        </label>
        <textarea
          id="create-anomalie-desc"
          rows={3}
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-surface-dark border border-border text-foreground rounded-md"
          placeholder="Étapes reproduites, résultat obtenu, impact sur le test..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="create-anomalie-severite" className="block text-sm font-medium text-foreground mb-1">
            Sévérité
          </label>
          <select
            id="create-anomalie-severite"
            value={form.severite}
            onChange={(e) =>
              setForm({ ...form, severite: e.target.value as AnomalieSeverite })
            }
            className="w-full px-3 py-2 text-sm bg-surface-dark border border-border text-foreground rounded-md"
          >
            <option value="CRITIQUE">Critique</option>
            <option value="MAJEURE">Majeure</option>
            <option value="MINEURE">Mineure</option>
          </select>
        </div>
        <div>
          <label htmlFor="create-anomalie-priorite" className="block text-sm font-medium text-foreground mb-1">
            Priorité
          </label>
          <select
            id="create-anomalie-priorite"
            value={form.priorite}
            onChange={(e) =>
              setForm({ ...form, priorite: e.target.value as AnomaliePriorite })
            }
            className="w-full px-3 py-2 text-sm bg-surface-dark border border-border text-foreground rounded-md"
          >
            <option value="HAUTE">Haute</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="BASSE">Basse</option>
          </select>
        </div>
        <div>
          <label htmlFor="create-anomalie-dev" className="block text-sm font-medium text-foreground mb-1">
            Développeur assigné
          </label>
          <select
            id="create-anomalie-dev"
            value={form.assigned_to ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                assigned_to: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 text-sm bg-surface-dark border border-border text-foreground rounded-md"
          >
            <option value="">Non assigné (statut Nouveau)</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nom}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Si un développeur est choisi, l&apos;anomalie passe en « En cours ».
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-sm border border-border rounded-md text-foreground hover:bg-(--surface-2)"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Création..." : "Créer l'anomalie"}
        </button>
      </div>
    </form>
  );
}
