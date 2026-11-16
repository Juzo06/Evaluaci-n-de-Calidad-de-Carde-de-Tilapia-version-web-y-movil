import type { ReportResponseDTO, ReportSummaryDTO } from "../types/report";
import { apiDelete, apiGet, apiGetBlob, apiPost } from "./apiClient";

/** HU-06: Generates a live preview report for an evaluated or reported batch (DS-HU6). */
export function getBatchReport(code: string): Promise<ReportResponseDTO> {
  return apiGet<ReportResponseDTO>(`/api/reports/batches/${encodeURIComponent(code)}`);
}

/** HU-10: Saves an immutable report version for an evaluated batch (DS-HU10). */
export function saveReport(code: string): Promise<ReportSummaryDTO> {
  return apiPost<void, ReportSummaryDTO>(`/api/reports/batches/${encodeURIComponent(code)}`);
}

/** HU-11: Lists all saved non-deleted report versions owned by the authenticated user (DS-HU11). */
export function listSavedReports(): Promise<ReportSummaryDTO[]> {
  return apiGet<ReportSummaryDTO[]>("/api/reports");
}

/** HU-11: Retrieves a specific saved report version with reconstructed chart (DS-HU11). */
export function getSavedReport(id: number): Promise<ReportResponseDTO> {
  return apiGet<ReportResponseDTO>(`/api/reports/${id}`);
}

/** HU-12: Downloads the exported PDF binary and optional filename header for a saved report (DS-HU12). */
export function downloadReportPdf(id: number): Promise<{ blob: Blob; filename: string | null }> {
  return apiGetBlob(`/api/reports/${id}/pdf`);
}

/** HU-12: Triggers browser file download for a PDF blob using the suggested filename (DS-HU12). */
export function saveFile(blob: Blob, fallbackFilename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fallbackFilename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

/** HU-14: Logically deletes a saved report version (DS-HU14). */
export function requestDeleteReport(id: number): Promise<void> {
  return apiDelete<void>(`/api/reports/${id}`);
}
