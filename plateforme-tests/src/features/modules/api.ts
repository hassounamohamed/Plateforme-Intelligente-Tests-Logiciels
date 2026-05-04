import axiosInstance from "@/lib/axios";
import {
  Module,
  CreateModulePayload,
  UpdateModulePayload,
} from "@/types";

/**
 * Deduplicate modules by name (case-insensitive), keeping the one with the most complete data
 */
const deduplicateModules = (modules: Module[]): Module[] => {
  const uniqueByName = new Map<string, Module>();
  
  for (const module of modules) {
    // Normalize name for comparison (lowercase, trim)
    const normalizedName = module.nom.toLowerCase().trim();
    const existing = uniqueByName.get(normalizedName);
    
    if (!existing) {
      uniqueByName.set(normalizedName, module);
    } else {
      // Keep the one with description, or the one with higher ID (more recent)
      const shouldReplace =
        (module.description && !existing.description) ||
        (module.id > existing.id && !existing.description);
      
      if (shouldReplace) {
        uniqueByName.set(normalizedName, module);
      }
    }
  }
  
  return Array.from(uniqueByName.values());
};

/**
 * Get all modules for a project with hierarchy
 */
export const getModules = async (projectId: number): Promise<Module[]> => {
  const response = await axiosInstance.get<Module[]>(
    `/projets/${projectId}/modules`
  );
  return deduplicateModules(response.data);
};

/**
 * Get a single module by ID
 */
export const getModuleById = async (
  projectId: number,
  moduleId: number
): Promise<Module> => {
  const response = await axiosInstance.get<Module>(
    `/projets/${projectId}/modules/${moduleId}`
  );
  return response.data;
};

/**
 * Create a new module in a project
 */
export const createModule = async (
  projectId: number,
  payload: CreateModulePayload
): Promise<Module> => {
  const response = await axiosInstance.post<Module>(
    `/projets/${projectId}/modules`,
    payload
  );
  return response.data;
};

/**
 * Update an existing module
 */
export const updateModule = async (
  projectId: number,
  moduleId: number,
  payload: UpdateModulePayload
): Promise<Module> => {
  const response = await axiosInstance.put<Module>(
    `/projets/${projectId}/modules/${moduleId}`,
    payload
  );
  return response.data;
};

/**
 * Delete a module
 */
export const deleteModule = async (
  projectId: number,
  moduleId: number
): Promise<void> => {
  await axiosInstance.delete(`/projets/${projectId}/modules/${moduleId}`);
};

/**
 * Reorder modules
 */
export const reorderModules = async (
  projectId: number,
  ordre: number[]
): Promise<Module[]> => {
  const response = await axiosInstance.patch<Module[]>(
    `/projets/${projectId}/modules/reordonner`,
    { ordre }
  );
  return response.data;
};
