package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.BatchStatus;
import co.unillanos.secct.entities.Evaluation;
import co.unillanos.secct.entities.Report;
import co.unillanos.secct.infrastructure.repositories.BatchRepository;
import co.unillanos.secct.infrastructure.repositories.BatchStatusRepository;
import co.unillanos.secct.infrastructure.repositories.EvaluationRepository;
import co.unillanos.secct.infrastructure.repositories.ReportRepository;
import co.unillanos.secct.usecases.dto.ReportResponseDTO;
import co.unillanos.secct.usecases.dto.ReportStatistics;
import co.unillanos.secct.usecases.dto.ReportSummaryDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import co.unillanos.secct.usecases.ports.ReportGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/** Service implementing HU-06, HU-10, HU-11, HU-12 and HU-14 report workflows. */
@Service
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    private static final String REPORT_GENERATED_EVENT = "REPORT_GENERATED";
    private static final String REPORT_SAVED_EVENT = "REPORT_SAVED";
    private static final String REPORT_VIEWED_EVENT = "REPORT_VIEWED";
    private static final String REPORT_EXPORTED_EVENT = "REPORT_EXPORTED";
    private static final String REPORT_DELETED_EVENT = "REPORT_DELETED";

    private final BatchRepository batchRepository;
    private final BatchStatusRepository statusRepository;
    private final EvaluationRepository evaluationRepository;
    private final ReportRepository reportRepository;
    private final ReportStatisticsCalculator statisticsCalculator;
    private final ReportGenerator reportGenerator;
    private final LogService logService;

    @Autowired
    public ReportService(BatchRepository batchRepository,
                         BatchStatusRepository statusRepository,
                         EvaluationRepository evaluationRepository,
                         ReportRepository reportRepository,
                         ReportStatisticsCalculator statisticsCalculator,
                         ObjectProvider<ReportGenerator> reportGeneratorProvider,
                         LogService logService) {
        this(batchRepository, statusRepository, evaluationRepository, reportRepository,
                statisticsCalculator, reportGeneratorProvider.getIfAvailable(), logService);
    }

    public ReportService(BatchRepository batchRepository,
                         BatchStatusRepository statusRepository,
                         EvaluationRepository evaluationRepository,
                         ReportRepository reportRepository,
                         ReportStatisticsCalculator statisticsCalculator,
                         ReportGenerator reportGenerator,
                         LogService logService) {
        this.batchRepository = batchRepository;
        this.statusRepository = statusRepository;
        this.evaluationRepository = evaluationRepository;
        this.reportRepository = reportRepository;
        this.statisticsCalculator = statisticsCalculator;
        this.reportGenerator = reportGenerator;
        this.logService = logService;
    }

    /** HU-06: Generates an unsaved quality report preview with live statistics and chart PNG (DS-HU6). */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ReportResponseDTO generate(String code, Integer ownerId) {
        Batch batch = findOwnBatch(code, ownerId);
        if (!batch.isEvaluated()) {
            throw new BusinessException("El lote aún no está evaluado", 409);
        }

        List<Evaluation> evaluations = evaluationRepository.findByBatchId(batch.getId());
        ReportStatistics statistics = statisticsCalculator.calculate(evaluations);
        byte[] chartPng = renderChartOrThrow(statistics);

        logService.recordEvent(REPORT_GENERATED_EVENT, ownerId, batch.getId(), null,
                "Reporte generado para el lote " + batch.getCode());

        return ReportResponseDTO.from(batch, evaluations, statistics, chartPng);
    }

    /** HU-10: Persists a new report version with frozen statistics and marks the batch REPORTADO (DS-HU10). */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ReportSummaryDTO save(String code, Integer ownerId) {
        Batch batch = findOwnBatch(code, ownerId);
        if (!batch.canBeReported()) {
            throw new BusinessException("El lote no se puede reportar en su estado actual", 409);
        }

        List<Evaluation> evaluations = evaluationRepository.findByBatchId(batch.getId());
        ReportStatistics statistics = statisticsCalculator.calculate(evaluations);
        int maxVersion = reportRepository.findMaxVersionByBatchId(batch.getId());

        Report report = new Report(batch, maxVersion + 1, statistics);
        Report savedReport = reportRepository.save(report);

        BatchStatus reportedStatus = statusRepository.findByCode(BatchStatus.REPORTED)
                .orElseThrow(() -> new BusinessException(
                        "El estado " + BatchStatus.REPORTED + " no está configurado", 500));
        batch.markReported(reportedStatus);
        batchRepository.save(batch);

        logService.recordEvent(REPORT_SAVED_EVENT, ownerId, batch.getId(), null,
                "Reporte versión " + savedReport.getVersion() + " guardado para el lote " + batch.getCode());

        return ReportSummaryDTO.from(savedReport);
    }

    /** HU-11: Lists all active saved report versions belonging to the authenticated owner (DS-HU11). */
    @Transactional(readOnly = true)
    public List<ReportSummaryDTO> listByOwner(Integer ownerId) {
        if (ownerId == null) {
            throw new BusinessException("Usuario no autenticado", 401);
        }

        return reportRepository.findByBatchOwnerIdAndIsDeletedFalse(ownerId).stream()
                .sorted(Comparator.comparing(Report::getGeneratedAt,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Report::getVersion,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .map(ReportSummaryDTO::from)
                .toList();
    }

    /** HU-11: Retrieves a saved report version using frozen statistics and regenerates its chart (DS-HU11). */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ReportResponseDTO getById(Integer id, Integer ownerId) {
        Report report = findOwnReport(id, ownerId);
        ReportStatistics statistics = ReportStatistics.fromJson(report.getStatistics());
        byte[] chartPng = renderChartOrThrow(statistics);

        logService.recordEvent(REPORT_VIEWED_EVENT, ownerId, report.getBatch().getId(), null,
                "Consulta del reporte versión " + report.getVersion()
                        + " del lote " + report.getBatch().getCode());

        return ReportResponseDTO.fromSaved(report, chartPng);
    }

    /** HU-12: Exports a saved report to PDF bytes via ReportGenerator and logs REPORT_EXPORTED (DS-HU12). */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public byte[] exportPdf(Integer id, Integer ownerId) {
        Report report = findOwnReport(id, ownerId);
        byte[] pdf = exportPdfOrThrow(report);

        logService.recordEvent(REPORT_EXPORTED_EVENT, ownerId, report.getBatch().getId(), null,
                "Exportación a PDF del reporte versión " + report.getVersion()
                        + " del lote " + report.getBatch().getCode());

        return pdf;
    }

    /** Builds the download filename expected by Content-Disposition in HU-12. */
    @Transactional(readOnly = true)
    public String resolvePdfFilename(Integer id, Integer ownerId) {
        Report report = findOwnReport(id, ownerId);
        return "reporte-" + report.getBatch().getCode() + "-v" + report.getVersion() + ".pdf";
    }

    /** HU-14: Logically deletes a report version and reverts the batch to EVALUADO if it was current (DS-HU14). */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void delete(Integer id, Integer ownerId) {
        Report report = findOwnReport(id, ownerId);
        boolean wasCurrent = report.isCurrent();

        report.softDelete(ownerId);
        reportRepository.save(report);

        Batch batch = report.getBatch();
        if (wasCurrent) {
            BatchStatus evaluatedStatus = statusRepository.findByCode(BatchStatus.EVALUATED)
                    .orElseThrow(() -> new BusinessException(
                            "El estado " + BatchStatus.EVALUATED + " no está configurado", 500));
            batch.revertToEvaluated(evaluatedStatus);
            batchRepository.save(batch);
        }

        logService.recordEvent(REPORT_DELETED_EVENT, ownerId, batch.getId(), null,
                "Reporte versión " + report.getVersion() + " del lote " + batch.getCode() + " eliminado");
    }

    private Batch findOwnBatch(String code, Integer ownerId) {
        if (ownerId == null) {
            throw new BusinessException("Usuario no autenticado", 401);
        }
        return batchRepository.findByCodeAndOwnerIdAndIsDeletedFalse(code, ownerId)
                .orElseThrow(() -> new BusinessException("Lote no encontrado", 404));
    }

    private Report findOwnReport(Integer id, Integer ownerId) {
        if (ownerId == null) {
            throw new BusinessException("Usuario no autenticado", 401);
        }
        return reportRepository.findByIdAndBatchOwnerIdAndIsDeletedFalse(id, ownerId)
                .orElseThrow(() -> new BusinessException("Reporte no encontrado", 404));
    }

    private byte[] renderChartOrThrow(ReportStatistics statistics) {
        if (reportGenerator == null) {
            log.error("ReportGenerator no disponible al renderizar gráfica");
            throw new BusinessException("No se pudo generar el reporte", 500);
        }
        try {
            return reportGenerator.renderChartPng(statistics);
        } catch (BusinessException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            log.error("Fallo inesperado al renderizar gráfica del reporte", ex);
            throw new BusinessException("No se pudo generar el reporte", 500);
        }
    }

    private byte[] exportPdfOrThrow(Report report) {
        if (reportGenerator == null) {
            log.error("ReportGenerator no disponible al exportar PDF");
            throw new BusinessException("No se pudo generar el PDF", 500);
        }
        try {
            return reportGenerator.exportPdf(report);
        } catch (BusinessException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            log.error("Fallo inesperado al exportar reporte a PDF", ex);
            throw new BusinessException("No se pudo generar el PDF", 500);
        }
    }
}
