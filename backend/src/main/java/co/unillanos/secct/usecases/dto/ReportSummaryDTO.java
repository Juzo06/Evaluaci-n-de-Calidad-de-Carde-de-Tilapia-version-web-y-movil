package co.unillanos.secct.usecases.dto;

import co.unillanos.secct.entities.Report;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** Summary item returned when saving (HU-10) or listing saved reports (HU-11). */
public record ReportSummaryDTO(
        Integer id,
        String batchCode,
        Integer version,
        boolean current,
        BigDecimal finalClassification,
        OffsetDateTime generatedAt
) {

    public static ReportSummaryDTO from(Report report) {
        return new ReportSummaryDTO(
                report.getId(),
                report.getBatch().getCode(),
                report.getVersion(),
                report.isCurrent(),
                report.getFinalClassification(),
                report.getGeneratedAt()
        );
    }
}
