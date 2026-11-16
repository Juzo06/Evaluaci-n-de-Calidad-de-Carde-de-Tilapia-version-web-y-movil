package co.unillanos.secct.usecases.dto;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.Evaluation;
import co.unillanos.secct.entities.Report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;

/** Detailed report view returned by HU-06 (live preview) and HU-11 (saved version). */
public record ReportResponseDTO(
        Integer reportId,
        Integer version,
        String batchCode,
        LocalDate captureDate,
        BigDecimal weightKg,
        Integer sampleUnitCount,
        String notes,
        ReportStatistics statistics,
        List<EvaluationResponseDTO> units,
        String chartImage
) {

    public static ReportResponseDTO from(Batch batch,
                                         List<Evaluation> evaluations,
                                         ReportStatistics statistics,
                                         byte[] chartPng) {
        List<EvaluationResponseDTO> unitDTOs = evaluations == null
                ? List.of()
                : evaluations.stream().map(EvaluationResponseDTO::from).toList();

        return new ReportResponseDTO(
                null,
                null,
                batch.getCode(),
                batch.getCaptureDate(),
                batch.getWeightKg(),
                batch.getSampleUnitCount(),
                batch.getNotes(),
                statistics,
                unitDTOs,
                toChartDataUrl(chartPng)
        );
    }

    public static ReportResponseDTO fromSaved(Report report, byte[] chartPng) {
        Batch batch = report.getBatch();
        return new ReportResponseDTO(
                report.getId(),
                report.getVersion(),
                batch.getCode(),
                batch.getCaptureDate(),
                batch.getWeightKg(),
                report.getEvaluationCount(),
                batch.getNotes(),
                ReportStatistics.fromJson(report.getStatistics()),
                List.of(),
                toChartDataUrl(chartPng)
        );
    }

    private static String toChartDataUrl(byte[] chartPng) {
        if (chartPng == null || chartPng.length == 0) {
            return null;
        }
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(chartPng);
    }
}
