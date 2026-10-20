import type { BatchResponseDTO, RegisterBatchRequestDTO } from "../types/batch";
import { apiPost } from "./apiClient";

export function registerBatch(request: RegisterBatchRequestDTO): Promise<BatchResponseDTO> {
  return apiPost<RegisterBatchRequestDTO, BatchResponseDTO>("/api/batches", request);
}
