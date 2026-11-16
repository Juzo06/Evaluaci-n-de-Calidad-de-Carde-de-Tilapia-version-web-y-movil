package co.unillanos.secct.infrastructure.reports;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.BatchStatus;
import co.unillanos.secct.entities.Report;
import co.unillanos.secct.entities.Role;
import co.unillanos.secct.entities.User;
import co.unillanos.secct.usecases.dto.ReportStatistics;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JasperReportGeneratorTest {

    private JasperReportGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new JasperReportGenerator();
        generator.initCompileTemplates();
    }

    @Test
    @DisplayName("initCompileTemplates compila chart.jrxml y batch-report.jrxml sin errores")
    void initCompileTemplatesSucceeds() {
        JasperReportGenerator fresh = new JasperReportGenerator();
        assertDoesNotThrow(fresh::initCompileTemplates);
    }

    @Test
    @DisplayName("renderChartPng genera un PNG valido con firma 89 50 4E 47")
    void renderChartPngGeneratesValidPngBytes() {
        ReportStatistics stats = sampleStatistics();

        byte[] png = generator.renderChartPng(stats);

        assertTrue(png.length > 100);
        assertEquals((byte) 0x89, png[0]);
        assertEquals((byte) 0x50, png[1]);
        assertEquals((byte) 0x4E, png[2]);
        assertEquals((byte) 0x47, png[3]);
    }

    @Test
    @DisplayName("PU-24 / PL-12.02: exportPdf genera un PDF valido usando estadisticas consolidadas del Report")
    void exportPdfGeneratesValidPdfFromFrozenReport() {
        Role role = new Role((short) 2, "PISCICULTOR");
        User owner = new User(role, "Ana", "Gomez", "ana@test.com", "3001234567", "hash", "salt");
        BatchStatus reportedStatus = new BatchStatus((short) 4, BatchStatus.REPORTED);
        Batch batch = new Batch("SECCT-20261115-001", LocalDate.of(2026, 11, 15),
                new BigDecimal("42.50"), 10, "Muestra fresca de estanques sur", owner, reportedStatus);
        Report report = new Report(batch, 2, sampleStatistics());

        byte[] pdfBytes = generator.exportPdf(report);

        assertTrue(pdfBytes.length > 500);
        String header = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertEquals("%PDF-", header);
    }

    @Test
    @DisplayName("renderChartPng y exportPdf lanzan BusinessException 500 ante entradas nulas")
    void nullInputsThrowBusinessException500() {
        BusinessException chartEx = assertThrows(BusinessException.class,
                () -> generator.renderChartPng(null));
        assertEquals(500, chartEx.getHttpStatus());

        BusinessException pdfEx = assertThrows(BusinessException.class,
                () -> generator.exportPdf(null));
        assertEquals(500, pdfEx.getHttpStatus());
    }

    private static ReportStatistics sampleStatistics() {
        return new ReportStatistics(
                10L,
                new BigDecimal("4.35"),
                new BigDecimal("4.40"),
                new BigDecimal("4.30"),
                Map.of(
                        (short) 1, 0L,
                        (short) 2, 1L,
                        (short) 3, 2L,
                        (short) 4, 8L,
                        (short) 5, 9L
                )
        );
    }
}
