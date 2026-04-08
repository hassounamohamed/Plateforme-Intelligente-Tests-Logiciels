"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAPIKey } from "./api-key-hooks";

/**
 * Component for managing user's custom API key for AI services
 * 
 * Features:
 * - Save/update API key (encrypted in backend)
 * - View masked API key (last 4 chars only)
 * - Toggle between custom and platform API keys
 * - Delete API key
 * - View API usage quota and limits
 * - Display alerts when quota is exhausted
 */
export function APIKeyManagement() {
  const {
    apiKeyStatus,
    apiKeyQuota,
    isLoading,
    error,
    successMessage,
    fetchAPIKeyStatus,
    saveAPIKey,
    toggleAPIKeyUsage,
    deleteAPIKey,
    clearError,
    clearSuccess,
  } = useAPIKey();

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch API key status on component mount
  useEffect(() => {
    fetchAPIKeyStatus();
  }, [fetchAPIKeyStatus]);

  // Handle save API key
  const handleSaveAPIKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      return;
    }

    setIsSaving(true);
    const success = await saveAPIKey(apiKeyInput.trim());
    setIsSaving(false);

    if (success) {
      setApiKeyInput("");
      setShowApiKeyInput(false);
    }
  };

  // Handle toggle API key
  const handleToggleAPIKey = async (useCustom: boolean) => {
    await toggleAPIKeyUsage(useCustom);
  };

  // Handle delete API key
  const handleDeleteAPIKey = async () => {
    setIsDeleting(true);
    const success = await deleteAPIKey();
    setIsDeleting(false);
    setShowDeleteConfirm(false);

    if (success) {
      setApiKeyInput("");
    }
  };

  if (isLoading && !apiKeyStatus) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="material-symbols-outlined animate-spin text-2xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  // Calculate quota display
  const quotaPercentage = apiKeyQuota?.quota_percentage ?? 0;
  const quotaColor =
    quotaPercentage >= 100
      ? "bg-red-500"
      : quotaPercentage >= 80
      ? "bg-yellow-500"
      : "bg-green-500";

  const currentKeyType = apiKeyStatus?.use_custom_api_key
    ? "Using your API key"
    : "Using platform key";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Clé API personnalisée
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Utilisez votre propre clé API pour les requêtes IA de débladage sans limite de quota.
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400 shrink-0">
            error
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            <button
              onClick={clearError}
              className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 shrink-0">
            check_circle
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">{successMessage}</p>
            <button
              onClick={clearSuccess}
              className="text-xs text-green-600 dark:text-green-400 hover:underline mt-1"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Quota Alert */}
      {apiKeyQuota?.quota_exhausted && !apiKeyStatus?.use_custom_api_key && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 shrink-0">
            warning
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
              Your free credits are exhausted. Please add your API key to continue.
            </p>
          </div>
        </div>
      )}

      {/* Current API Key Status */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Current key status</p>
            <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
              {currentKeyType}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                apiKeyStatus?.use_custom_api_key
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {apiKeyStatus?.use_custom_api_key ? "check_circle" : "info"}
              </span>
              {apiKeyStatus?.use_custom_api_key ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>

        {/* Timestamps */}
        {apiKeyStatus?.has_custom_key && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {apiKeyStatus.api_key_created_at && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Ajoutée le</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {new Date(apiKeyStatus.api_key_created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            )}
            {apiKeyStatus.api_key_last_used && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Dernière utilisation</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {new Date(apiKeyStatus.api_key_last_used).toLocaleDateString("fr-FR")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quota Information */}
      {apiKeyQuota && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Quota gratuit mensuel
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {apiKeyQuota.quota_used} / {apiKeyQuota.quota_limit_free}
            </p>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${quotaColor}`}
              style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {apiKeyQuota.quota_remaining} requêtes restantes
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Réinitialisation: {new Date(apiKeyQuota.next_reset_date || "").toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      )}

      {/* Add/Edit API Key Section */}
      {!apiKeyStatus?.has_custom_key || showApiKeyInput ? (
        <form onSubmit={handleSaveAPIKey} className="space-y-4">
          <Input
            label="Add your API key"
            type="password"
            placeholder="(votre clé API personnalisée)"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            hint="Votre clé API n'est jamais exposée. Elle est chiffrée et stockée en toute sécurité."
            error={apiKeyInput && apiKeyInput.length < 10 ? "La clé doit faire au moins 10 caractères" : undefined}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={!apiKeyInput.trim() || apiKeyInput.length < 10} isLoading={isSaving}>
              <span className="material-symbols-outlined">save</span>
              Save API key
            </Button>
            {showApiKeyInput && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowApiKeyInput(false);
                  setApiKeyInput("");
                }}
              >
                Annuler
              </Button>
            )}
          </div>
        </form>
      ) : (
        <>
          {/* Masked API Key Display */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Clé API sauvegardée</p>
                <p className="text-base font-mono text-slate-900 dark:text-white mt-1">
                  {apiKeyStatus?.masked_key || "••••••••"}
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-400">lock</span>
            </div>
          </div>

          {/* API Key Usage Toggle */}
          {apiKeyStatus?.has_custom_key && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Utiliser cette clé API
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleAPIKey(true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                    apiKeyStatus.use_custom_api_key
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined inline mr-2 text-[18px]">
                    {apiKeyStatus.use_custom_api_key ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  Ma clé API
                </button>
                <button
                  onClick={() => handleToggleAPIKey(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                    !apiKeyStatus.use_custom_api_key
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined inline mr-2 text-[18px]">
                    {!apiKeyStatus.use_custom_api_key ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  Clé plateforme
                </button>
              </div>
            </div>
          )}

          {/* Edit and Delete Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApiKeyInput(true)}
              leftIcon="edit"
              className="flex-1"
            >
              Modifier
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              leftIcon="delete"
              className="flex-1"
            >
              Supprimer
            </Button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <span className="material-symbols-outlined text-2xl text-red-600">warning</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Supprimer la clé API?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Après la suppression, vous utiliserez la clé API de la plateforme (avec quota limité).
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAPIKey}
                isLoading={isDeleting}
                className="flex-1"
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
