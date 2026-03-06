import axiosInstance from "@/lib/axios";
import {
  AIGeneration,
  AIGenerationDetail,
  AIGeneratedItem,
  ApplyGenerationResult,
  UpdateAIItemPayload,
  AIItemStatus,
} from "@/types";

const base = (projectId: number) => `/projets/${projectId}/ai`;

/** Lancer une nouvelle génération IA */
export const startGeneration = async (
  projectId: number
): Promise<AIGeneration> => {
  const response = await axiosInstance.post<AIGeneration>(
    `${base(projectId)}/generate`
  );
  return response.data;
};

/** Lister les générations d'un projet */
export const listGenerations = async (
  projectId: number
): Promise<AIGeneration[]> => {
  const response = await axiosInstance.get<AIGeneration[]>(
    `${base(projectId)}/generations`
  );
  return response.data;
};

/** Détail d'une génération (avec logs et items) */
export const getGenerationDetail = async (
  projectId: number,
  generationId: number
): Promise<AIGenerationDetail> => {
  const response = await axiosInstance.get<AIGenerationDetail>(
    `${base(projectId)}/generations/${generationId}`
  );
  return response.data;
};

/** Items hiérarchiques d'une génération (Modules → Epics → User Stories) */
export const getGenerationItems = async (
  projectId: number,
  generationId: number
): Promise<AIGeneratedItem[]> => {
  const response = await axiosInstance.get<AIGeneratedItem[]>(
    `${base(projectId)}/generations/${generationId}/items`
  );
  return response.data;
};

/** Modifier le contenu d'un item généré */
export const updateItem = async (
  projectId: number,
  generationId: number,
  itemId: number,
  payload: UpdateAIItemPayload
): Promise<AIGeneratedItem> => {
  const response = await axiosInstance.patch<AIGeneratedItem>(
    `${base(projectId)}/generations/${generationId}/items/${itemId}`,
    payload
  );
  return response.data;
};

/** Changer le statut d'un item (approve / reject / modified) */
export const updateItemStatus = async (
  projectId: number,
  generationId: number,
  itemId: number,
  status: AIItemStatus
): Promise<AIGeneratedItem> => {
  const response = await axiosInstance.patch<AIGeneratedItem>(
    `${base(projectId)}/generations/${generationId}/items/${itemId}/status`,
    { status }
  );
  return response.data;
};

/** Appliquer la génération au backlog (créer modules / epics / user stories) */
export const applyGeneration = async (
  projectId: number,
  generationId: number
): Promise<ApplyGenerationResult> => {
  const response = await axiosInstance.post<ApplyGenerationResult>(
    `${base(projectId)}/generations/${generationId}/apply`
  );
  return response.data;
};
