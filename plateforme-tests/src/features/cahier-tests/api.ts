import axiosInstance from "@/lib/axios";
import {
  CahierTestGlobal,
  CahierTestGlobalDetail,
  CasTest,
  StatistiquesCahier,
  AIGeneration,
  AIGenerationDetail,
  GenererCahierPayload,
  CreateCasTestPayload,
  UpdateCasTestPayload,
  ValiderCahierPayload,
} from "@/types";

const getCahierBase = (projectId: number) => `/projets/${projectId}/cahier-tests`;

/**
 * ─── GÉNÉRATION IA (Asynchrone) ────────────────────────────────────────────
 */

/**
 * Déclencher la génération du cahier de tests via IA
 * Retourne immédiatement avec un job AIGeneration (status: pending)
 */
export const genererCahier = async (
  projectId: number,
  payload: GenererCahierPayload = {}
): Promise<AIGeneration | CahierTestGlobal> => {
  const response = await axiosInstance.post<AIGeneration | CahierTestGlobal>(
    `${getCahierBase(projectId)}/generate`,
    payload
  );
  return response.data;
};

/**
 * Lister tous les jobs de génération du cahier
 */
export const listGenerations = async (
  projectId: number
): Promise<AIGeneration[]> => {
  const response = await axiosInstance.get<AIGeneration[]>(
    `${getCahierBase(projectId)}/generations`
  );
  return response.data;
};

/**
 * Détail d'un job de génération avec progression et logs
 * Utiliser en polling pour suivre la génération
 */
export const getGeneration = async (
  projectId: number,
  generationId: number
): Promise<AIGenerationDetail> => {
  const response = await axiosInstance.get<AIGenerationDetail>(
    `${getCahierBase(projectId)}/generations/${generationId}`
  );
  return response.data;
};

/**
 * ─── RÉCUPÉRATION DU CAHIER ────────────────────────────────────────────────
 */

/**
 * Récupérer le résumé du cahier de tests
 */
export const getCahier = async (
  projectId: number
): Promise<CahierTestGlobal> => {
  const response = await axiosInstance.get<CahierTestGlobal>(
    `${getCahierBase(projectId)}`,
    { suppressErrorLog: true }
  );
  return response.data;
};

/**
 * Récupérer le cahier complet avec tous les cas de tests
 */
export const getCahierDetail = async (
  projectId: number
): Promise<CahierTestGlobalDetail> => {
  const response = await axiosInstance.get<CahierTestGlobalDetail>(
    `${getCahierBase(projectId)}/detail`,
    { suppressErrorLog: true }
  );
  return response.data;
};

/**
 * Statistiques du cahier (réussi, échoué, bloqué, non exécuté)
 */
export const getStatistiques = async (
  projectId: number
): Promise<StatistiquesCahier> => {
  const response = await axiosInstance.get<StatistiquesCahier>(
    `${getCahierBase(projectId)}/stats`,
    { suppressErrorLog: true }
  );
  return response.data;
};

/**
 * ─── GESTION DES CAS DE TESTS ──────────────────────────────────────────────
 */

/**
 * Lister tous les cas de tests du cahier
 */
export const listCasTests = async (
  projectId: number,
  cahierId: number
): Promise<CasTest[]> => {
  const response = await axiosInstance.get<CasTest[]>(
    `${getCahierBase(projectId)}/${cahierId}/cas-tests`
  );
  return response.data;
};

/**
 * Modifier un cas de test (résultat, statut, logs, commentaire, etc.)
 */
export const updateCasTest = async (
  projectId: number,
  cahierId: number,
  casId: number,
  payload: UpdateCasTestPayload
): Promise<CasTest> => {
  const response = await axiosInstance.patch<CasTest>(
    `${getCahierBase(projectId)}/${cahierId}/cas-tests/${casId}`,
    payload
  );
  return response.data;
};

/**
 * Créer un cas de test manuel
 */
export const createCasTest = async (
  projectId: number,
  cahierId: number,
  payload: CreateCasTestPayload
): Promise<CasTest> => {
  const response = await axiosInstance.post<CasTest>(
    `${getCahierBase(projectId)}/${cahierId}/cas-tests`,
    payload
  );
  return response.data;
};

/**
 * Uploader une capture d'écran pour un cas de test
 */
export const uploadCasTestCapture = async (
  projectId: number,
  cahierId: number,
  casId: number,
  file: File
): Promise<CasTest> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post<CasTest>(
    `${getCahierBase(projectId)}/${cahierId}/cas-tests/${casId}/capture`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

/**
 * Construire l'URL de la capture d'écran d'un cas de test (requiert auth)
 */
export const getCasTestCaptureUrl = (
  projectId: number,
  cahierId: number,
  casId: number
): string =>
  `${getCahierBase(projectId)}/${cahierId}/cas-tests/${casId}/capture`;

/**
 * ─── VALIDATION ────────────────────────────────────────────────────────────
 */

/**
 * Valider le cahier (passage en statut "valide")
 */
export const validerCahier = async (
  projectId: number,
  cahierId: number,
  payload: ValiderCahierPayload = {}
): Promise<CahierTestGlobal> => {
  const response = await axiosInstance.patch<CahierTestGlobal>(
    `${getCahierBase(projectId)}/${cahierId}/valider`,
    payload
  );
  return response.data;
};

/**
 * ─── EXPORTS ───────────────────────────────────────────────────────────────
 */

/**
 * Exporter le cahier en Excel (.xlsx)
 */
export const exporterExcel = async (
  projectId: number,
  cahierId: number
): Promise<Blob> => {
  const response = await axiosInstance.get(
    `${getCahierBase(projectId)}/${cahierId}/export/excel`,
    {
      responseType: "blob",
    }
  );
  return response.data;
};

/**
 * Exporter le cahier en Word (.docx)
 */
export const exporterWord = async (
  projectId: number,
  cahierId: number
): Promise<Blob> => {
  const response = await axiosInstance.get(
    `${getCahierBase(projectId)}/${cahierId}/export/word`,
    {
      responseType: "blob",
    }
  );
  return response.data;
};

/**
 * Exporter le cahier en PDF
 */
export const exporterPDF = async (
  projectId: number,
  cahierId: number
): Promise<Blob> => {
  const response = await axiosInstance.get(
    `${getCahierBase(projectId)}/${cahierId}/export/pdf`,
    {
      responseType: "blob",
    }
  );
  return response.data;
};

/**
 * Helper pour télécharger un fichier binaire
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
