package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.BatchStatus;
import co.unillanos.secct.entities.User;
import co.unillanos.secct.infrastructure.repositories.BatchRepository;
import co.unillanos.secct.infrastructure.repositories.BatchStatusRepository;
import co.unillanos.secct.infrastructure.repositories.EvaluationRepository;
import co.unillanos.secct.infrastructure.repositories.FishPartRepository;
import co.unillanos.secct.usecases.dto.BatchResponseDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import co.unillanos.secct.usecases.ports.Classifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EvaluationServiceTest {

    @Mock
    private BatchRepository batchRepository;
    @Mock
    private BatchStatusRepository statusRepository;
    @Mock
    private EvaluationRepository evaluationRepository;
    @Mock
    private FishPartRepository fishPartRepository;
    @Mock
    private Classifier classifier;
    @Mock
    private ImageValidator imageValidator;
    @Mock
    private LogService logService;

    @InjectMocks
    private EvaluationService evaluationService;

    private Batch batch;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setId(1);
        BatchStatus status = new BatchStatus((short) 1, BatchStatus.OPEN);
        batch = new Batch("SECCT-20261020-001", LocalDate.now(), new java.math.BigDecimal("100.00"), 5, null, user, status);
        ReflectionTestUtils.setField(batch, "id", 10);
    }

    @Test
    @DisplayName("PL-4.20: evaluateUnit rechaza imagen duplicada cuando existsByBatchIdAndImageReference es true con 409")
    void evaluateUnit_rejectsDuplicateImage() {
        byte[] imageBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0}; // Fake JPEG header
        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-001", 1))
                .thenReturn(Optional.of(batch));
        when(evaluationRepository.countByBatchId(10)).thenReturn(0L);
        when(evaluationRepository.existsByBatchIdAndImageReference(org.mockito.ArgumentMatchers.eq(10), anyString()))
                .thenReturn(true);

        assertThatThrownBy(() -> evaluationService.evaluateUnit("SECCT-20261020-001", 1, imageBytes))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Esta imagen ya fue evaluada anteriormente. Carga una imagen distinta.")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(409);

        verify(classifier, never()).classify(any());
        verify(evaluationRepository, never()).save(any());
    }

    @Test
    @DisplayName("evaluateUnit guarda evaluación y transiciona lote ABIERTO a EN_EVALUACION en la primera unidad")
    void evaluateUnit_firstUnitTransitionsOpenBatchAfterSavingEvaluation() {
        byte[] imageBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        BatchStatus openStatus = org.mockito.Mockito.mock(BatchStatus.class);
        when(openStatus.getCode()).thenReturn(BatchStatus.OPEN);
        org.springframework.test.util.ReflectionTestUtils.setField(batch, "status", openStatus);

        BatchStatus inEvaluationStatus = org.mockito.Mockito.mock(BatchStatus.class);
        when(inEvaluationStatus.getCode()).thenReturn(BatchStatus.IN_EVALUATION);

        co.unillanos.secct.entities.FishPart eyePart =
                org.mockito.Mockito.mock(co.unillanos.secct.entities.FishPart.class);
        when(eyePart.getCode()).thenReturn("OJO");

        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-001", 1))
                .thenReturn(Optional.of(batch));
        when(evaluationRepository.countByBatchId(10)).thenReturn(0L);
        when(evaluationRepository.existsByBatchIdAndImageReference(org.mockito.ArgumentMatchers.eq(10), anyString()))
                .thenReturn(false);
        when(classifier.classify(imageBytes)).thenReturn(java.util.List.of(
                new co.unillanos.secct.usecases.dto.ClassificationResult(
                        "OJO", (short) 1, new java.math.BigDecimal("0.9500"))));
        when(fishPartRepository.findByCode("OJO")).thenReturn(Optional.of(eyePart));
        when(evaluationRepository.save(any(co.unillanos.secct.entities.Evaluation.class)))
                .thenAnswer(invocation -> {
                    co.unillanos.secct.entities.Evaluation eval = invocation.getArgument(0);
                    org.springframework.test.util.ReflectionTestUtils.setField(eval, "id", 99);
                    return eval;
                });
        when(statusRepository.findByCode(BatchStatus.IN_EVALUATION))
                .thenReturn(Optional.of(inEvaluationStatus));

        co.unillanos.secct.usecases.dto.EvaluationResponseDTO result =
                evaluationService.evaluateUnit("SECCT-20261020-001", 1, imageBytes);

        assertThat(result).isNotNull();
        assertThat(result.id).isEqualTo(99);
        assertThat(batch.getStatus().getCode()).isEqualTo(BatchStatus.IN_EVALUATION);

        org.mockito.InOrder inOrder =
                org.mockito.Mockito.inOrder(evaluationRepository, statusRepository, batchRepository);
        inOrder.verify(evaluationRepository).save(any(co.unillanos.secct.entities.Evaluation.class));
        inOrder.verify(statusRepository).findByCode(BatchStatus.IN_EVALUATION);
        inOrder.verify(batchRepository).save(batch);
    }

    @Test
    @DisplayName("evaluateUnit no consulta EN_EVALUACION ni guarda el lote cuando ya está en EN_EVALUACION")
    void evaluateUnit_subsequentUnitInEvaluationDoesNotUpdateBatchStatus() {
        byte[] imageBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        BatchStatus inEvaluationStatus = org.mockito.Mockito.mock(BatchStatus.class);
        when(inEvaluationStatus.getCode()).thenReturn(BatchStatus.IN_EVALUATION);
        org.springframework.test.util.ReflectionTestUtils.setField(batch, "status", inEvaluationStatus);

        co.unillanos.secct.entities.FishPart eyePart =
                org.mockito.Mockito.mock(co.unillanos.secct.entities.FishPart.class);
        when(eyePart.getCode()).thenReturn("OJO");

        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-001", 1))
                .thenReturn(Optional.of(batch));
        when(evaluationRepository.countByBatchId(10)).thenReturn(1L);
        when(evaluationRepository.existsByBatchIdAndImageReference(org.mockito.ArgumentMatchers.eq(10), anyString()))
                .thenReturn(false);
        when(classifier.classify(imageBytes)).thenReturn(java.util.List.of(
                new co.unillanos.secct.usecases.dto.ClassificationResult(
                        "OJO", (short) 2, new java.math.BigDecimal("0.8800"))));
        when(fishPartRepository.findByCode("OJO")).thenReturn(Optional.of(eyePart));
        when(evaluationRepository.save(any(co.unillanos.secct.entities.Evaluation.class)))
                .thenAnswer(invocation -> {
                    co.unillanos.secct.entities.Evaluation eval = invocation.getArgument(0);
                    org.springframework.test.util.ReflectionTestUtils.setField(eval, "id", 100);
                    return eval;
                });

        co.unillanos.secct.usecases.dto.EvaluationResponseDTO result =
                evaluationService.evaluateUnit("SECCT-20261020-001", 1, imageBytes);

        assertThat(result).isNotNull();
        assertThat(result.id).isEqualTo(100);
        verify(statusRepository, never()).findByCode(BatchStatus.IN_EVALUATION);
        verify(batchRepository, never()).save(any());
    }

    @Test
    @DisplayName("closeEvaluation cierra lote evaluado correctamente cuando todas las unidades están listas")
    void closeEvaluation_success() {
        when(batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse("SECCT-20261020-001", 1))
                .thenReturn(Optional.of(batch));
        when(evaluationRepository.countByBatchId(10)).thenReturn(5L);
        when(evaluationRepository.averageNtcCategoryByBatchId(10)).thenReturn(new java.math.BigDecimal("1.50"));
        BatchStatus evaluatedStatus = new BatchStatus((short) 3, BatchStatus.EVALUATED);
        when(statusRepository.findByCode(BatchStatus.EVALUATED)).thenReturn(Optional.of(evaluatedStatus));
        when(batchRepository.save(any(Batch.class))).thenAnswer(inv -> inv.getArgument(0));

        BatchResponseDTO result = evaluationService.closeEvaluation("SECCT-20261020-001", 1);

        assertThat(result).isNotNull();
        assertThat(result.statusCode).isEqualTo(BatchStatus.EVALUATED);
        verify(logService).recordEvent(anyString(), any(), any(), any(), anyString());
    }
}
