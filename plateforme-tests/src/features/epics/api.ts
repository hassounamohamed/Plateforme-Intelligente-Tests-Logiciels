import axiosInstance from "@/lib/axios";
import {
  Epic,
  CreateEpicPayload,
  UpdateEpicPayload,
  ChangeStatusPayload,
  ChangePriorityPayload,
  EpicStatus,
} from "@/types";

/**
 * Get all epics for a project
 */
export const getEpics = async (
  projectId: number,
  status?: EpicStatus,
  suppressErrorLog?: boolean
): Promise<Epic[]> => {
  const params = status ? { statut: status } : {};
  const response = await axiosInstance.get<Epic[]>(
    `/projets/${projectId}/epics`,
    { params, suppressErrorLog }
  );
  return response.data;
};

/**
 * Get a single epic by ID
 */
export const getEpicById = async (
  projectId: number,
  epicId: number
): Promise<Epic> => {
  const response = await axiosInstance.get<Epic>(
    `/projets/${projectId}/epics/${epicId}`
  );
  return response.data;
};

/**
 * Create a new epic in a project
 */
export const createEpic = async (
  projectId: number,
  payload: CreateEpicPayload
): Promise<Epic> => {
  const response = await axiosInstance.post<Epic>(
    `/projets/${projectId}/epics`,
    payload
  );
  return response.data;
};

/**
 * Update an existing epic
 */
export const updateEpic = async (
  projectId: number,
  epicId: number,
  payload: UpdateEpicPayload
): Promise<Epic> => {
  const response = await axiosInstance.put<Epic>(
    `/projets/${projectId}/epics/${epicId}`,
    payload
  );
  return response.data;
};

/**
 * Change epic status
 */
export const changeEpicStatus = async (
  projectId: number,
  epicId: number,
  payload: ChangeStatusPayload
): Promise<Epic> => {
  const response = await axiosInstance.patch<Epic>(
    `/projets/${projectId}/epics/${epicId}/statut`,
    payload
  );
  return response.data;
};

/**
 * Change epic priority
 */
export const changeEpicPriority = async (
  projectId: number,
  epicId: number,
  payload: ChangePriorityPayload
): Promise<Epic> => {
  const response = await axiosInstance.patch<Epic>(
    `/projets/${projectId}/epics/${epicId}/priorite`,
    payload
  );
  return response.data;
};

/**
 * Delete an epic
 */
export const deleteEpic = async (
  projectId: number,
  epicId: number
): Promise<void> => {
  await axiosInstance.delete(
    `/projets/${projectId}/epics/${epicId}`
  );
};
