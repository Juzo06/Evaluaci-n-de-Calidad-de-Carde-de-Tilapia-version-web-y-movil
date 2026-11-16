import type { EvaluationResponseDTO } from "./evaluation";

/** Aggregated statistics of a batch evaluation returned by the backend. */
export interface ReportStatistics {
  evaluationCount: number;
  finalClassification: number;
  eyeAverage: number;
  skinAverage: number;
  countByCategory: Record<string, number>;
}

/** Unit evaluation summary contained in live report responses (HU-06). */
export type EvaluationUnitSummaryDTO = EvaluationResponseDTO;

/** Detailed report view returned by GET /api/reports/batches/{code} (HU-06) and GET /api/reports/{id} (HU-11). */
export interface ReportResponseDTO {
  reportId: number | null;
  version: number | null;
  batchCode: string;
  captureDate: string;
  weightKg: number;
  sampleUnitCount: number;
  notes: string | null;
  statistics: ReportStatistics;
  units: EvaluationUnitSummaryDTO[];
  chartImage: string | null;
}

/** Summary item returned by POST /api/reports/batches/{code} (HU-10) and GET /api/reports (HU-11). */
export interface ReportSummaryDTO {
  id: number;
  batchCode: string;
  version: number;
  current: boolean;
  finalClassification: number;
  generatedAt: string;
}
