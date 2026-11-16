import type { BatchResponseDTO, ExpandSampleRequestDTO, RegisterBatchRequestDTO } from "../types/batch";
import { apiDelete, apiGet, apiPost } from "./apiClient";

export function registerBatch(request: RegisterBatchRequestDTO): Promise<BatchResponseDTO> {
  return apiPost<RegisterBatchRequestDTO, BatchResponseDTO>("/api/batches", request);
}

/** Own batches in state ABIERTO or EN_EVALUACION. */
export function listAvailableBatches(): Promise<BatchResponseDTO[]> {
  return apiGet<BatchResponseDTO[]>("/api/batches");
}

export function getBatchByCode(code: string): Promise<BatchResponseDTO> {
  return apiGet<BatchResponseDTO>(`/api/batches/${encodeURIComponent(code)}`);
}

/** HU-05: Consult evaluated and reported batches of the current user. */
export function consultEvaluatedBatches(): Promise<BatchResponseDTO[]> {
  return apiGet<BatchResponseDTO[]>("/api/batches/evaluated");
}

/** HU-09: Logically deletes an own batch alongside its reports (DS-HU9). */
export function requestDeleteBatch(code: string): Promise<void> {
  return apiDelete<void>(`/api/batches/${encodeURIComponent(code)}`);
}

/** HU-13: Expands sample units of an evaluated or reported batch (DS-HU13). */
export function expandSample(code: string, request: ExpandSampleRequestDTO): Promise<BatchResponseDTO> {
  return apiPost<ExpandSampleRequestDTO, BatchResponseDTO>(`/api/batches/${encodeURIComponent(code)}/expand`, request);
}
