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

  const handleSubmit = async () => {
    if (!form.titre.trim()) return;
    await onSubmit({
      titre: form.titre.trim(),
      description: form.description?.trim() || undefined,
      severite: form.severite,
      priorite: form.priorite,
      assigned_to: form.assigned_to || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement | null;
    if (target?.tagName === "TEXTAREA") return;
    e.preventDefault();
  };

  /**
   * Light mode  → fond blanc, bordure grise, texte gris foncé
   * Dark mode   → fond [#1e242c], bordure [#3b4754], texte blanc
   */
  const inputCls =
    "w-full px-3 py-2 text-sm rounded-md border transition-colors focus:outline-none " +
    "focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 dark:focus:border-orange-500 " +
    // light
    "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 " +
    // dark
    "dark:bg-[#1e242c] dark:border-[#3b4754] dark:text-white dark:placeholder:text-[#6b7a8d]";

  const labelCls =
    "block text-sm font-medium mb-1 text-gray-700 dark:text-[#c9d4e0]";

  return (
    <div onKeyDown={handleKeyDown} className="space-y-4">

      {/* Cas lié */}
      {casTestRef && (
        <p className="flex items-center gap-2 text-xs rounded-md border px-3 py-2
          bg-gray-50 border-gray-200 text-gray-500
          dark:bg-[#283039]/60 dark:border-[#3b4754] dark:text-[#9dabb9]">
          <span className="material-symbols-outlined text-[14px]">link</span>
          Cas lié :&nbsp;
          <span className="font-mono font-semibold text-gray-800 dark:text-white">
            {casTestRef}
          </span>
        </p>
      )}

      {/* Titre */}
      <div>
        <label htmlFor="create-anomalie-titre" className={labelCls}>
          Titre de l&apos;anomalie <span className="text-red-500">*</span>
        </label>
        <input
          id="create-anomalie-titre"
          type="text"
          required
          value={form.titre}
          onChange={(e) => setForm({ ...form, titre: e.target.value })}
          className={inputCls}
          placeholder="Ex : Validation du formulaire incorrecte"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="create-anomalie-desc" className={labelCls}>
          Description
        </label>
        <textarea
          id="create-anomalie-desc"
          rows={3}
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputCls}
          placeholder="Étapes reproduites, résultat obtenu, impact sur le test..."
        />
      </div>

      {/* Sévérité / Priorité / Développeur */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="create-anomalie-severite" className={labelCls}>
            Sévérité
          </label>
          <select
            id="create-anomalie-severite"
            value={form.severite}
            onChange={(e) =>
              setForm({ ...form, severite: e.target.value as AnomalieSeverite })
            }
            className={inputCls}
          >
            <option value="CRITIQUE">Critique</option>
            <option value="MAJEURE">Majeure</option>
            <option value="MINEURE">Mineure</option>
          </select>
        </div>

        <div>
          <label htmlFor="create-anomalie-priorite" className={labelCls}>
            Priorité
          </label>
          <select
            id="create-anomalie-priorite"
            value={form.priorite}
            onChange={(e) =>
              setForm({ ...form, priorite: e.target.value as AnomaliePriorite })
            }
            className={inputCls}
          >
            <option value="HAUTE">Haute</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="BASSE">Basse</option>
          </select>
        </div>

        <div>
          <label htmlFor="create-anomalie-dev" className={labelCls}>
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
            className={inputCls}
          >
            <option value="">Non assigné</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nom}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1 text-gray-400 dark:text-[#6b7a8d]">
            Si assigné, l&apos;anomalie passe en « En cours ».
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2
        border-t border-gray-200 dark:border-[#3b4754]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md border transition-colors
              border-gray-300 text-gray-700 hover:bg-gray-100
              dark:border-[#3b4754] dark:text-[#c9d4e0] dark:hover:bg-[#283039]
              disabled:opacity-50"
          >
            Annuler
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !form.titre.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md
            transition-colors
            bg-orange-500 hover:bg-orange-600 text-white
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-[16px] animate-spin">
                progress_activity
              </span>
              Création...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">bug_report</span>
              Créer l&apos;anomalie
            </>
          )}
        </button>
      </div>
    </div>
  );
}
