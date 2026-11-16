/** Response body returned by GET /api/admin/system-info (HU-07, DC-HU7). */
export interface SystemInfoResponseDTO {
  totalUsers: number;
  totalBatches: number;
  totalEvaluations: number;
}
