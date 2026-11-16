package co.unillanos.secct.usecases.ports;

import co.unillanos.secct.entities.Report;
import co.unillanos.secct.usecases.dto.ReportStatistics;

/** Port decoupling report rendering (charts and PDF export) from JasperReports. */
public interface ReportGenerator {

    byte[] renderChartPng(ReportStatistics statistics);

    byte[] exportPdf(Report report);
}
