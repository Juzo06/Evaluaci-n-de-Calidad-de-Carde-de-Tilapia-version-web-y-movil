package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.BatchResponseDTO;
import co.unillanos.secct.usecases.dto.ClassificationResult;
import co.unillanos.secct.usecases.dto.EvaluationResponseDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import co.unillanos.secct.usecases.services.EvaluationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EvaluationControllerTest {

    private static final String BATCH_CODE = "SECCT-20261115-001";

    private MockMvc mockMvc;

    @Mock
    private EvaluationService evaluationService;

    @BeforeEach
    void setUp() {
        EvaluationController controller = new EvaluationController(evaluationService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(7, null,
                        List.of(new SimpleGrantedAuthority("ROLE_PISCICULTOR"))));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/evaluations/batches/{code}/units retorna 201 con resultados OJO y PIEL")
    void evaluateUnitReturns201WhenValidImageUploaded() throws Exception {
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x01};
        MockMultipartFile file = new MockMultipartFile("image", "tilapia.jpg", "image/jpeg", jpegBytes);

        EvaluationResponseDTO response = new EvaluationResponseDTO();
        response.id = 42;
        response.evaluatedAt = OffsetDateTime.of(2026, 11, 15, 17, 0, 0, 0, ZoneOffset.UTC);
        response.results = List.of(
                new ClassificationResult("OJO", (short) 4, new BigDecimal("0.91")),
                new ClassificationResult("PIEL", (short) 5, new BigDecimal("0.95"))
        );

        when(evaluationService.evaluateUnit(eq(BATCH_CODE), eq(7), eq(jpegBytes)))
                .thenReturn(response);

        mockMvc.perform(multipart("/api/evaluations/batches/{code}/units", BATCH_CODE).file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.results[0].fishPartCode").value("OJO"))
                .andExpect(jsonPath("$.results[0].ntcCategory").value(4))
                .andExpect(jsonPath("$.results[1].fishPartCode").value("PIEL"))
                .andExpect(jsonPath("$.results[1].ntcCategory").value(5));

        verify(evaluationService).evaluateUnit(BATCH_CODE, 7, jpegBytes);
    }

    @Test
    @DisplayName("POST /api/evaluations/batches/{code}/units sin archivo o con archivo vacio retorna 400")
    void evaluateUnitReturns400WhenImageMissingOrEmpty() throws Exception {
        mockMvc.perform(multipart("/api/evaluations/batches/{code}/units", BATCH_CODE))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Debes adjuntar una imagen"));

        MockMultipartFile emptyFile = new MockMultipartFile("image", "empty.jpg", "image/jpeg", new byte[0]);
        mockMvc.perform(multipart("/api/evaluations/batches/{code}/units", BATCH_CODE).file(emptyFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Debes adjuntar una imagen"));

        verifyNoInteractions(evaluationService);
    }

    @Test
    @DisplayName("POST /api/evaluations/batches/{code}/units sin autenticacion retorna 401")
    void evaluateUnitReturns401WhenUnauthenticated() throws Exception {
        SecurityContextHolder.clearContext();
        MockMultipartFile file = new MockMultipartFile("image", "tilapia.jpg", "image/jpeg", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/evaluations/batches/{code}/units", BATCH_CODE).file(file))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuario no autenticado"));

        verifyNoInteractions(evaluationService);
    }

    @Test
    @DisplayName("POST /api/evaluations/batches/{code}/units propaga BusinessException del servicio")
    void evaluateUnitPropagatesBusinessException() throws Exception {
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        MockMultipartFile file = new MockMultipartFile("image", "tilapia.jpg", "image/jpeg", jpegBytes);

        when(evaluationService.evaluateUnit(eq(BATCH_CODE), eq(7), eq(jpegBytes)))
                .thenThrow(new BusinessException("Lote no encontrado", 404));

        mockMvc.perform(multipart("/api/evaluations/batches/{code}/units", BATCH_CODE).file(file))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Lote no encontrado"));
    }

    @Test
    @DisplayName("POST /api/evaluations/batches/{code}/close retorna 200 con el lote cerrado")
    void closeEvaluationReturns200WithBatchSummary() throws Exception {
        BatchResponseDTO closedBatch = new BatchResponseDTO();
        closedBatch.id = 10;
        closedBatch.code = BATCH_CODE;
        closedBatch.captureDate = LocalDate.of(2026, 11, 15);
        closedBatch.weightKg = new BigDecimal("25.50");
        closedBatch.sampleUnitCount = 5;
        closedBatch.evaluationCount = 5L;
        closedBatch.finalClassification = new BigDecimal("4.20");
        closedBatch.statusCode = "EVALUADO";

        when(evaluationService.closeEvaluation(BATCH_CODE, 7)).thenReturn(closedBatch);

        mockMvc.perform(post("/api/evaluations/batches/{code}/close", BATCH_CODE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.code").value(BATCH_CODE))
                .andExpect(jsonPath("$.statusCode").value("EVALUADO"))
                .andExpect(jsonPath("$.finalClassification").value(4.20));

        verify(evaluationService).closeEvaluation(BATCH_CODE, 7);
    }

    @Test
    @DisplayName("POST /api/evaluations/batches/{code}/close sin autenticacion retorna 401")
    void closeEvaluationReturns401WhenUnauthenticated() throws Exception {
        SecurityContextHolder.clearContext();

        mockMvc.perform(post("/api/evaluations/batches/{code}/close", BATCH_CODE))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuario no autenticado"));

        verifyNoInteractions(evaluationService);
    }
}
