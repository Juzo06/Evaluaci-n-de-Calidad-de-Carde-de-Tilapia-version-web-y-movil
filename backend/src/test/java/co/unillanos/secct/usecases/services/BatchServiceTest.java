package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.BatchStatus;
import co.unillanos.secct.entities.Report;
import co.unillanos.secct.entities.Role;
import co.unillanos.secct.entities.User;
import co.unillanos.secct.infrastructure.repositories.BatchEvaluationCount;
import co.unillanos.secct.infrastructure.repositories.BatchRepository;
import co.unillanos.secct.infrastructure.repositories.BatchStatusRepository;
import co.unillanos.secct.infrastructure.repositories.EvaluationRepository;
import co.unillanos.secct.infrastructure.repositories.ReportRepository;
import co.unillanos.secct.infrastructure.repositories.UserRepository;
import co.unillanos.secct.usecases.dto.BatchResponseDTO;
import co.unillanos.secct.usecases.dto.ExpandSampleRequestDTO;
import co.unillanos.secct.usecases.dto.RegisterBatchRequestDTO;
import co.unillanos.secct.usecases.dto.ReportStatistics;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BatchServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BatchStatusRepository statusRepository;

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private EvaluationRepository evaluationRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private BatchCodeGenerator codeGenerator;

    @Mock
    private LogService logService;

    private BatchService batchService;

    private User owner;
    private BatchStatus evaluatedStatus;
    private BatchStatus openStatus;
    private BatchStatus inEvaluationStatus;
    private BatchStatus reportedStatus;

    @BeforeEach
    void setUp() {
        batchService = new BatchService(userRepository, statusRepository, batchRepository,
                evaluationRepository, reportRepository, codeGenerator, logService);

        Role role = new Role((short) 2, "PISCICULTOR");
        owner = new User(role, "Carlos", "Pérez", "carlos@example.com", "3001234567", "hash", "salt");
        owner.setId(1);

        evaluatedStatus = new BatchStatus((short) 3, BatchStatus.EVALUATED);
        openStatus = new BatchStatus((short) 1, BatchStatus.OPEN);
        inEvaluationStatus = new BatchStatus((short) 2, BatchStatus.IN_EVALUATION);
        reportedStatus = new BatchStatus((short) 4, BatchStatus.REPORTED);
    }

    private Batch createBatch(int id, String code, BigDecimal weight, int sampleCount, String notes, BigDecimal finalClass) {
        Batch batch = new Batch(code, LocalDate.of(2026, 10, 20), weight, sampleCount, notes, owner, evaluatedStatus);
        ReflectionTestUtils.setField(batch, "id", id);
        ReflectionTestUtils.setField(batch, "finalClassification", finalClass);
        return batch;
    }

    @Test
    @DisplayName("PU-34 / PI-13 / PL-5.08: listEvaluated consulta lotes EVALUADOS, conteo agrupado y registra auditoría")
    void testListEvaluated_Success() {
        Batch b1 = createBatch(101, "2026-10-20-001", new BigDecimal("150.50"), 10, "Lote maduro", new BigDecimal("2.75"));
        Batch b2 = createBatch(102, "2026-10-20-002", new BigDecimal("200.00"), 15, null, new BigDecimal("3.00"));

        when(batchRepository.findByOwnerIdAndStatusCodeInAndIsDeletedFalse(1, List.of("EVALUADO", "REPORTADO")))
                .thenReturn(List.of(b1, b2));

        when(evaluationRepository.countGroupedByBatchIds(List.of(101, 102)))
                .thenReturn(List.of(new BatchEvaluationCount(101, 10L))); // 102 no tiene evaluaciones en agrupado -> 0

        List<BatchResponseDTO> result = batchService.listEvaluated(1);

        assertThat(result).hasSize(2);

        BatchResponseDTO dto1 = result.get(0);
        assertThat(dto1.id).isEqualTo(101);
        assertThat(dto1.code).isEqualTo("2026-10-20-001");
        assertThat(dto1.weightKg).isEqualTo(new BigDecimal("150.50"));
        assertThat(dto1.sampleUnitCount).isEqualTo(10);
        assertThat(dto1.evaluationCount).isEqualTo(10L);
        assertThat(dto1.finalClassification).isEqualTo(new BigDecimal("2.75"));
        assertThat(dto1.notes).isEqualTo("Lote maduro");

        // PL-5.09: batch sin registros en consulta agrupada mapea evaluationCount a 0
        BatchResponseDTO dto2 = result.get(1);
        assertThat(dto2.id).isEqualTo(102);
        assertThat(dto2.evaluationCount).isEqualTo(0L);

        // CB-11: Una única consulta de conteo agrupado
        verify(evaluationRepository, times(1)).countGroupedByBatchIds(List.of(101, 102));

        // PL-5.08, PI-13: Evento de auditoría EVALUATED_BATCHES_VIEWED registrado
        verify(logService).recordEvent(eq("EVALUATED_BATCHES_VIEWED"), eq(1), isNull(), isNull(), eq("Consulta de lotes evaluados"));
    }

    @Test
    @DisplayName("CB-02 / PL-5.01 / CN-08: Loop boundary 0 iteraciones (lista vacía) -> retorna vacía y registra auditoría")
    void testListEvaluated_LoopBoundary0_Empty() {
        when(batchRepository.findByOwnerIdAndStatusCodeInAndIsDeletedFalse(1, List.of("EVALUADO", "REPORTADO")))
                .thenReturn(List.of());

        List<BatchResponseDTO> result = batchService.listEvaluated(1);

        assertThat(result).isEmpty();
        verify(evaluationRepository, never()).countGroupedByBatchIds(any());
        verify(logService).recordEvent(eq("EVALUATED_BATCHES_VIEWED"), eq(1), isNull(), isNull(), eq("Consulta de lotes evaluados"));
    }

    @Test
    @DisplayName("CB-02 / PL-5.02: Loop boundary 1 iteración -> procesa 1 lote y llama a conteo agrupado")
    void testListEvaluated_LoopBoundary1_SingleBatch() {
        Batch b1 = createBatch(201, "2026-10-20-005", new BigDecimal("80.00"), 5, "Observación simple", new BigDecimal("1.50"));

        when(batchRepository.findByOwnerIdAndStatusCodeInAndIsDeletedFalse(1, List.of("EVALUADO", "REPORTADO")))
                .thenReturn(List.of(b1));
        when(evaluationRepository.countGroupedByBatchIds(List.of(201)))
                .thenReturn(List.of(new BatchEvaluationCount(201, 5L)));

        List<BatchResponseDTO> result = batchService.listEvaluated(1);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).code).isEqualTo("2026-10-20-005");
        assertThat(result.get(0).evaluationCount).isEqualTo(5L);
        verify(evaluationRepository, times(1)).countGroupedByBatchIds(List.of(201));
        verify(logService).recordEvent(eq("EVALUATED_BATCHES_VIEWED"), eq(1), isNull(), isNull(), eq("Consulta de lotes evaluados"));
    }

    @Test
    @DisplayName("CB-02 / PL-5.03: Loop boundary N iteraciones -> procesa N lotes con una única consulta agrupada")
    void testListEvaluated_LoopBoundaryN_MultipleBatches() {
        Batch b1 = createBatch(301, "2026-10-20-010", new BigDecimal("50.00"), 4, "Lote 1", new BigDecimal("2.00"));
        Batch b2 = createBatch(302, "2026-10-20-011", new BigDecimal("60.00"), 4, "Lote 2", new BigDecimal("2.50"));
        Batch b3 = createBatch(303, "2026-10-20-012", new BigDecimal("70.00"), 4, "Lote 3", new BigDecimal("3.00"));

        when(batchRepository.findByOwnerIdAndStatusCodeInAndIsDeletedFalse(1, List.of("EVALUADO", "REPORTADO")))
                .thenReturn(List.of(b1, b2, b3));
        when(evaluationRepository.countGroupedByBatchIds(List.of(301, 302, 303)))
                .thenReturn(List.of(
                        new BatchEvaluationCount(301, 4L),
                        new BatchEvaluationCount(302, 4L),
                        new BatchEvaluationCount(303, 4L)
                ));

        List<BatchResponseDTO> result = batchService.listEvaluated(1);

        assertThat(result).hasSize(3);
        verify(evaluationRepository, times(1)).countGroupedByBatchIds(List.of(301, 302, 303));
        verify(logService).recordEvent(eq("EVALUATED_BATCHES_VIEWED"), eq(1), isNull(), isNull(), eq("Consulta de lotes evaluados"));
    }

    @Test
    @DisplayName("PL-5.06 / PQ-06: Filtra estrictamente por ownerId y estado EVALUADO sin inyección")
    void testListEvaluated_FiltersStrictlyByOwnerAndStatus() {
        when(batchRepository.findByOwnerIdAndStatusCodeInAndIsDeletedFalse(42, List.of("EVALUADO", "REPORTADO")))
                .thenReturn(List.of());

        batchService.listEvaluated(42);

        verify(batchRepository).findByOwnerIdAndStatusCodeInAndIsDeletedFalse(42, List.of("EVALUADO", "REPORTADO"));
    }

    @Test
    @DisplayName("listEvaluated con ownerId nulo lanza BusinessException 401")
    void testListEvaluated_NullOwnerId_Throws401() {
        assertThatThrownBy(() -> batchService.listEvaluated(null))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Usuario no autenticado");
    }

    @Test
    @DisplayName("register: registra nuevo lote y emite evento BATCH_REGISTERED")
    void testRegister_Success() {
        RegisterBatchRequestDTO req = new RegisterBatchRequestDTO();
        req.setCaptureDate(LocalDate.of(2026, 10, 20));
        req.setWeightKg(new BigDecimal("120.00"));
        req.setSampleUnitCount(8);
        req.setNotes("Sin novedades");

        when(userRepository.findByIdAndIsDeletedFalse(1)).thenReturn(Optional.of(owner));
        when(statusRepository.findByCode("ABIERTO")).thenReturn(Optional.of(openStatus));
        when(batchRepository.countByCaptureDate(req.getCaptureDate())).thenReturn(0L);
        when(codeGenerator.generate(req.getCaptureDate(), 1L)).thenReturn("2026-10-20-001");

        Batch saved = new Batch("2026-10-20-001", req.getCaptureDate(), req.getWeightKg(),
                req.getSampleUnitCount(), req.getNotes(), owner, openStatus);
        ReflectionTestUtils.setField(saved, "id", 501);
        when(batchRepository.save(any(Batch.class))).thenReturn(saved);

        BatchResponseDTO response = batchService.register(req, 1);

        assertThat(response.code).isEqualTo("2026-10-20-001");
        assertThat(response.evaluationCount).isEqualTo(0L);
        verify(logService).recordEvent(eq("BATCH_REGISTERED"), eq(1), eq(501), isNull(), eq("Lote 2026-10-20-001 registrado"));
    }

    @Test
    @DisplayName("listAvailable: retorna lotes ABIERTO o EN_EVALUACION")
    void testListAvailable_Success() {
        Batch b1 = createBatch(601, "2026-10-20-020", new BigDecimal("90.00"), 6, "Disponible", null);
        when(batchRepository.findByOwnerIdAndStatusCodeInAndIsDeletedFalse(eq(1), any()))
                .thenReturn(List.of(b1));
        when(evaluationRepository.countGroupedByBatchIds(List.of(601)))
                .thenReturn(List.of(new BatchEvaluationCount(601, 2L)));

        List<BatchResponseDTO> result = batchService.listAvailable(1);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).evaluationCount).isEqualTo(2L);
    }

    @Test
    @DisplayName("getByCodeAndOwner: retorna lote individual con conteo de evaluaciones")
    void testGetByCodeAndOwner_Success() {
        Batch b1 = createBatch(701, "2026-10-20-030", new BigDecimal("110.00"), 8, "Notas", null);
        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("2026-10-20-030", 1))
                .thenReturn(Optional.of(b1));
        when(evaluationRepository.countByBatchId(701)).thenReturn(4L);

        BatchResponseDTO result = batchService.getByCodeAndOwner("2026-10-20-030", 1);

        assertThat(result.code).isEqualTo("2026-10-20-030");
        assertThat(result.evaluationCount).isEqualTo(4L);
    }

    @Test
    @DisplayName("getByCodeAndOwner: lanza 404 si el lote no existe")
    void testGetByCodeAndOwner_NotFound() {
        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("NONEXISTENT", 1))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> batchService.getByCodeAndOwner("NONEXISTENT", 1))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Lote no encontrado");
    }

    @Test
    @DisplayName("HU-09 delete: borra lógicamente el lote y sus reportes activos y registra BATCH_DELETED")
    void testDelete_WithReports_SoftDeletesBatchAndReports() {
        Batch batch = createBatch(801, "SECCT-20261020-050", new BigDecimal("120.00"), 10, "Notas", new BigDecimal("3.50"));
        ReportStatistics stats = new ReportStatistics(
                10L, new BigDecimal("3.50"), new BigDecimal("3.50"), new BigDecimal("3.50"), Map.of());
        Report report = new Report(batch, 1, stats);

        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-050", 1))
                .thenReturn(Optional.of(batch));
        when(reportRepository.findByBatchIdAndIsDeletedFalse(801)).thenReturn(List.of(report));

        batchService.delete("SECCT-20261020-050", 1);

        assertThat(batch.isDeleted()).isTrue();
        assertThat(batch.getDeletedBy()).isEqualTo(1);
        assertThat(report.isDeleted()).isTrue();
        assertThat(report.isCurrent()).isFalse();
        assertThat(report.getDeletedBy()).isEqualTo(1);

        verify(batchRepository).save(batch);
        verify(reportRepository).saveAll(List.of(report));
        verify(logService).recordEvent(eq("BATCH_DELETED"), eq(1), eq(801), isNull(), any());
    }

    @Test
    @DisplayName("HU-09 delete: cuando el lote no tiene reportes, no llama saveAll y registra BATCH_DELETED")
    void testDelete_WithoutReports_Success() {
        Batch batch = createBatch(802, "SECCT-20261020-051", new BigDecimal("100.00"), 5, null, null);
        ReflectionTestUtils.setField(batch, "status", openStatus);

        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-051", 1))
                .thenReturn(Optional.of(batch));
        when(reportRepository.findByBatchIdAndIsDeletedFalse(802)).thenReturn(List.of());

        batchService.delete("SECCT-20261020-051", 1);

        assertThat(batch.isDeleted()).isTrue();
        verify(batchRepository).save(batch);
        verify(reportRepository, never()).saveAll(any());
        verify(logService).recordEvent(eq("BATCH_DELETED"), eq(1), eq(802), isNull(), any());
    }

    @Test
    @DisplayName("HU-09 delete: lanza 404 si el lote no existe o es de otro usuario")
    void testDelete_NotFound_Throws404() {
        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("MISSING", 1))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> batchService.delete("MISSING", 1))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Lote no encontrado")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(404);
    }

    @Test
    @DisplayName("HU-13 expandSample: lote EVALUADO pasa a EN_EVALUACION con finalClassification=null y registra SAMPLE_EXPANDED")
    void testExpandSample_FromEvaluated_Success() {
        Batch batch = createBatch(901, "SECCT-20261020-060", new BigDecimal("150.00"), 10, "Estanque 1", new BigDecimal("3.80"));
        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-060", 1))
                .thenReturn(Optional.of(batch));
        when(statusRepository.findByCode(BatchStatus.IN_EVALUATION)).thenReturn(Optional.of(inEvaluationStatus));
        when(batchRepository.save(batch)).thenReturn(batch);
        when(evaluationRepository.countByBatchId(901)).thenReturn(10L);

        BatchResponseDTO response = batchService.expandSample(
                "SECCT-20261020-060", 1, new ExpandSampleRequestDTO(4));

        assertThat(response.sampleUnitCount).isEqualTo(14);
        assertThat(response.finalClassification).isNull();
        assertThat(response.statusCode).isEqualTo(BatchStatus.IN_EVALUATION);
        assertThat(response.evaluationCount).isEqualTo(10L);
        verify(logService).recordEvent(eq("SAMPLE_EXPANDED"), eq(1), eq(901), isNull(), any());
    }

    @Test
    @DisplayName("HU-13 expandSample: lote REPORTADO marca el reporte vigente como histórico")
    void testExpandSample_FromReported_MarksReportAsPrevious() {
        Batch batch = createBatch(902, "SECCT-20261020-061", new BigDecimal("150.00"), 10, "Estanque 2", new BigDecimal("3.80"));
        ReflectionTestUtils.setField(batch, "status", reportedStatus);
        ReportStatistics stats = new ReportStatistics(
                10L, new BigDecimal("3.80"), new BigDecimal("3.80"), new BigDecimal("3.80"), Map.of());
        Report currentReport = new Report(batch, 1, stats);

        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-061", 1))
                .thenReturn(Optional.of(batch));
        when(reportRepository.findByBatchIdAndCurrentTrueAndIsDeletedFalse(902))
                .thenReturn(Optional.of(currentReport));
        when(statusRepository.findByCode(BatchStatus.IN_EVALUATION)).thenReturn(Optional.of(inEvaluationStatus));
        when(batchRepository.save(batch)).thenReturn(batch);
        when(evaluationRepository.countByBatchId(902)).thenReturn(10L);

        BatchResponseDTO response = batchService.expandSample(
                "SECCT-20261020-061", 1, new ExpandSampleRequestDTO(2));

        assertThat(currentReport.isCurrent()).isFalse();
        verify(reportRepository).save(currentReport);
        assertThat(response.sampleUnitCount).isEqualTo(12);
        assertThat(response.statusCode).isEqualTo(BatchStatus.IN_EVALUATION);
        assertThat(response.finalClassification).isNull();
    }

    @Test
    @DisplayName("HU-13 expandSample: lote ABIERTO lanza BusinessException 409")
    void testExpandSample_OpenBatch_Throws409() {
        Batch batch = createBatch(903, "SECCT-20261020-062", new BigDecimal("80.00"), 5, null, null);
        ReflectionTestUtils.setField(batch, "status", openStatus);

        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-062", 1))
                .thenReturn(Optional.of(batch));

        assertThatThrownBy(() -> batchService.expandSample(
                "SECCT-20261020-062", 1, new ExpandSampleRequestDTO(3)))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Solo se puede ampliar un lote evaluado")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(409);
    }

    @Test
    @DisplayName("HU-13 expandSample: superar 500 unidades lanza BusinessException 400")
    void testExpandSample_ExceedsMax500_Throws400() {
        Batch batch = createBatch(904, "SECCT-20261020-063", new BigDecimal("500.00"), 490, null, new BigDecimal("3.20"));
        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-063", 1))
                .thenReturn(Optional.of(batch));
        when(statusRepository.findByCode(BatchStatus.IN_EVALUATION)).thenReturn(Optional.of(inEvaluationStatus));

        assertThatThrownBy(() -> batchService.expandSample(
                "SECCT-20261020-063", 1, new ExpandSampleRequestDTO(11)))
                .isInstanceOf(BusinessException.class)
                .hasMessage("La muestra no puede superar 500 unidades")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(400);

        verify(batchRepository, never()).save(any());
    }
}
