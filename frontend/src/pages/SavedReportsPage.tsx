import { useEffect, useState } from "react";
import SideNav from "../components/SideNav";
import { useI18n } from "../i18n/I18nContext";
import { formatUnitsCount, localizeErrorMessage } from "../i18n/translations";
import { ApiError } from "../services/apiClient";
import { getUserFullName } from "../services/authStorage";
import {
  downloadReportPdf,
  getSavedReport,
  listSavedReports,
  requestDeleteReport,
  saveFile,
} from "../services/reportService";
import type { ReportResponseDTO, ReportSummaryDTO } from "../types/report";

const errorStyle = { color: "#b42318", fontWeight: 600 };
const categories = ["1", "2", "3", "4", "5"] as const;

function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0,00";
  }
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/**
 * HU-11 / HU-12 / HU-14: Saved report history list, frozen version inspection, PDF export, and logical deletion.
 */
export default function SavedReportsPage() {
  const { locale, t } = useI18n();
  const [reports, setReports] = useState<ReportSummaryDTO[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportResponseDTO | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<ReportSummaryDTO | null>(null);
  const [reportToDelete, setReportToDelete] = useState<ReportSummaryDTO | null>(null);

  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [isExportingId, setIsExportingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const userFullName = getUserFullName();

  /** Implements showSavedReports(data) from DS-HU11. */
  function showSavedReports(data: ReportSummaryDTO[]): void {
    setReports(data);
    setIsEmpty(false);
  }

  /** Implements showEmptyResults() from DS-HU11. */
  function showEmptyResults(): void {
    setReports([]);
    setIsEmpty(true);
    setSelectedReport(null);
    setSelectedSummary(null);
  }

  /** Implements showReport(response) from DS-HU11. */
  function showReport(response: ReportResponseDTO): void {
    setSelectedReport(response);
  }

  /** Implements loadSavedReports() from DS-HU11 / DS-HU14. */
  async function loadSavedReports(): Promise<void> {
    setIsLoadingList(true);
    setErrorMessage(null);
    try {
      const data = await listSavedReports();
      if (!data || data.length === 0) {
        showEmptyResults();
      } else {
        showSavedReports(data);
      }
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("savedReports.loadError");
      setErrorMessage(msg);
    } finally {
      setIsLoadingList(false);
    }
  }

  /** Implements openReport(id) from DS-HU11. */
  async function openReport(id: number): Promise<void> {
    setIsLoadingDetail(true);
    setErrorMessage(null);
    const matchingSummary = reports.find((item) => item.id === id) ?? null;
    setSelectedSummary(matchingSummary);
    try {
      const response = await getSavedReport(id);
      showReport(response);
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("savedReports.openError");
      setErrorMessage(msg);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  /** Implements exportReportPdf(id) from DS-HU12. */
  async function exportReportPdf(id: number): Promise<void> {
    setIsExportingId(id);
    setErrorMessage(null);
    try {
      const summary = reports.find((item) => item.id === id);
      const batchCode = summary?.batchCode ?? selectedReport?.batchCode ?? "lote";
      const version = summary?.version ?? selectedReport?.version ?? 1;
      const fallback = `reporte-${batchCode}-v${version}.pdf`;

      const { blob, filename } = await downloadReportPdf(id);
      saveFile(blob, filename ?? fallback);
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("savedReports.exportError");
      setErrorMessage(msg);
    } finally {
      setIsExportingId(null);
    }
  }

  /** Implements deleteReport(id) from DS-HU14. */
  async function deleteReport(id: number): Promise<void> {
    setIsDeleting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await requestDeleteReport(id);
      const deletedItem = reportToDelete;
      setReportToDelete(null);
      if (selectedReport?.reportId === id) {
        setSelectedReport(null);
        setSelectedSummary(null);
      }
      setStatusMessage(
        deletedItem
          ? t("savedReports.deleteSuccessItem", {
              version: deletedItem.version,
              code: deletedItem.batchCode,
            })
          : t("savedReports.deleteSuccess"),
      );
      await loadSavedReports();
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("savedReports.deleteError");
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    void loadSavedReports();
  }, []);

  const maxCategoryCount = selectedReport
    ? Math.max(
        1,
        ...categories.map((cat) => Number(selectedReport.statistics.countByCategory?.[cat] ?? 0)),
      )
    : 1;

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col md:flex-row bg-[#f4f8fb]">
      <SideNav current="reportes" />
      <main id="main-content" className="flex-1 min-w-0 w-full max-w-full p-4 sm:p-6 lg:p-10 flex flex-col gap-5">
        <header className="top flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <hgroup>
            <h1 id="saved-reports-title" className="text-2xl sm:text-3xl lg:text-[36px] font-serif leading-tight">
              {t("savedReports.title")}
            </h1>
            <p style={{ margin: "4px 0 0" }}>
              {t("savedReports.subtitle")}
            </p>
          </hgroup>
          <span
            aria-label={t("app.authenticatedUser")}
            className="self-start sm:self-auto shrink-0 max-w-full truncate bg-[#e6eff6] text-[#094b72] px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm"
          >
            {userFullName}
          </span>
        </header>

        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3"
            style={errorStyle}
          >
            <span>{localizeErrorMessage(errorMessage, locale)}</span>
            <button
              type="button"
              id="saved-reports-retry-banner-button"
              onClick={() => void loadSavedReports()}
              disabled={isLoadingList}
              className="px-3.5 py-1.5 rounded-lg border border-[#b42318]/40 bg-white text-[#b42318] text-xs font-semibold hover:bg-red-100 cursor-pointer disabled:opacity-50"
            >
              {t("savedReports.retry")}
            </button>
          </div>
        )}

        {statusMessage && (
          <div role="status" aria-live="polite" className="rounded-xl border border-[#8fb0c9] bg-[#e6eff6] px-4 py-3 text-sm text-[#094b72] font-semibold">
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-6xl items-start">
          <section
            aria-labelledby="saved-reports-list-heading"
            aria-live="polite"
            className="xl:col-span-7 card p-5 sm:p-6 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-4"
          >
            <header>
              <h2 id="saved-reports-list-heading" className="text-xl font-serif text-[#0b3a5a] m-0">
                {t("savedReports.listHeading")}
              </h2>
            </header>

            {isLoadingList ? (
              <div className="py-10 text-center text-[#4d6a80] font-medium" role="status">
                {t("savedReports.loadingList")}
              </div>
            ) : errorMessage && reports.length === 0 ? (
              <section
                role="status"
                aria-live="polite"
                id="saved-reports-error-state"
                className="py-10 text-center flex flex-col items-center gap-3"
              >
                <p className="text-sm font-semibold text-[#b42318] m-0">
                  {localizeErrorMessage(errorMessage, locale, "savedReports.loadError")}
                </p>
                <button
                  type="button"
                  id="saved-reports-retry-button"
                  onClick={() => void loadSavedReports()}
                  className="o cursor-pointer h-10 px-5 text-xs sm:text-sm"
                >
                  {t("savedReports.retry")}
                </button>
              </section>
            ) : isEmpty || reports.length === 0 ? (
              <section role="status" aria-live="polite" id="empty-reports-container" className="py-12 text-center flex flex-col items-center gap-2">
                <p id="empty-reports-text" className="text-base font-semibold text-[#0b3a5a] m-0">
                  {t("savedReports.emptyTitle")}
                </p>
              </section>
            ) : (
              <div className="w-full max-w-full overflow-x-auto">
                <table className="w-full text-left" id="saved-reports-table">
                  <caption className="sr-only">
                    {t("savedReports.tableCaption")}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="px-2.5 py-2.5 text-xs whitespace-nowrap">{t("savedReports.col.batch")}</th>
                      <th scope="col" className="px-2.5 py-2.5 text-xs whitespace-nowrap">{t("savedReports.col.version")}</th>
                      <th scope="col" className="px-2.5 py-2.5 text-xs whitespace-nowrap">{t("savedReports.col.validity")}</th>
                      <th scope="col" className="px-2.5 py-2.5 text-xs whitespace-nowrap">{t("savedReports.col.final")}</th>
                      <th scope="col" className="px-2.5 py-2.5 text-xs whitespace-nowrap">{t("savedReports.col.date")}</th>
                      <th scope="col" className="px-2.5 py-2.5 text-xs whitespace-nowrap text-right">{t("savedReports.col.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((item) => {
                      const isActive = selectedReport?.reportId === item.id;
                      return (
                        <tr
                          key={item.id}
                          className={isActive ? "bg-[#f0f6fb]" : "hover:bg-slate-50/80 transition-colors"}
                        >
                          <td className="px-2.5 py-3 text-xs sm:text-sm font-semibold text-[#0b4f7a] whitespace-nowrap">
                            {item.batchCode}
                          </td>
                          <td className="px-2.5 py-3 text-xs sm:text-sm whitespace-nowrap">v{item.version}</td>
                          <td className="px-2.5 py-3 text-xs whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block ${
                                item.current
                                  ? "bg-[#e0edf7] text-[#094b72]"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.current ? t("savedReports.current") : t("savedReports.previous")}
                            </span>
                          </td>
                          <td className="px-2.5 py-3 text-xs sm:text-sm font-semibold text-[#0b3a5a] whitespace-nowrap">
                            {formatDecimal(item.finalClassification)}
                          </td>
                          <td className="px-2.5 py-3 text-xs whitespace-nowrap text-[#4d6a80]">
                            <time dateTime={item.generatedAt}>{formatDateTime(item.generatedAt)}</time>
                          </td>
                          <td className="px-2.5 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void openReport(item.id)}
                                aria-label={t("savedReports.viewAria", {
                                  version: item.version,
                                  code: item.batchCode,
                                })}
                                className="text-xs font-semibold text-[#0b4f7a] hover:underline bg-transparent border-0 p-0 cursor-pointer"
                              >
                                {t("savedReports.view")}
                              </button>
                              <span aria-hidden="true" className="text-[#8fb0c9]">·</span>
                              <button
                                type="button"
                                onClick={() => void exportReportPdf(item.id)}
                                disabled={isExportingId === item.id}
                                aria-label={t("savedReports.exportAria", {
                                  version: item.version,
                                  code: item.batchCode,
                                })}
                                className="text-xs font-semibold text-[#094b72] hover:underline bg-transparent border-0 p-0 cursor-pointer disabled:opacity-50"
                              >
                                {isExportingId === item.id ? t("savedReports.exporting") : t("savedReports.exportPdf")}
                              </button>
                              <span aria-hidden="true" className="text-[#8fb0c9]">·</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setReportToDelete(item);
                                  setStatusMessage(null);
                                  setErrorMessage(null);
                                }}
                                aria-label={t("savedReports.deleteAria", {
                                  version: item.version,
                                  code: item.batchCode,
                                })}
                                className="text-xs font-semibold text-[#b42318] hover:underline bg-transparent border-0 p-0 cursor-pointer"
                              >
                                {t("savedReports.delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section
            aria-labelledby="saved-report-detail-heading"
            aria-live="polite"
            className="xl:col-span-5 card p-5 sm:p-6 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-4"
          >
            <header className="flex flex-wrap items-start justify-between gap-2">
              <h2 id="saved-report-detail-heading" className="text-xl font-serif text-[#0b3a5a] m-0">
                {selectedReport
                  ? t("savedReports.detailTitleWithBatch", {
                      code: selectedReport.batchCode,
                      version: selectedReport.version ?? 1,
                    })
                  : t("savedReports.detailTitle")}
              </h2>
              {selectedSummary && (
                <span className="tag text-[#094b72]">
                  {selectedSummary.current ? t("savedReports.current") : t("savedReports.previous")} · {formatDateTime(selectedSummary.generatedAt)}
                </span>
              )}
            </header>

            {isLoadingDetail ? (
              <div className="py-10 text-center text-[#4d6a80] text-sm font-medium" role="status">
                {t("savedReports.loadingDetail")}
              </div>
            ) : selectedReport ? (
              <>
                <dl className="grid grid-cols-2 gap-3 m-0">
                  <div className="p-3 rounded-xl bg-[#f4f8fb] border border-[#e6eef5]">
                    <dt className="text-[11px] font-semibold uppercase text-[#4d6a80]">{t("savedReports.field.captureWeight")}</dt>
                    <dd className="m-0 mt-1 text-xs sm:text-sm font-semibold text-[#0b3a5a]">
                      {selectedReport.captureDate} · {selectedReport.weightKg} kg
                    </dd>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f4f8fb] border border-[#e6eef5]">
                    <dt className="text-[11px] font-semibold uppercase text-[#4d6a80]">
                      {t("savedReports.field.evaluationsVersion", { version: selectedReport.version ?? 1 })}
                    </dt>
                    <dd className="m-0 mt-1 text-xs sm:text-sm font-semibold text-[#0b3a5a]">
                      {formatUnitsCount(selectedReport.sampleUnitCount, locale)}
                    </dd>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f4f8fb] border border-[#e6eef5]">
                    <dt className="text-[11px] font-semibold uppercase text-[#4d6a80]">{t("savedReports.field.eyeSkin")}</dt>
                    <dd className="m-0 mt-1 text-xs sm:text-sm font-semibold text-[#0b3a5a]">
                      {formatDecimal(selectedReport.statistics.eyeAverage)} /{" "}
                      {formatDecimal(selectedReport.statistics.skinAverage)}
                    </dd>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f4f8fb] border border-[#e6eef5]">
                    <dt className="text-[11px] font-semibold uppercase text-[#4d6a80]">{t("savedReports.field.classification")}</dt>
                    <dd className="m-0 mt-1 text-sm font-bold text-[#094b72]">
                      {formatDecimal(selectedReport.statistics.finalClassification)}
                    </dd>
                  </div>
                </dl>

                {selectedReport.chartImage ? (
                  <figure className="m-0">
                    <img
                      src={selectedReport.chartImage}
                      alt={t("report.chartAlt")}
                      className="w-full h-auto rounded-xl border border-[#e6eef5] bg-[#f8fbfd]"
                    />
                  </figure>
                ) : (
                  <ul className="list-none p-3 m-0 rounded-xl border border-[#e6eef5] bg-[#f8fbfd] flex flex-col gap-2" aria-label={t("savedReports.frozenDistAria")}>
                    {categories.map((category) => {
                      const count = Number(selectedReport.statistics.countByCategory?.[category] ?? 0);
                      const widthPercent = count > 0 ? Math.max(8, Math.round((count / maxCategoryCount) * 100)) : 0;
                      return (
                        <li key={category} className="grid grid-cols-[50px_1fr_28px] items-center gap-2 text-xs text-[#0b3a5a]">
                          <span className="font-semibold">{t("report.catShort", { cat: category })}</span>
                          <div className="h-2.5 rounded-full bg-[#dcebf6] overflow-hidden" aria-hidden="true">
                            <div className="h-full rounded-full bg-[#0b4f7a]" style={{ width: `${widthPercent}%` }} />
                          </div>
                          <span className="text-right font-semibold">{count}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <footer className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-[#e6eef5]">
                  <a
                    href={`#/reportes/detalle?id=${selectedReport.reportId}`}
                    className="text-xs font-semibold text-[#0b4f7a] hover:underline"
                  >
                    {t("savedReports.openFull")}
                  </a>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="o cursor-pointer h-10 px-4 text-xs"
                      onClick={() => {
                        const target = reports.find((item) => item.id === selectedReport.reportId);
                        if (target) {
                          setReportToDelete(target);
                        }
                      }}
                    >
                      {t("savedReports.deleteReport")}
                    </button>
                    <button
                      type="button"
                      className="p cursor-pointer h-10 px-4 text-xs disabled:opacity-50"
                      disabled={isExportingId === selectedReport.reportId || selectedReport.reportId === null}
                      onClick={() => selectedReport.reportId !== null && void exportReportPdf(selectedReport.reportId)}
                    >
                      {isExportingId === selectedReport.reportId ? t("savedReports.exporting") : t("savedReports.exportPdf")}
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <p className="text-xs sm:text-sm text-[#4d6a80] m-0 py-6">
                {t("savedReports.selectPrompt")}
              </p>
            )}
          </section>
        </div>

        {reportToDelete && (
          <section
            role="dialog"
            aria-modal="false"
            aria-labelledby="confirm-delete-report-title"
            className="card w-full max-w-6xl p-5 sm:p-6 rounded-2xl bg-red-50/60 border border-[#b42318]/40 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex flex-col gap-1">
              <h2 id="confirm-delete-report-title" className="text-lg sm:text-xl font-serif text-[#8a1c13] m-0">
                {t("savedReports.confirmTitle", {
                  version: reportToDelete.version,
                  code: reportToDelete.batchCode,
                })}
              </h2>
              <p className="text-xs sm:text-sm text-[#4d6a80] m-0">
                {t("savedReports.confirmBody")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                className="o cursor-pointer h-11 px-5 text-sm"
                onClick={() => setReportToDelete(null)}
                disabled={isDeleting}
              >
                {t("savedReports.cancel")}
              </button>
              <button
                type="button"
                id="confirm-delete-report-button"
                className="h-11 px-5 rounded-xl border-0 bg-[#9b2c1a] text-white text-sm font-semibold hover:bg-[#7d2214] transition-colors cursor-pointer disabled:opacity-50"
                onClick={() => void deleteReport(reportToDelete.id)}
                disabled={isDeleting}
              >
                {isDeleting ? t("savedReports.deleting") : t("savedReports.confirmDelete")}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
