import axiosInstance from "@/lib/axios";
import {
  BacklogItem,
  BacklogIndicateurs,
  ReordonnancerBacklogPayload,
} from "@/types";

export interface BacklogAISuggestionResponse {
  titre?: string | null;
  role?: string | null;
  action?: string | null;
  benefice?: string | null;
  criteresAcceptation?: string | null;
  priorite?: "must_have" | "should_have" | "could_have" | "wont_have" | null;
  points?: number | null;
  duree_estimee?: number | null;
}

/**
 * Obtenir le backlog d'un projet
 */
export const getBacklog = async (
  projectId: number,
  params?: {
    module_id?: number;
    epic_id?: number;
    statut?: string;
    priorite?: string;
    non_planifiees?: boolean;
    tri?: "priorite" | "points" | "ordre" | "statut";
  }
): Promise<BacklogItem[]> => {
  const response = await axiosInstance.get<BacklogItem[]>(
    `/projets/${projectId}/backlog`,
    { params }
  );
  return response.data;
};

/**
 * Obtenir les indicateurs du backlog
 */
export const getBacklogIndicateurs = async (
  projectId: number
): Promise<BacklogIndicateurs> => {
  const response = await axiosInstance.get<BacklogIndicateurs>(
    `/projets/${projectId}/backlog/indicateurs`
  );
  return response.data;
};

/**
 * Réordonner le backlog (drag & drop)
 */
export const reordonnancerBacklog = async (
  projectId: number,
  payload: ReordonnancerBacklogPayload
): Promise<BacklogItem[]> => {
  const response = await axiosInstance.patch<BacklogItem[]>(
    `/projets/${projectId}/backlog/reordonner`,
    { ordre: payload.ordre_ids }
  );
  return response.data;
};

/**
 * Suggérer des champs de user story backlog via IA
 */
export const suggestBacklogItem = async (
  projectId: number,
  prompt: string
): Promise<BacklogAISuggestionResponse> => {
  const response = await axiosInstance.post<BacklogAISuggestionResponse>(
    `/projets/${projectId}/backlog/ai-suggestion`,
    { prompt }
  );
  return response.data;
};
