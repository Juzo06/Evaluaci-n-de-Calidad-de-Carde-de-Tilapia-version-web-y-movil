package co.unillanos.secct.infrastructure.reports;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.Report;
import co.unillanos.secct.usecases.dto.ReportStatistics;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import co.unillanos.secct.usecases.ports.ReportGenerator;
import jakarta.annotation.PostConstruct;
import net.sf.jasperreports.engine.JREmptyDataSource;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperPrintManager;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** JasperReports adapter compiling chart.jrxml and batch-report.jrxml at startup (DC-HU6, DC-HU11, DC-HU12). */
@Component
public class JasperReportGenerator implements ReportGenerator {

    private static final Logger logger = LoggerFactory.getLogger(JasperReportGenerator.class);
    private static final DateTimeFormatter GENERATED_AT_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private JasperReport chartReport;
    private JasperReport batchReport;

    @PostConstruct
    public void initCompileTemplates() {
        System.setProperty("java.awt.headless", "true");
        try (InputStream chartStream = new ClassPathResource("reports/chart.jrxml").getInputStream();
             InputStream batchStream = new ClassPathResource("reports/batch-report.jrxml").getInputStream()) {
            this.chartReport = JasperCompileManager.compileReport(chartStream);
            this.batchReport = JasperCompileManager.compileReport(batchStream);
        } catch (JRException | IOException e) {
            logger.error("Error compiling JasperReports templates: {}", e.getMessage(), e);
            throw new IllegalStateException("No se pudieron compilar las plantillas de reporte", e);
        }
    }

    @Override
    public byte[] renderChartPng(ReportStatistics statistics) {
        if (statistics == null) {
            throw new BusinessException("No se pudo generar el reporte", 500);
        }
        ensureCompiled();
        try {
            List<CategoryChartItem> rows = new ArrayList<>();
            Map<Short, Long> countByCategory = statistics.countByCategory();
            for (short category = 1; category <= 5; category++) {
                long count = countByCategory != null ? countByCategory.getOrDefault(category, 0L) : 0L;
                rows.add(new CategoryChartItem("Categoría " + category, count));
            }
            JasperPrint jasperPrint = JasperFillManager.fillReport(
                    chartReport,
                    new HashMap<>(),
                    new JRBeanCollectionDataSource(rows)
            );
            Image pageImage = JasperPrintManager.printPageToImage(jasperPrint, 0, 1.0f);
            BufferedImage bufferedImage = toBufferedImage(pageImage);
            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                ImageIO.write(bufferedImage, "png", baos);
                return baos.toByteArray();
            }
        } catch (JRException | IOException | RuntimeException e) {
            logger.error("Error rendering chart PNG: {}", e.getMessage(), e);
            throw new BusinessException("No se pudo generar el reporte", 500);
        }
    }

    @Override
    public byte[] exportPdf(Report report) {
        if (report == null) {
            throw new BusinessException("No se pudo generar el PDF", 500);
        }
        ensureCompiled();
        try {
            String statisticsJson = report.getStatistics();
            ReportStatistics statistics = ReportStatistics.fromJson(statisticsJson);
            Map<String, Object> params = buildParameters(report, statistics);
            JasperPrint jasperPrint = JasperFillManager.fillReport(
                    batchReport,
                    params,
                    new JREmptyDataSource(1)
            );
            return JasperExportManager.exportReportToPdf(jasperPrint);
        } catch (BusinessException e) {
            throw e;
        } catch (JRException | RuntimeException e) {
            logger.error("Error exporting report PDF: {}", e.getMessage(), e);
            throw new BusinessException("No se pudo generar el PDF", 500);
        }
    }

    private Map<String, Object> buildParameters(Report report, ReportStatistics statistics) {
        Batch batch = report.getBatch();
        byte[] chartPng = renderChartPng(statistics);

        Map<String, Object> params = new HashMap<>();
        params.put("batchCode", batch != null ? nullSafe(batch.getCode(), "-") : "-");
        params.put("version", report.getVersion() != null ? "v" + report.getVersion() : "v1");
        params.put("currentStatus", report.isCurrent() ? "Vigente" : "Histórico");
        params.put("generatedAt", report.getGeneratedAt() != null
                ? GENERATED_AT_FORMATTER.format(report.getGeneratedAt())
                : "-");
        params.put("captureDate", batch != null && batch.getCaptureDate() != null
                ? batch.getCaptureDate().toString()
                : "-");
        params.put("weightKg", batch != null ? formatDecimal(batch.getWeightKg()) : "0.00");
        params.put("sampleUnitCount", batch != null && batch.getSampleUnitCount() != null
                ? String.valueOf(batch.getSampleUnitCount())
                : String.valueOf(statistics.evaluationCount()));
        params.put("evaluationCount", String.valueOf(statistics.evaluationCount()));
        params.put("finalClassification", formatDecimal(statistics.finalClassification()));
        params.put("eyeAverage", formatDecimal(statistics.eyeAverage()));
        params.put("skinAverage", formatDecimal(statistics.skinAverage()));
        params.put("notes", batch != null && batch.getNotes() != null && !batch.getNotes().isBlank()
                ? batch.getNotes()
                : "Sin observaciones registradas.");
        params.put("chartImage", new ByteArrayInputStream(chartPng));

        Map<Short, Long> counts = statistics.countByCategory();
        long totalPoints = 0L;
        for (short category = 1; category <= 5; category++) {
            totalPoints += counts != null ? counts.getOrDefault(category, 0L) : 0L;
        }
        for (short category = 1; category <= 5; category++) {
            long count = counts != null ? counts.getOrDefault(category, 0L) : 0L;
            String percentage = totalPoints == 0L
                    ? "0.0%"
                    : String.format(Locale.US, "%.1f%%", (count * 100.0) / totalPoints);
            params.put("cat" + category + "Count", count);
            params.put("cat" + category + "Pct", percentage);
        }
        return params;
    }

    private void ensureCompiled() {
        if (chartReport == null || batchReport == null) {
            initCompileTemplates();
        }
    }

    private BufferedImage toBufferedImage(Image image) {
        if (image instanceof BufferedImage buffered) {
            return buffered;
        }
        int width = Math.max(1, image.getWidth(null));
        int height = Math.max(1, image.getHeight(null));
        BufferedImage buffered = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D graphics = buffered.createGraphics();
        try {
            graphics.drawImage(image, 0, 0, null);
        } finally {
            graphics.dispose();
        }
        return buffered;
    }

    private static String formatDecimal(BigDecimal value) {
        return value == null ? "0.00" : value.toPlainString();
    }

    private static String nullSafe(String value, String fallback) {
        return value == null ? fallback : value;
    }

    /** JavaBean row item used by chart.jrxml JRBeanCollectionDataSource. */
    public static class CategoryChartItem {
        private final String categoryLabel;
        private final Number unitCount;

        public CategoryChartItem(String categoryLabel, Number unitCount) {
            this.categoryLabel = categoryLabel;
            this.unitCount = unitCount;
        }

        public String getCategoryLabel() {
            return categoryLabel;
        }

        public Number getUnitCount() {
            return unitCount;
        }
    }
}
