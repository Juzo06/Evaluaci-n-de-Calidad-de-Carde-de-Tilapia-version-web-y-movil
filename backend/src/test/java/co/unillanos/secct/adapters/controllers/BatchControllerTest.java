package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.BatchResponseDTO;
import co.unillanos.secct.usecases.dto.ExpandSampleRequestDTO;
import co.unillanos.secct.usecases.dto.RegisterBatchRequestDTO;
import co.unillanos.secct.usecases.services.BatchService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BatchControllerTest {

    @Mock
    private BatchService batchService;

    private BatchController batchController;

    @BeforeEach
    void setUp() {
        batchController = new BatchController(batchService);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(42, null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private BatchResponseDTO createSampleDTO(String code, String status) {
        BatchResponseDTO dto = new BatchResponseDTO();
        dto.id = 1;
        dto.code = code;
        dto.captureDate = LocalDate.of(2026, 10, 20);
        dto.weightKg = new BigDecimal("100.00");
        dto.sampleUnitCount = 10;
        dto.notes = "Sin novedades";
        dto.evaluationCount = 10L;
        dto.finalClassification = new BigDecimal("2.80");
        dto.statusCode = status;
        return dto;
    }

    @Test
    @DisplayName("PI-11 / PI-14: GET /api/batches/evaluated delega en batchService.listEvaluated con el ownerId autenticado")
    void testListEvaluated_Success() {
        BatchResponseDTO dto = createSampleDTO("2026-10-20-001", "EVALUADO");
        when(batchService.listEvaluated(42)).thenReturn(List.of(dto));

        List<BatchResponseDTO> result = batchController.listEvaluated();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).code).isEqualTo("2026-10-20-001");
        verify(batchService).listEvaluated(42);
    }

    @Test
    @DisplayName("GET /api/batches?estado=EVALUADO delega a listEvaluated para homologar Infraestructura del proyecto web_2.md")
    void testListAvailable_WithEstadoEvaluado_DelegatesToListEvaluated() {
        BatchResponseDTO dto = createSampleDTO("2026-10-20-002", "EVALUADO");
        when(batchService.listEvaluated(42)).thenReturn(List.of(dto));

        List<BatchResponseDTO> result = batchController.listAvailable("EVALUADO");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).code).isEqualTo("2026-10-20-002");
        verify(batchService).listEvaluated(42);
    }

    @Test
    @DisplayName("GET /api/batches?estado=evaluado (case-insensitive) delega a listEvaluated")
    void testListAvailable_WithEstadoLowerCase_DelegatesToListEvaluated() {
        BatchResponseDTO dto = createSampleDTO("2026-10-20-003", "EVALUADO");
        when(batchService.listEvaluated(42)).thenReturn(List.of(dto));

        List<BatchResponseDTO> result = batchController.listAvailable("evaluado");

        assertThat(result).hasSize(1);
        verify(batchService).listEvaluated(42);
    }

    @Test
    @DisplayName("GET /api/batches sin estado delega a listAvailable")
    void testListAvailable_WithoutEstado_DelegatesToListAvailable() {
        BatchResponseDTO dto = createSampleDTO("2026-10-20-004", "ABIERTO");
        when(batchService.listAvailable(42)).thenReturn(List.of(dto));

        List<BatchResponseDTO> result = batchController.listAvailable(null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).statusCode).isEqualTo("ABIERTO");
        verify(batchService).listAvailable(42);
    }

    @Test
    @DisplayName("POST /api/batches delega a register con el ownerId autenticado")
    void testRegister_Success() {
        RegisterBatchRequestDTO req = new RegisterBatchRequestDTO();
        req.setCaptureDate(LocalDate.of(2026, 10, 20));
        req.setWeightKg(new BigDecimal("120.00"));
        req.setSampleUnitCount(8);

        BatchResponseDTO dto = createSampleDTO("2026-10-20-005", "ABIERTO");
        when(batchService.register(req, 42)).thenReturn(dto);

        BatchResponseDTO result = batchController.register(req);

        assertThat(result.code).isEqualTo("2026-10-20-005");
        verify(batchService).register(req, 42);
    }

    @Test
    @DisplayName("GET /api/batches/{code} delega a getByCodeAndOwner")
    void testGetByCode_Success() {
        BatchResponseDTO dto = createSampleDTO("2026-10-20-006", "EN_EVALUACION");
        when(batchService.getByCodeAndOwner("2026-10-20-006", 42)).thenReturn(dto);

        BatchResponseDTO result = batchController.getByCode("2026-10-20-006");

        assertThat(result.code).isEqualTo("2026-10-20-006");
        verify(batchService).getByCodeAndOwner("2026-10-20-006", 42);
    }

    @Test
    @DisplayName("DELETE /api/batches/{code} delega a batchService.delete con el ownerId autenticado")
    void testDelete_Success() {
        batchController.delete("SECCT-20261020-007");

        verify(batchService).delete("SECCT-20261020-007", 42);
    }

    @Test
    @DisplayName("POST /api/batches/{code}/expand delega a expandSample con el ownerId autenticado")
    void testExpandSample_Success() {
        ExpandSampleRequestDTO request = new ExpandSampleRequestDTO(3);
        BatchResponseDTO dto = createSampleDTO("SECCT-20261020-008", "EN_EVALUACION");
        dto.finalClassification = null;
        when(batchService.expandSample("SECCT-20261020-008", 42, request)).thenReturn(dto);

        BatchResponseDTO result = batchController.expandSample("SECCT-20261020-008", request);

        assertThat(result.code).isEqualTo("SECCT-20261020-008");
        assertThat(result.statusCode).isEqualTo("EN_EVALUACION");
        verify(batchService).expandSample("SECCT-20261020-008", 42, request);
    }
}
