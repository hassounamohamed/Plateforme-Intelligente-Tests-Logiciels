import axiosInstance from "@/lib/axios";
import {
  Anomalie,
  CreateAnomaliePayload,
  UpdateAnomaliePayload,
} from "@/types";

const getAnomaliesBase = (projectId: number) =>
  `/projets/${projectId}/anomalies`;

const getCasAnomaliesBase = (
  projectId: number,
  cahierId: number,
  casId: number
) =>
  `/projets/${projectId}/cahier-tests/${cahierId}/cas-tests/${casId}/anomalies`;

export const listAnomaliesProjet = async (
  projectId: number,
  statut?: string
): Promise<Anomalie[]> => {
  const response = await axiosInstance.get<Anomalie[]>(
    getAnomaliesBase(projectId),
    { params: statut ? { statut } : undefined }
  );
  return response.data;
};

export const listAnomaliesCasTest = async (
  projectId: number,
  cahierId: number,
  casId: number
): Promise<Anomalie[]> => {
  const response = await axiosInstance.get<Anomalie[]>(
    getCasAnomaliesBase(projectId, cahierId, casId)
  );
  return response.data;
};

export const createAnomalie = async (
  projectId: number,
  cahierId: number,
  casId: number,
  payload: CreateAnomaliePayload
): Promise<Anomalie> => {
  const response = await axiosInstance.post<Anomalie>(
    getCasAnomaliesBase(projectId, cahierId, casId),
    payload,
    { suppressErrorLog: true }
  );
  return response.data;
};

export const updateAnomalie = async (
  projectId: number,
  anomalieId: number,
  payload: UpdateAnomaliePayload
): Promise<Anomalie> => {
  const response = await axiosInstance.patch<Anomalie>(
    `${getAnomaliesBase(projectId)}/${anomalieId}`,
    payload
  );
  return response.data;
};

export const resolveAnomalie = async (
  projectId: number,
  anomalieId: number
): Promise<Anomalie> => {
  const response = await axiosInstance.post<Anomalie>(
    `${getAnomaliesBase(projectId)}/${anomalieId}/resolve`
  );
  return response.data;
};

export const assignAnomalie = async (
  projectId: number,
  anomalieId: number,
  assignedTo: number
): Promise<Anomalie> => {
  const response = await axiosInstance.post<Anomalie>(
    `${getAnomaliesBase(projectId)}/${anomalieId}/assign`,
    { assigned_to: assignedTo }
  );
  return response.data;
};

export const reopenAnomalie = async (
  projectId: number,
  anomalieId: number
): Promise<Anomalie> => {
  const response = await axiosInstance.post<Anomalie>(
    `${getAnomaliesBase(projectId)}/${anomalieId}/reopen`
  );
  return response.data;
};
