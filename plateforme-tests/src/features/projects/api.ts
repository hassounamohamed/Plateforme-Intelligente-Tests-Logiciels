import axiosInstance from "@/lib/axios";
import {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "@/types";

const BASE_URL = "/projets";

/**
 * Fetch all projects owned by the current user (Product Owner)
 */
export const getMyProjects = async (): Promise<Project[]> => {
  const response = await axiosInstance.get<Project[]>(`${BASE_URL}/mes-projets`);
  return response.data;
};

/**
 * Fetch all projects where the current user is a member (for Scrum Master, Developers, etc.)
 */
export const getMyProjectsAsMember = async (): Promise<Project[]> => {
  const response = await axiosInstance.get<Project[]>(`${BASE_URL}/mes-projets-membre`);
  return response.data;
};

/**
 * Fetch all projects (Super Admin only)
 */
export const getAllProjects = async (): Promise<Project[]> => {
  const response = await axiosInstance.get<Project[]>(BASE_URL);
  return response.data;
};

/**
 * Get a single project by ID
 */
export const getProjectById = async (projectId: number): Promise<Project> => {
  const response = await axiosInstance.get<Project>(`${BASE_URL}/${projectId}`);
  return response.data;
};

/**
 * Create a new project
 */
export const createProject = async (
  payload: CreateProjectPayload
): Promise<Project> => {
  const response = await axiosInstance.post<Project>(BASE_URL, payload);
  return response.data;
};

/**
 * Update an existing project
 */
export const updateProject = async (
  projectId: number,
  payload: UpdateProjectPayload
): Promise<Project> => {
  const response = await axiosInstance.put<Project>(
    `${BASE_URL}/${projectId}`,
    payload
  );
  return response.data;
};

/**
 * Archive a project
 */
export const archiveProject = async (projectId: number): Promise<Project> => {
  const response = await axiosInstance.patch<Project>(
    `${BASE_URL}/${projectId}/archiver`
  );
  return response.data;
};

/**
 * Assign members to a project
 */
export const assignMembers = async (
  projectId: number,
  memberIds: number[]
): Promise<Project> => {
  const response = await axiosInstance.post<Project>(
    `${BASE_URL}/${projectId}/membres`,
    { membre_ids: memberIds }
  );
  return response.data;
};

/**
 * Get available members for project assignment (Product Owner accessible)
 */
export const getAvailableMembers = async (): Promise<any[]> => {
  const response = await axiosInstance.get<any[]>(
    `${BASE_URL}/membres-disponibles`
  );
  return response.data;
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: number): Promise<void> => {
  await axiosInstance.delete(`${BASE_URL}/${projectId}`);
};
