"use client";

import React, { useEffect, useRef, useState } from "react";
import { CasTest, StatutTest, TypeTest, UpdateCasTestPayload } from "@/types";
import { updateCasTest, uploadCasTestCapture, getCasTestCaptureUrl } from "./api";
import axiosInstance from "@/lib/axios";
import { getProjectById } from "@/features/projects/api";

interface EditCasTestModalProps {
  projectId: number;
  cahierId: number;
  casTest: CasTest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  readOnly?: boolean;
}

export default function EditCasTestModal({
  projectId,
  cahierId,
  casTest,
  isOpen,
  onClose,
  onSuccess,
  readOnly = false,
}: EditCasTestModalProps) {
  const [formData, setFormData] = useState<UpdateCasTestPayload>({
    test_case: casTest.test_case,
    scenario_test: casTest.scenario_test || "",
    resultat_attendu: casTest.resultat_attendu || "",
    resultat_obtenu: casTest.resultat_obtenu || "",
    fail_logs: casTest.fail_logs || "",
    type_test: casTest.type_test,
    statut_test: casTest.statut_test,
    commentaire: casTest.commentaire || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureFile, setCaptureFile] = useState<File | null>(null);
  const [capturePreview, setCapturePreview] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [projectMembers, setProjectMembers] = useState<{ id: number; nom: string; email: string }[]>([]);
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
  }, [casTest.id, casTest.capture]);

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
      fail_logs: casTest.fail_logs || "",
      type_test: casTest.type_test,
      statut_test: casTest.statut_test,
      commentaire: casTest.commentaire || "",
    });
  }, [isOpen, casTest]);

  useEffect(() => {
    if (!isOpen) return;

    const loadProjectMembers = async () => {
      setLoadingMembers(true);
      try {
        const project = await getProjectById(projectId);
        setProjectMembers(project.membres ?? []);
      } catch (err) {
        console.error("Erreur lors du chargement des membres du projet:", err);
        setProjectMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadProjectMembers();
  }, [isOpen, projectId]);

  const handleCaptureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCaptureFile(file);
    if (capturePreview && !casTest.capture) URL.revokeObjectURL(capturePreview);
    setCapturePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateCasTest(projectId, cahierId, casTest.id, formData);
      if (captureFile) {
        await uploadCasTestCapture(projectId, cahierId, casTest.id, captureFile);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
            <div className="grid grid-cols-3 gap-4 p-4 bg-[#283039] rounded-lg">
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-1">Sprint</p>
                <p className="text-white font-medium">{casTest.sprint || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-1">Module</p>
                <p className="text-white font-medium">{casTest.module || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#9dabb9] uppercase mb-1">Sous-module</p>
                <p className="text-white font-medium">{casTest.sous_module || "—"}</p>
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
          <div className="grid grid-cols-3 gap-4 p-4 bg-[#283039] rounded">
            <div>
              <p className="text-xs text-[#9dabb9]">Sprint</p>
              <p className="font-medium text-white">{casTest.sprint || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-[#9dabb9]">Module</p>
              <p className="font-medium text-white">{casTest.module || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-[#9dabb9]">Sous-module</p>
              <p className="font-medium text-white">{casTest.sous_module || "N/A"}</p>
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
              {projectMembers.map((member) => (
                <option key={member.id} value={member.nom}>
                  {member.nom} ({member.email})
                </option>
              ))}
            </select>
          </div>

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

          {/* Logs d'Erreur */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Logs d'Erreur
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              value={formData.fail_logs}
              onChange={(e) =>
                setFormData({ ...formData, fail_logs: e.target.value })
              }
              placeholder="Collez les logs d'erreur si le test a échoué"
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statut_test: e.target.value as StatutTest,
                  })
                }
              >
                <option value="Non exécuté">Non exécuté</option>
                <option value="Réussi">Réussi</option>
                <option value="Échoué">Échoué</option>
                <option value="Bloqué">Bloqué</option>
              </select>
            </div>
          </div>

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
