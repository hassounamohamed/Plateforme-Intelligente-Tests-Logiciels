import axiosInstance from "@/lib/axios";
import {
  Sprint,
  CreateSprintPayload,
  UpdateSprintPayload,
  AddUserStoriesToSprintPayload,
  RemoveUserStoriesFromSprintPayload,
  SprintVelocite,
} from "@/types";

/**
 * Créer un nouveau sprint
 */
export const createSprint = async (
  projectId: number,
  payload: CreateSprintPayload
): Promise<Sprint> => {
  const response = await axiosInstance.post<Sprint>(
    `/projets/${projectId}/sprints`,
    payload
  );
  return response.data;
};

/**
 * Obtenir tous les sprints d'un projet
 */
export const getSprints = async (projectId: number): Promise<Sprint[]> => {
  const response = await axiosInstance.get<Sprint[]>(
    `/projets/${projectId}/sprints`
  );
  return response.data;
};

/**
 * Obtenir le sprint actif d'un projet
 */
export const getActiveSprint = async (projectId: number): Promise<Sprint> => {
  const response = await axiosInstance.get<Sprint>(
    `/projets/${projectId}/sprints/actif`
  );
  return response.data;
};

/**
 * Obtenir un sprint par ID
 */
export const getSprintById = async (
  projectId: number,
  sprintId: number
): Promise<Sprint> => {
  const response = await axiosInstance.get<Sprint>(
    `/projets/${projectId}/sprints/${sprintId}`
  );
  return response.data;
};

/**
 * Modifier un sprint
 */
export const updateSprint = async (
  projectId: number,
  sprintId: number,
  payload: UpdateSprintPayload
): Promise<Sprint> => {
  const response = await axiosInstance.put<Sprint>(
    `/projets/${projectId}/sprints/${sprintId}`,
    payload
  );
  return response.data;
};

/**
 * Supprimer un sprint
 */
export const deleteSprint = async (
  projectId: number,
  sprintId: number
): Promise<{ message: string }> => {
  const response = await axiosInstance.delete<{ message: string }>(
    `/projets/${projectId}/sprints/${sprintId}`
  );
  return response.data;
};

/**
 * Démarrer un sprint (changer le statut à "en_cours")
 */
export const startSprint = async (
  projectId: number,
  sprintId: number
): Promise<Sprint> => {
  const response = await axiosInstance.patch<Sprint>(
    `/projets/${projectId}/sprints/${sprintId}/demarrer`
  );
  return response.data;
};

/**
 * Clôturer un sprint (changer le statut à "termine")
 */
export const closeSprint = async (
  projectId: number,
  sprintId: number
): Promise<Sprint> => {
  const response = await axiosInstance.patch<Sprint>(
    `/projets/${projectId}/sprints/${sprintId}/cloturer`
  );
  return response.data;
};

/**
 * Ajouter des user stories au sprint
 */
export const addUserStoriesToSprint = async (
  projectId: number,
  sprintId: number,
  payload: AddUserStoriesToSprintPayload
): Promise<Sprint> => {
  const response = await axiosInstance.post<Sprint>(
    `/projets/${projectId}/sprints/${sprintId}/userstories`,
    payload
  );
  return response.data;
};

/**
 * Retirer des user stories du sprint
 */
export const removeUserStoriesFromSprint = async (
  projectId: number,
  sprintId: number,
  payload: RemoveUserStoriesFromSprintPayload
): Promise<Sprint> => {
  const response = await axiosInstance.delete<Sprint>(
    `/projets/${projectId}/sprints/${sprintId}/userstories`,
    { data: payload }
  );
  return response.data;
};

/**
 * Calculer la vélocité du sprint
 */
export const getSprintVelocite = async (
  projectId: number,
  sprintId: number
): Promise<SprintVelocite> => {
  const response = await axiosInstance.get<SprintVelocite>(
    `/projets/${projectId}/sprints/${sprintId}/velocite`
  );
  return response.data;
};
