import type { SystemInfoResponseDTO } from "../types/admin";
import { apiGet } from "./apiClient";

/** HU-07: Retrieves global system counters for administrator monitoring (DS-HU7). */
export function getSystemInfo(): Promise<SystemInfoResponseDTO> {
  return apiGet<SystemInfoResponseDTO>("/api/admin/system-info");
}
