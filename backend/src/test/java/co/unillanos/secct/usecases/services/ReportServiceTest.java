package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.BatchStatus;
import co.unillanos.secct.entities.Evaluation;
import co.unillanos.secct.entities.FishPart;
import co.unillanos.secct.entities.Report;
import co.unillanos.secct.entities.Role;
import co.unillanos.secct.entities.User;
import co.unillanos.secct.infrastructure.repositories.BatchRepository;
import co.unillanos.secct.infrastructure.repositories.BatchStatusRepository;
import co.unillanos.secct.infrastructure.repositories.EvaluationRepository;
import co.unillanos.secct.infrastructure.repositories.ReportRepository;
import co.unillanos.secct.usecases.dto.ReportResponseDTO;
import co.unillanos.secct.usecases.dto.ReportStatistics;
import co.unillanos.secct.usecases.dto.ReportSummaryDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import co.unillanos.secct.usecases.ports.ReportGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private BatchStatusRepository statusRepository;

    @Mock
    private EvaluationRepository evaluationRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private ReportGenerator reportGenerator;

    @Mock
    private LogService logService;

    private ReportService reportService;

    private User owner;
    private BatchStatus openStatus;
    private BatchStatus evaluatedStatus;
    private BatchStatus reportedStatus;
    private ReportStatistics sampleStats;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(
                batchRepository,
                statusRepository,
                evaluationRepository,
                reportRepository,
                new ReportStatisticsCalculator(),
                reportGenerator,
                logService
        );

        Role role = new Role((short) 2, "PISCICULTOR");
        owner = new User(role, "Carlos", "Pérez", "carlos@correo.com", "3101234567", "hash", "salt");
        owner.setId(1);

        openStatus = new BatchStatus((short) 1, BatchStatus.OPEN);
        evaluatedStatus = new BatchStatus((short) 3, BatchStatus.EVALUATED);
        reportedStatus = new BatchStatus((short) 4, BatchStatus.REPORTED);

        sampleStats = new ReportStatistics(
                1L,
                new BigDecimal("3.50"),
                new BigDecimal("4.00"),
                new BigDecimal("3.00"),
                Map.of((short) 1, 0L, (short) 2, 0L, (short) 3, 0L, (short) 4, 1L, (short) 5, 0L)
        );
    }

    private Batch createBatch(Integer id, String code, BatchStatus status) {
        Batch batch = new Batch(code, LocalDate.of(2026, 10, 20),
                new BigDecimal("12.50"), 1, "Estanque 2", owner, status);
        ReflectionTestUtils.setField(batch, "id", id);
        if (BatchStatus.EVALUATED.equals(status.getCode()) || BatchStatus.REPORTED.equals(status.getCode())) {
            ReflectionTestUtils.setField(batch, "finalClassification", new BigDecimal("3.50"));
        }
        return batch;
    }

    private Evaluation createEvaluation(Batch batch) {
        FishPart eye = mock(FishPart.class);
        when(eye.getCode()).thenReturn("OJO");
        FishPart skin = mock(FishPart.class);
        when(skin.getCode()).thenReturn("PIEL");

        Evaluation evaluation = new Evaluation(batch, "sha256-unit-1");
        ReflectionTestUtils.setField(evaluation, "id", 41);
        ReflectionTestUtils.setField(evaluation, "evaluatedAt", OffsetDateTime.now());
        evaluation.addPoint(eye, (short) 4, new BigDecimal("0.93"));
        evaluation.addPoint(skin, (short) 3, new BigDecimal("0.88"));
        return evaluation;
    }

    @Test
    @DisplayName("HU-06 generate: genera vista previa del reporte con gráfica Base64 y evento REPORT_GENERATED")
    void generate_Success() {
        Batch batch = createBatch(10, "SECCT-20261020-001", evaluatedStatus);
        Evaluation evaluation = createEvaluation(batch);

        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-001", 1))
                .thenReturn(Optional.of(batch));
        when(evaluationRepository.findByBatchId(10)).thenReturn(List.of(evaluation));
        when(reportGenerator.renderChartPng(any(ReportStatistics.class))).thenReturn(new byte[]{1, 2, 3});

        ReportResponseDTO dto = reportService.generate("SECCT-20261020-001", 1);

        assertThat(dto.reportId()).isNull();
        assertThat(dto.version()).isNull();
        assertThat(dto.batchCode()).isEqualTo("SECCT-20261020-001");
        assertThat(dto.sampleUnitCount()).isEqualTo(1);
        assertThat(dto.units()).hasSize(1);
        assertThat(dto.chartImage()).startsWith("data:image/png;base64,");
        verify(logService).recordEvent(eq("REPORT_GENERATED"), eq(1), eq(10), isNull(), any());
    }

    @Test
    @DisplayName("HU-06 generate: lote ABIERTO lanza BusinessException 409")
    void generate_NotEvaluated_Throws409() {
        Batch batch = createBatch(10, "SECCT-20261020-001", openStatus);
        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-001", 1))
                .thenReturn(Optional.of(batch));

        assertThatThrownBy(() -> reportService.generate("SECCT-20261020-001", 1))
                .isInstanceOf(BusinessException.class)
                .hasMessage("El lote aún no está evaluado")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(409);
    }

    @Test
    @DisplayName("HU-06 generate: falla de ReportGenerator lanza BusinessException 500")
    void generate_GeneratorMissing_Throws500() {
        ReportService serviceWithoutGenerator = new ReportService(
                batchRepository, statusRepository, evaluationRepository, reportRepository,
                new ReportStatisticsCalculator(), (ReportGenerator) null, logService);
        Batch batch = createBatch(10, "SECCT-20261020-001", evaluatedStatus);

        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-001", 1))
                .thenReturn(Optional.of(batch));
        when(evaluationRepository.findByBatchId(10)).thenReturn(List.of());

        assertThatThrownBy(() -> serviceWithoutGenerator.generate("SECCT-20261020-001", 1))
                .isInstanceOf(BusinessException.class)
                .hasMessage("No se pudo generar el reporte")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(500);
    }

    @Test
    @DisplayName("HU-10 save: guarda nueva versión vigente, pasa lote a REPORTADO y registra REPORT_SAVED")
    void save_Success() {
        Batch batch = createBatch(10, "SECCT-20261020-001", evaluatedStatus);
        Evaluation evaluation = createEvaluation(batch);

        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-001", 1))
                .thenReturn(Optional.of(batch));
        when(evaluationRepository.findByBatchId(10)).thenReturn(List.of(evaluation));
        when(reportRepository.findMaxVersionByBatchId(10)).thenReturn(1);
        when(reportRepository.save(any(Report.class))).thenAnswer(inv -> {
            Report r = inv.getArgument(0);
            ReflectionTestUtils.setField(r, "id", 7);
            return r;
        });
        when(statusRepository.findByCode(BatchStatus.REPORTED)).thenReturn(Optional.of(reportedStatus));

        ReportSummaryDTO summary = reportService.save("SECCT-20261020-001", 1);

        assertThat(summary.id()).isEqualTo(7);
        assertThat(summary.version()).isEqualTo(2);
        assertThat(summary.current()).isTrue();
        assertThat(summary.batchCode()).isEqualTo("SECCT-20261020-001");
        assertThat(batch.getStatus()).isEqualTo(reportedStatus);
        verify(batchRepository).save(batch);
        verify(logService).recordEvent(eq("REPORT_SAVED"), eq(1), eq(10), isNull(), any());
    }

    @Test
    @DisplayName("HU-10 save: lote ya REPORTADO lanza BusinessException 409")
    void save_AlreadyReported_Throws409() {
        Batch batch = createBatch(10, "SECCT-20261020-001", reportedStatus);
        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-001", 1))
                .thenReturn(Optional.of(batch));

        assertThatThrownBy(() -> reportService.save("SECCT-20261020-001", 1))
                .isInstanceOf(BusinessException.class)
                .hasMessage("El lote no se puede reportar en su estado actual")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(409);

        verify(reportRepository, never()).save(any());
    }

    @Test
    @DisplayName("HU-11 listByOwner: lista versiones sin registrar log")
    void listByOwner_Success_NoLog() {
        Batch batch = createBatch(10, "SECCT-20261020-001", reportedStatus);
        Report r1 = new Report(batch, 1, sampleStats);
        ReflectionTestUtils.setField(r1, "id", 7);
        ReflectionTestUtils.setField(r1, "generatedAt", OffsetDateTime.now().minusDays(2));
        Report r2 = new Report(batch, 2, sampleStats);
        ReflectionTestUtils.setField(r2, "id", 9);
        ReflectionTestUtils.setField(r2, "generatedAt", OffsetDateTime.now());

        when(reportRepository.findByBatchOwnerIdAndIsDeletedFalse(1)).thenReturn(List.of(r1, r2));

        List<ReportSummaryDTO> result = reportService.listByOwner(1);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(9);
        assertThat(result.get(1).id()).isEqualTo(7);
        verify(logService, never()).recordEvent(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("HU-11 getById: lee estadísticas congeladas, regenera gráfica, units=[] y registra REPORT_VIEWED")
    void getById_Success() {
        Batch batch = createBatch(10, "SECCT-20261020-001", reportedStatus);
        Report report = new Report(batch, 2, sampleStats);
        ReflectionTestUtils.setField(report, "id", 9);

        when(reportRepository.findByIdAndBatchOwnerIdAndIsDeletedFalse(9, 1)).thenReturn(Optional.of(report));
        when(reportGenerator.renderChartPng(any(ReportStatistics.class))).thenReturn(new byte[]{4, 5, 6});

        ReportResponseDTO dto = reportService.getById(9, 1);

        assertThat(dto.reportId()).isEqualTo(9);
        assertThat(dto.version()).isEqualTo(2);
        assertThat(dto.sampleUnitCount()).isEqualTo(1);
        assertThat(dto.units()).isEmpty();
        assertThat(dto.chartImage()).startsWith("data:image/png;base64,");
        verify(logService).recordEvent(eq("REPORT_VIEWED"), eq(1), eq(10), isNull(), any());
    }

    @Test
    @DisplayName("HU-11 getById: reporte ajeno o inexistente lanza 404")
    void getById_NotFound_Throws404() {
        when(reportRepository.findByIdAndBatchOwnerIdAndIsDeletedFalse(99, 1)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reportService.getById(99, 1))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Reporte no encontrado")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(404);
    }

    @Test
    @DisplayName("HU-12 exportPdf y resolvePdfFilename: retorna bytes PDF, nombre de archivo y registra REPORT_EXPORTED")
    void exportPdf_Success() {
        Batch batch = createBatch(10, "SECCT-20261020-001", reportedStatus);
        Report report = new Report(batch, 2, sampleStats);
        ReflectionTestUtils.setField(report, "id", 9);
        byte[] expectedPdf = "%PDF-1.4".getBytes();

        when(reportRepository.findByIdAndBatchOwnerIdAndIsDeletedFalse(9, 1)).thenReturn(Optional.of(report));
        when(reportGenerator.exportPdf(report)).thenReturn(expectedPdf);

        byte[] pdf = reportService.exportPdf(9, 1);
        String filename = reportService.resolvePdfFilename(9, 1);

        assertThat(pdf).isEqualTo(expectedPdf);
        assertThat(filename).isEqualTo("reporte-SECCT-20261020-001-v2.pdf");
        verify(logService).recordEvent(eq("REPORT_EXPORTED"), eq(1), eq(10), isNull(), any());
    }

    @Test
    @DisplayName("HU-14 delete: al eliminar versión vigente, revierte el lote a EVALUADO y registra REPORT_DELETED")
    void delete_CurrentReport_RevertsBatchToEvaluated() {
        Batch batch = createBatch(10, "SECCT-20261020-001", reportedStatus);
        Report report = new Report(batch, 1, sampleStats);
        ReflectionTestUtils.setField(report, "id", 7);

        when(reportRepository.findByIdAndBatchOwnerIdAndIsDeletedFalse(7, 1)).thenReturn(Optional.of(report));
        when(statusRepository.findByCode(BatchStatus.EVALUATED)).thenReturn(Optional.of(evaluatedStatus));

        reportService.delete(7, 1);

        assertThat(report.isDeleted()).isTrue();
        assertThat(report.isCurrent()).isFalse();
        assertThat(report.getDeletedBy()).isEqualTo(1);
        assertThat(batch.getStatus()).isEqualTo(evaluatedStatus);
        verify(reportRepository).save(report);
        verify(batchRepository).save(batch);
        verify(logService).recordEvent(eq("REPORT_DELETED"), eq(1), eq(10), isNull(), any());
    }

    @Test
    @DisplayName("HU-14 delete: al eliminar versión histórica (current=false), no modifica el estado del lote")
    void delete_HistoricalReport_DoesNotRevertBatch() {
        Batch batch = createBatch(10, "SECCT-20261020-001", reportedStatus);
        Report report = new Report(batch, 1, sampleStats);
        report.markAsPrevious();
        ReflectionTestUtils.setField(report, "id", 7);

        when(reportRepository.findByIdAndBatchOwnerIdAndIsDeletedFalse(7, 1)).thenReturn(Optional.of(report));

        reportService.delete(7, 1);

        assertThat(report.isDeleted()).isTrue();
        verify(reportRepository).save(report);
        verify(batchRepository, never()).save(any());
        verify(statusRepository, never()).findByCode(any());
        verify(logService).recordEvent(eq("REPORT_DELETED"), eq(1), eq(10), isNull(), any());
    }
}
