"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CasTest,
  CasTestHistoryEntry,
  StatutTest,
  TypeTest,
  UpdateCasTestPayload,
} from "@/types";
import {
  getAssignableMembers,
  getCasTestHistory,
  updateCasTest,
  uploadCasTestCapture,
  getCasTestCaptureUrl,
  suggestBugFields,
} from "./api";
import axiosInstance from "@/lib/axios";
import { AxiosError } from "axios";

interface EditCasTestModalProps {
  projectId: number;
  cahierId: number;
  casTest: CasTest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  readOnly?: boolean;
  assignOnly?: boolean;
  canAssignMember?: boolean;
}

export default function EditCasTestModal({
  projectId,
  cahierId,
  casTest,
  isOpen,
  onClose,
  onSuccess,
  readOnly = false,
  assignOnly = false,
  canAssignMember = false,
}: EditCasTestModalProps) {
  const [formData, setFormData] = useState<UpdateCasTestPayload>({
    test_case: casTest.test_case,
    scenario_test: casTest.scenario_test || "",
    resultat_attendu: casTest.resultat_attendu || "",
    resultat_obtenu: casTest.resultat_obtenu || "",
    execution_time_seconds: casTest.execution_time_seconds ?? undefined,
    fail_logs: casTest.fail_logs || "",
    type_test: casTest.type_test,
    statut_test: casTest.statut_test,
    commentaire: casTest.commentaire || "",
    bug_titre_correction: casTest.bug_titre_correction || "",
    bug_nom_tache: casTest.bug_nom_tache || "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingBugSuggestion, setLoadingBugSuggestion] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<CasTestHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [captureFile, setCaptureFile] = useState<File | null>(null);
  const [capturePreview, setCapturePreview] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [projectMembers, setProjectMembers] = useState<
    { id: number; nom: string; email: string; role_code: string }[]
  >([]);
  const assignableMembers = projectMembers.filter((member) => {
    const code = (member.role_code || "").toUpperCase();
    const normalizedName = (member.nom || "").toUpperCase();
    if (normalizedName.includes("SCRUM")) return false;
    return code === "TESTEUR_QA" || code === "DEVELOPPEUR" || code === "DEVELOPER";
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing capture as authenticated blob URL
  useEffect(() => {
    if (!casTest.capture) return;
    let objectUrl: string | null = null;
    axiosInstance
      .get(getCasTestCaptureUrl(projectId, cahierId, casTest.id), { responseType: "blob" })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setCapturePreview(objectUrl);
      })
      .catch(() => {});
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [projectId, cahierId, casTest.id, casTest.capture]);

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      sprint: casTest.sprint || "",
      module: casTest.module || "",
      sous_module: casTest.sous_module || "",
      test_case: casTest.test_case,
      test_purpose: casTest.test_purpose || "",
      type_utilisateur: casTest.type_utilisateur || "",
      scenario_test: casTest.scenario_test || "",
      resultat_attendu: casTest.resultat_attendu || "",
      resultat_obtenu: casTest.resultat_obtenu || "",
      execution_time_seconds: casTest.execution_time_seconds ?? undefined,
      fail_logs: casTest.fail_logs || "",
      type_test: casTest.type_test,
      statut_test: casTest.statut_test,
      commentaire: casTest.commentaire || "",
      bug_titre_correction: casTest.bug_titre_correction || "",
      bug_nom_tache: casTest.bug_nom_tache || "",
    });
  }, [isOpen, casTest]);

  useEffect(() => {
    if (!isOpen) return;

    const loadProjectMembers = async () => {
      setLoadingMembers(true);
      try {
        const members = await getAssignableMembers(projectId, cahierId);
        setProjectMembers(members);
      } catch (err) {
        console.error("Erreur lors du chargement des membres du projet:", err);
        setProjectMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadProjectMembers();
  }, [isOpen, projectId, cahierId]);

  useEffect(() => {
    if (!isOpen || !showHistory) return;

    const loadHistory = async () => {
      setLoadingHistory(true);
      setHistoryError(null);
      try {
        const data = await getCasTestHistory(projectId, cahierId, casTest.id);
        setHistoryEntries(data);
      } catch (err: unknown) {
        const apiError = err as AxiosError<{ detail?: string }>;
        setHistoryError(apiError.response?.data?.detail || "Impossible de charger l'historique.");
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [isOpen, showHistory, projectId, cahierId, casTest.id]);

  const handleCaptureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCaptureFile(file);
    if (capturePreview && !casTest.capture) URL.revokeObjectURL(capturePreview);
    setCapturePreview(URL.createObjectURL(file));
  };

  const handleStatusChange = async (newStatus: StatutTest) => {
    setFormData((prev) => ({ ...prev, statut_test: newStatus }));

    const isBugStatus = newStatus === "Échoué" || newStatus === "Bloqué";
    if (!isBugStatus) return;

    const hasTitre = !!formData.bug_titre_correction?.trim();
    const hasTache = !!formData.bug_nom_tache?.trim();
    if (hasTitre && hasTache) return;

    setLoadingBugSuggestion(true);
    try {
      const suggestion = await suggestBugFields(projectId, cahierId, casTest.id);
      setFormData((prev) => ({
        ...prev,
        bug_titre_correction: prev.bug_titre_correction?.trim()
          ? prev.bug_titre_correction
          : suggestion.bug_titre_correction,
        bug_nom_tache: prev.bug_nom_tache?.trim()
          ? prev.bug_nom_tache
          : suggestion.bug_nom_tache,
      }));
    } catch {
      // Le backend gère déjà un fallback; on laisse l'utilisateur saisir manuellement si nécessaire.
    } finally {
      setLoadingBugSuggestion(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isBugStatus =
      formData.statut_test === "Échoué" || formData.statut_test === "Bloqué";
    if (isBugStatus) {
      if (!formData.bug_titre_correction?.trim()) {
        setError("Le titre de correction est obligatoire pour un test échoué ou bloqué.");
        setLoading(false);
        return;
      }
      if (!formData.bug_nom_tache?.trim()) {
        setError("Le nom de tâche est obligatoire pour un test échoué ou bloqué.");
        setLoading(false);
        return;
      }
    }

    try {
      const payload = assignOnly
        ? { type_utilisateur: formData.type_utilisateur || "" }
        : (() => {
            if (canAssignMember) {
              return formData;
            }
            const rest = { ...formData };
            delete rest.type_utilisateur;
            return rest;
          })();
      await updateCasTest(projectId, cahierId, casTest.id, payload);
      if (captureFile) {
        await uploadCasTestCapture(projectId, cahierId, casTest.id, captureFile);
      }
      if (assignOnly && formData.type_utilisateur?.trim()) {
        window.alert(`L'utilisateur ${formData.type_utilisateur} a été assigné correctement.`);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiError = err as AxiosError<{ detail?: string }>;
      setError(apiError.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isBugStatus =
    formData.statut_test === "Échoué" || formData.statut_test === "Bloqué";

  const renderHistorySection = () => (
    <div className="border border-[#3b4754] rounded-lg p-4 bg-[#283039]/40">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Historique du cas de test</h3>
        <button
          type="button"
          onClick={() => setShowHistory((prev) => !prev)}
          className="px-3 py-1.5 rounded-md border border-[#3b4754] text-[#9dabb9] hover:text-white hover:bg-[#283039] text-xs font-medium"
        >
          {showHistory ? "Masquer" : "Voir historique"}
        </button>
      </div>

      {showHistory && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loadingHistory && <p className="text-sm text-[#9dabb9]">Chargement...</p>}
          {historyError && <p className="text-sm text-red-400">{historyError}</p>}
          {!loadingHistory && !historyError && historyEntries.length === 0 && (
            <p className="text-sm text-[#9dabb9]">Aucune modification historisée pour ce cas.</p>
          )}
          {!loadingHistory && !historyError && historyEntries.map((entry) => (
            <div key={entry.id} className="rounded-md border border-[#3b4754] bg-surface-dark p-3">
              <p className="text-xs text-[#9dabb9]">
                {new Date(entry.changed_at).toLocaleString("fr-FR")}
              </p>
              <p className="text-sm text-white mt-1">
                Statut: <span className="text-[#9dabb9]">{entry.old_statut_test || "—"}</span> → <span className="font-semibold">{entry.new_statut_test || "—"}</span>
              </p>
              {(entry.old_bug_titre_correction !== entry.new_bug_titre_correction || entry.old_bug_nom_tache !== entry.new_bug_nom_tache) && (
                <p className="text-xs text-[#9dabb9] mt-1">
                  Bug: {entry.old_bug_titre_correction || "—"} / {entry.old_bug_nom_tache || "—"} → {entry.new_bug_titre_correction || "—"} / {entry.new_bug_nom_tache || "—"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (assignOnly) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-surface-dark rounded-xl shadow-2xl max-w-xl w-full border border-[#3b4754]">
          <div className="sticky top-0 bg-surface-dark border-b border-[#3b4754] px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Assigner membre développeur / testeur - {casTest.test_ref}</h2>
            <button onClick={onClose} className="text-[#9dabb9] hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-1">Membre assigné</label>
              <select
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
                value={formData.type_utilisateur || ""}
                onChange={(e) => setFormData({ ...formData, type_utilisateur: e.target.value })}
                disabled={loadingMembers}
              >
                <option value="">{loadingMembers ? "Chargement des membres..." : "Non assigné"}</option>
                {assignableMembers.map((member) => (
                  <option key={member.id} value={member.nom}>
                    {member.nom} ({member.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[#3b4754]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039]"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Enregistrement..." : "Assigner"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── View-only mode ───────────────────────────────────────────────────────
  if (readOnly) {
    const statutStyles: Record<StatutTest, string> = {
      "Non exécuté": "bg-[#283039] text-[#9dabb9]",
      Réussi: "bg-green-500/20 text-green-400",
      Échoué: "bg-red-500/20 text-red-400",
      Bloqué: "bg-orange-500/20 text-orange-400",
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-surface-dark rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#3b4754]">
          {/* Header */}
          <div className="sticky top-0 bg-surface-dark border-b border-[#3b4754] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white">
                {casTest.test_ref}
              </h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutStyles[casTest.statut_test]}`}>
                {casTest.statut_test}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                casTest.type_test === "Automatisé"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-[#283039] text-[#9dabb9]"
              }`}>
                {casTest.type_test}
              </span>
            </div>
            <button onClick={onClose} className="text-[#9dabb9] hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Informations générales */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#283039] rounded-lg">
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-1">Sprint</p>
                <p className="text-white font-medium">{casTest.sprint || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-1">User Story</p>
                <p className="text-white font-medium">
                  {casTest.user_story_reference || `US-${casTest.user_story_id}`}
                </p>
                {casTest.user_story_titre && (
                  <p className="text-xs text-[#9dabb9] mt-1">{casTest.user_story_titre}</p>
                )}
              </div>
            </div>

            {/* Cas de test & Objectif */}
            <div>
              <p className="text-xs text-[#9dabb9] uppercase mb-1">Cas de Test</p>
              <p className="text-white">{casTest.test_case || "—"}</p>
            </div>
            {casTest.test_purpose && (
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-1">Objectif</p>
                <p className="text-white">{casTest.test_purpose}</p>
              </div>
            )}

            {/* Scénario */}
            {casTest.scenario_test && (
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-1">Scénario de Test</p>
                <div className="bg-[#283039] rounded-lg p-3 text-white whitespace-pre-wrap text-sm">
                  {casTest.scenario_test}
                </div>
              </div>
            )}

            {/* Résultat attendu / obtenu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {casTest.resultat_attendu && (
                <div>
                  <p className="text-xs text-[#9dabb9] uppercase mb-1">Résultat Attendu</p>
                  <div className="bg-[#283039] rounded-lg p-3 text-white whitespace-pre-wrap text-sm">
                    {casTest.resultat_attendu}
                  </div>
                </div>
              )}
              {casTest.resultat_obtenu && (
                <div>
                  <p className="text-xs text-[#9dabb9] uppercase mb-1">Résultat Obtenu</p>
                  <div className="bg-[#283039] rounded-lg p-3 text-white whitespace-pre-wrap text-sm">
                    {casTest.resultat_obtenu}
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-[#9dabb9] uppercase mb-1">Duration / Execution Time</p>
              <p className="text-white">
                {casTest.execution_time_seconds !== null && casTest.execution_time_seconds !== undefined
                  ? `${casTest.execution_time_seconds} s`
                  : "—"}
              </p>
            </div>

            {/* Logs d'erreur */}
            {casTest.fail_logs && (
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                  Logs d&apos;Erreur
                </p>
                <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-3 text-red-300 font-mono text-sm whitespace-pre-wrap">
                  {casTest.fail_logs}
                </div>
              </div>
            )}

            {/* Commentaire */}
            {casTest.commentaire && (
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-1">Commentaire</p>
                <div className="bg-[#283039] rounded-lg p-3 text-white text-sm">
                  {casTest.commentaire}
                </div>
              </div>
            )}

            {(casTest.bug_titre_correction || casTest.bug_nom_tache) && (
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-400 text-sm">bug_report</span>
                  Ligne Bug
                </p>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm">
                  <p className="text-[#9dabb9]">Titre de correction</p>
                  <p className="text-white font-medium">{casTest.bug_titre_correction || "—"}</p>
                  <p className="text-[#9dabb9] mt-2">Nom de tâche</p>
                  <p className="text-white font-medium">{casTest.bug_nom_tache || "—"}</p>
                </div>
              </div>
            )}

            {renderHistorySection()}

            {/* Capture d'écran */}
            {capturePreview && (
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#9dabb9] text-sm">photo_camera</span>
                  Capture d&apos;écran
                </p>
                <img
                  src={capturePreview}
                  alt="Capture du test"
                  className="rounded-lg border border-[#3b4754] max-w-full max-h-96 object-contain"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 pb-5">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039]"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-dark rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#3b4754]">
        <div className="sticky top-0 bg-surface-dark border-b border-[#3b4754] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Modifier le Test - {casTest.test_ref}
          </h2>
          <button
            onClick={onClose}
            className="text-[#9dabb9] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Informations générales (non modifiables) */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-[#283039] rounded">
            <div>
              <p className="text-xs text-[#9dabb9]">Sprint</p>
              <p className="font-medium text-white">{casTest.sprint || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-[#9dabb9]">User Story</p>
              <p className="font-medium text-white">{casTest.user_story_reference || `US-${casTest.user_story_id}`}</p>
              
            </div>
          </div>

          {/* Test Case */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Cas de Test
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.test_case}
              onChange={(e) =>
                setFormData({ ...formData, test_case: e.target.value })
              }
            />
          </div>

          {/* Scénario */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Scénario de Test
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.scenario_test}
              onChange={(e) =>
                setFormData({ ...formData, scenario_test: e.target.value })
              }
            />
          </div>

          {/* Membre assigné */}
          {canAssignMember && (
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Membre assigné
              </label>
              <select
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
                value={formData.type_utilisateur || ""}
                onChange={(e) =>
                  setFormData({ ...formData, type_utilisateur: e.target.value })
                }
                disabled={loadingMembers}
              >
                <option value="">{loadingMembers ? "Chargement des membres..." : "Non assigné"}</option>
                {assignableMembers.map((member) => (
                  <option key={member.id} value={member.nom}>
                    {member.nom} ({member.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Résultat Attendu */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Résultat Attendu
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.resultat_attendu}
              onChange={(e) =>
                setFormData({ ...formData, resultat_attendu: e.target.value })
              }
            />
          </div>

          {/* Résultat Obtenu */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Résultat Obtenu (après exécution)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.resultat_obtenu}
              onChange={(e) =>
                setFormData({ ...formData, resultat_obtenu: e.target.value })
              }
              placeholder="Décrivez le résultat après l'exécution du test"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Duration / Execution Time (sec)
            </label>
            <input
              type="number"
              min={0}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.execution_time_seconds ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  execution_time_seconds:
                    e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
                })
              }
              placeholder="Ex: 45"
            />
          </div>

          {/* Logs d'Erreur */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Logs d&apos;Erreur
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              value={formData.fail_logs}
              onChange={(e) =>
                setFormData({ ...formData, fail_logs: e.target.value })
              }
              placeholder="Collez les logs d&apos;erreur si le test a échoué"
            />
          </div>

          {/* Type & Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Type de Test
              </label>
              <select
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.type_test}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type_test: e.target.value as TypeTest,
                  })
                }
              >
                <option value="Manuel">Manuel</option>
                <option value="Automatisé">Automatisé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Statut
              </label>
              <select
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.statut_test}
                onChange={(e) => handleStatusChange(e.target.value as StatutTest)}
              >
                <option value="Non exécuté">Non exécuté</option>
                <option value="Réussi">Réussi</option>
                <option value="Échoué">Échoué</option>
                <option value="Bloqué">Bloqué</option>
              </select>
            </div>
          </div>

          {isBugStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-orange-500/40 bg-orange-500/10 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Titre de correction
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.bug_titre_correction || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bug_titre_correction: e.target.value })
                  }
                  placeholder="Ex: Corriger la validation du formulaire"
                />
                {loadingBugSuggestion && (
                  <p className="text-xs text-[#9dabb9] mt-1">Génération IA en cours...</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Nom de tâche
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.bug_nom_tache || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bug_nom_tache: e.target.value })
                  }
                  placeholder="Ex: TASK-142 / Fix login error"
                />
              </div>
            </div>
          )}

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Commentaire
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.commentaire}
              onChange={(e) =>
                setFormData({ ...formData, commentaire: e.target.value })
              }
              placeholder="Notes supplémentaires..."
            />
          </div>

          {/* Capture d'écran */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Capture d&apos;écran
            </label>
            {capturePreview && (
              <div className="mb-2 relative">
                <img
                  src={capturePreview}
                  alt="Capture"
                  className="rounded-lg border border-[#3b4754] max-w-full max-h-64 object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCaptureFile(null);
                    setCapturePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                  title="Supprimer la capture"
                >
                  ×
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleCaptureChange}
              className="block w-full text-sm text-[#9dabb9] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            <p className="text-xs text-[#9dabb9] mt-1">PNG, JPG, GIF, WebP — max 10 MB</p>
          </div>

          {/* Actions */}
          {renderHistorySection()}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-[#3b4754]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039]"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
