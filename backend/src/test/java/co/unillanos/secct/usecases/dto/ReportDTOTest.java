package co.unillanos.secct.usecases.dto;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.BatchStatus;
import co.unillanos.secct.entities.Evaluation;
import co.unillanos.secct.entities.FishPart;
import co.unillanos.secct.entities.Report;
import co.unillanos.secct.entities.Role;
import co.unillanos.secct.entities.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Map;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ReportDTOTest {

    @Test
    @DisplayName("ReportStatistics serializa a JSON y normaliza las 5 categorias al deserializar")
    void reportStatisticsRoundTripAndNormalization() {
        ReportStatistics original = new ReportStatistics(
                5L,
                new BigDecimal("4.20"),
                new BigDecimal("4.40"),
                new BigDecimal("4.00"),
                Map.of((short) 4, 3L, (short) 5, 2L)
        );

        String json = original.toJson();
        ReportStatistics parsed = ReportStatistics.fromJson(json);

        assertThat(parsed.evaluationCount()).isEqualTo(5L);
        assertThat(parsed.finalClassification()).isEqualByComparingTo("4.20");
        assertThat(parsed.eyeAverage()).isEqualByComparingTo("4.40");
        assertThat(parsed.skinAverage()).isEqualByComparingTo("4.00");
        assertThat(parsed.countByCategory()).containsEntry((short) 1, 0L)
                .containsEntry((short) 2, 0L)
                .containsEntry((short) 3, 0L)
                .containsEntry((short) 4, 3L)
                .containsEntry((short) 5, 2L);

        ReportStatistics fromNull = ReportStatistics.fromJson(null);
        assertThat(fromNull.evaluationCount()).isZero();
        assertThat(fromNull.countByCategory()).hasSize(5);
    }

    @Test
    @DisplayName("ReportResponseDTO.from construye vista en vivo con unidades y chartImage Base64")
    void reportResponseFromLiveBatchAndEvaluations() {
        Batch batch = createBatch(BatchStatus.EVALUATED, 6);
        Evaluation evaluation = new Evaluation(batch, "img-ref-1");
        ReflectionTestUtils.setField(evaluation, "id", 101);
        evaluation.addPoint(fishPart((short) 1, "OJO"), (short) 5, new BigDecimal("0.95"));
        evaluation.addPoint(fishPart((short) 2, "PIEL"), (short) 4, new BigDecimal("0.88"));

        ReportStatistics stats = new ReportStatistics(
                1L,
                new BigDecimal("4.50"),
                new BigDecimal("5.00"),
                new BigDecimal("4.00"),
                Map.of((short) 4, 1L, (short) 5, 1L)
        );

        byte[] fakePng = "png".getBytes(StandardCharsets.US_ASCII);
        ReportResponseDTO dto = ReportResponseDTO.from(batch, List.of(evaluation), stats, fakePng);

        assertThat(dto.reportId()).isNull();
        assertThat(dto.version()).isNull();
        assertThat(dto.batchCode()).isEqualTo("SECCT-20261115-001");
        assertThat(dto.sampleUnitCount()).isEqualTo(6);
        assertThat(dto.units()).hasSize(1);
        assertThat(dto.units().get(0).results).hasSize(2);
        assertThat(dto.chartImage()).startsWith("data:image/png;base64,");
    }

    @Test
    @DisplayName("ReportResponseDTO.fromSaved y ReportSummaryDTO.from usan datos congelados del Report")
    void reportResponseFromSavedAndSummaryDto() {
        Batch batch = createBatch(BatchStatus.REPORTED, 8);
        ReportStatistics stats = new ReportStatistics(
                4L,
                new BigDecimal("3.80"),
                new BigDecimal("3.90"),
                new BigDecimal("3.70"),
                Map.of((short) 3, 2L, (short) 4, 2L)
        );
        Report report = new Report(batch, 3, stats);
        ReflectionTestUtils.setField(report, "id", 55);

        ReportSummaryDTO summary = ReportSummaryDTO.from(report);
        assertThat(summary.id()).isEqualTo(55);
        assertThat(summary.batchCode()).isEqualTo("SECCT-20261115-001");
        assertThat(summary.version()).isEqualTo(3);
        assertThat(summary.current()).isTrue();
        assertThat(summary.finalClassification()).isEqualByComparingTo("3.80");
        assertThat(summary.generatedAt()).isNotNull();

        ReportResponseDTO savedDto = ReportResponseDTO.fromSaved(report, null);
        assertThat(savedDto.reportId()).isEqualTo(55);
        assertThat(savedDto.version()).isEqualTo(3);
        assertThat(savedDto.sampleUnitCount()).isEqualTo(4);
        assertThat(savedDto.units()).isEmpty();
        assertThat(savedDto.chartImage()).isNull();
    }

    private static Batch createBatch(String statusCode, int sampleUnits) {
        Role role = new Role((short) 2, "PISCICULTOR");
        User owner = new User(role, "Carlos", "Ruiz", "carlos@test.com", "3101234567", "hash", "salt");
        BatchStatus status = new BatchStatus((short) 3, statusCode);
        Batch batch = new Batch("SECCT-20261115-001", LocalDate.of(2026, 11, 15),
                new BigDecimal("35.00"), sampleUnits, "Lote prueba", owner, status);
        ReflectionTestUtils.setField(batch, "id", 10);
        return batch;
    }

    private static FishPart fishPart(Short id, String code) {
        FishPart part = org.springframework.beans.BeanUtils.instantiateClass(FishPart.class);
        ReflectionTestUtils.setField(part, "id", id);
        ReflectionTestUtils.setField(part, "code", code);
        return part;
    }
}
