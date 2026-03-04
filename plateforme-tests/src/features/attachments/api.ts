
 import axiosInstance from "@/lib/axios";
import { Attachment } from "@/types";

/**
 * Upload an attachment to a project
 */
export const uploadProjectAttachment = async (
  projectId: number,
  file: File
): Promise<Attachment> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<Attachment>(
    `/projets/${projectId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * Get all attachments for a project
 */
export const getProjectAttachments = async (
  projectId: number
): Promise<Attachment[]> => {
  const response = await axiosInstance.get<Attachment[]>(
    `/projets/${projectId}/attachments`
  );
  return response.data;
};

/**
 * Download an attachment
 */
export const downloadAttachment = async (attachmentId: number): Promise<void> => {
  const response = await axiosInstance.get(
    `/attachments/${attachmentId}/download`,
    {
      responseType: "blob",
    }
  );
  
  // Create a download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  
  // Try to get filename from Content-Disposition header
  const contentDisposition = response.headers["content-disposition"];
  let filename = "download";
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }
  
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Delete an attachment
 */
export const deleteAttachment = async (attachmentId: number): Promise<void> => {
  await axiosInstance.delete(`/attachments/${attachmentId}`);
};

/**
 * Upload an attachment to an epic
 */
export const uploadEpicAttachment = async (
  projectId: number,
  moduleId: number,
  epicId: number,
  file: File
): Promise<Attachment> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<Attachment>(
    `/projets/${projectId}/modules/${moduleId}/epics/${epicId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * Get all attachments for an epic
 */
export const getEpicAttachments = async (
  projectId: number,
  moduleId: number,
  epicId: number
): Promise<Attachment[]> => {
  const response = await axiosInstance.get<Attachment[]>(
    `/projets/${projectId}/modules/${moduleId}/epics/${epicId}/attachments`
  );
  return response.data;
};

/**
 * Upload an attachment to a user story
 */
export const uploadUserStoryAttachment = async (
  projectId: number,
  moduleId: number,
  epicId: number,
  userStoryId: number,
  file: File
): Promise<Attachment> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<Attachment>(
    `/projets/${projectId}/modules/${moduleId}/epics/${epicId}/userstories/${userStoryId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * Get all attachments for a user story
 */
export const getUserStoryAttachments = async (
  projectId: number,
  moduleId: number,
  epicId: number,
  userStoryId: number
): Promise<Attachment[]> => {
  const response = await axiosInstance.get<Attachment[]>(
    `/projets/${projectId}/modules/${moduleId}/epics/${epicId}/userstories/${userStoryId}/attachments`
  );
  return response.data;
};
