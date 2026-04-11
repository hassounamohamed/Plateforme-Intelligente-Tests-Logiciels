import axiosInstance from "@/lib/axios";
import {
  GenererRapportQAPayload,
  RapportQA,
  UpdateRapportQAPayload,
} from "@/types";

const getRapportBase = (projectId: number, cahierId: number) =>
  `/projets/${projectId}/rapports/cahier/${cahierId}`;

export const getRapportQA = async (
  projectId: number,
  cahierId: number
): Promise<RapportQA> => {
  const response = await axiosInstance.get<RapportQA>(
    getRapportBase(projectId, cahierId),
    { suppressErrorLog: true }
  );
  return response.data;
};

export const genererRapportQA = async (
  projectId: number,
  cahierId: number,
  payload: GenererRapportQAPayload
): Promise<RapportQA> => {
  const response = await axiosInstance.post<RapportQA>(
    `${getRapportBase(projectId, cahierId)}/generate`,
    payload
  );
  return response.data;
};

export const updateRapportQA = async (
  projectId: number,
  cahierId: number,
  payload: UpdateRapportQAPayload
): Promise<RapportQA> => {
  const response = await axiosInstance.patch<RapportQA>(
    getRapportBase(projectId, cahierId),
    payload
  );
  return response.data;
};

export const exporterRapportQAPdf = async (
  projectId: number,
  cahierId: number
): Promise<Blob> => {
  const response = await axiosInstance.get(
    `${getRapportBase(projectId, cahierId)}/export/pdf`,
    { responseType: "blob" }
  );
  return response.data;
};

export const exporterRapportQAWord = async (
  projectId: number,
  cahierId: number
): Promise<Blob> => {
  const response = await axiosInstance.get(
    `${getRapportBase(projectId, cahierId)}/export/word`,
    { responseType: "blob" }
  );
  return response.data;
};
