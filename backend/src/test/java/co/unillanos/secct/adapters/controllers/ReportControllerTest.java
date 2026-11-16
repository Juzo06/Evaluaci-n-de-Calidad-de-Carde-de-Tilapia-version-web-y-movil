package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.ReportResponseDTO;
import co.unillanos.secct.usecases.dto.ReportStatistics;
import co.unillanos.secct.usecases.dto.ReportSummaryDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import co.unillanos.secct.usecases.services.ReportService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReportService reportService;

    private ReportStatistics sampleStats;

    @BeforeEach
    void setUp() {
        ReportController reportController = new ReportController(reportService);
        mockMvc = MockMvcBuilders.standaloneSetup(reportController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(42, null, List.of()));

        sampleStats = new ReportStatistics(
                3L,
                new BigDecimal("3.67"),
                new BigDecimal("4.00"),
                new BigDecimal("3.33"),
                Map.of((short) 1, 0L, (short) 2, 0L, (short) 3, 1L, (short) 4, 2L, (short) 5, 0L)
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/reports/batches/{code} retorna 200 OK con ReportResponseDTO")
    void generate_Returns200() throws Exception {
        ReportResponseDTO dto = new ReportResponseDTO(
                null, null, "SECCT-20261020-001", LocalDate.of(2026, 10, 20),
                new BigDecimal("12.50"), 3, "Estanque 2", sampleStats, List.of(), "data:image/png;base64,AQID");
        when(reportService.generate("SECCT-20261020-001", 42)).thenReturn(dto);

        mockMvc.perform(get("/api/reports/batches/SECCT-20261020-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchCode").value("SECCT-20261020-001"))
                .andExpect(jsonPath("$.reportId").isEmpty());

        verify(reportService).generate("SECCT-20261020-001", 42);
    }

    @Test
    @DisplayName("GET /api/reports/batches/{code} cuando lote no está evaluado retorna 409 Conflict")
    void generate_NotEvaluated_Returns409() throws Exception {
        when(reportService.generate("SECCT-20261020-001", 42))
                .thenThrow(new BusinessException("El lote aún no está evaluado", 409));

        mockMvc.perform(get("/api/reports/batches/SECCT-20261020-001"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El lote aún no está evaluado"));
    }

    @Test
    @DisplayName("POST /api/reports/batches/{code} retorna 201 Created con ReportSummaryDTO")
    void save_Returns201() throws Exception {
        ReportSummaryDTO summary = new ReportSummaryDTO(
                7, "SECCT-20261020-001", 1, true, new BigDecimal("3.67"), OffsetDateTime.now());
        when(reportService.save("SECCT-20261020-001", 42)).thenReturn(summary);

        mockMvc.perform(post("/api/reports/batches/SECCT-20261020-001"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.current").value(true));

        verify(reportService).save("SECCT-20261020-001", 42);
    }

    @Test
    @DisplayName("GET /api/reports retorna 200 OK con lista de ReportSummaryDTO")
    void list_Returns200() throws Exception {
        ReportSummaryDTO summary = new ReportSummaryDTO(
                9, "SECCT-20261020-001", 2, true, new BigDecimal("3.80"), OffsetDateTime.now());
        when(reportService.listByOwner(42)).thenReturn(List.of(summary));

        mockMvc.perform(get("/api/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(9))
                .andExpect(jsonPath("$[0].version").value(2));

        verify(reportService).listByOwner(42);
    }

    @Test
    @DisplayName("GET /api/reports/{id} retorna 200 OK con ReportResponseDTO")
    void getById_Returns200() throws Exception {
        ReportResponseDTO dto = new ReportResponseDTO(
                9, 2, "SECCT-20261020-001", LocalDate.of(2026, 10, 20),
                new BigDecimal("12.50"), 3, "Estanque 2", sampleStats, List.of(), "data:image/png;base64,AQID");
        when(reportService.getById(9, 42)).thenReturn(dto);

        mockMvc.perform(get("/api/reports/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportId").value(9))
                .andExpect(jsonPath("$.version").value(2));

        verify(reportService).getById(9, 42);
    }

    @Test
    @DisplayName("GET /api/reports/abc con id no numérico retorna 400 Bad Request")
    void getById_InvalidId_Returns400() throws Exception {
        mockMvc.perform(get("/api/reports/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Parámetro inválido: id"));
    }

    @Test
    @DisplayName("GET /api/reports/{id}/pdf retorna 200 application/pdf y Content-Disposition")
    void exportPdf_Returns200Pdf() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 sample".getBytes();
        when(reportService.exportPdf(9, 42)).thenReturn(pdfBytes);
        when(reportService.resolvePdfFilename(9, 42)).thenReturn("reporte-SECCT-20261020-001-v2.pdf");

        mockMvc.perform(get("/api/reports/9/pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"reporte-SECCT-20261020-001-v2.pdf\""))
                .andExpect(content().bytes(pdfBytes));

        verify(reportService).exportPdf(9, 42);
        verify(reportService).resolvePdfFilename(9, 42);
    }

    @Test
    @DisplayName("DELETE /api/reports/{id} retorna 204 No Content")
    void delete_Returns204() throws Exception {
        mockMvc.perform(delete("/api/reports/9"))
                .andExpect(status().isNoContent());

        verify(reportService).delete(9, 42);
    }

    @Test
    @DisplayName("DELETE /api/reports/{id} cuando no existe retorna 404 Not Found")
    void delete_NotFound_Returns404() throws Exception {
        doThrow(new BusinessException("Reporte no encontrado", 404))
                .when(reportService).delete(99, 42);

        mockMvc.perform(delete("/api/reports/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Reporte no encontrado"));
    }
}
