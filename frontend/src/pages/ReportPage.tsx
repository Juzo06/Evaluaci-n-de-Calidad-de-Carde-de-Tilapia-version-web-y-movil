import { useEffect, useState } from "react";
import SideNav from "../components/SideNav";
import { useI18n } from "../i18n/I18nContext";
import {
  formatBatchStatus,
  formatUnitsCount,
  localizeErrorMessage,
} from "../i18n/translations";
import { ApiError } from "../services/apiClient";
import { getUserFullName } from "../services/authStorage";
import { getBatchByCode } from "../services/batchService";
import {
  downloadReportPdf,
  getBatchReport,
  getSavedReport,
  saveFile,
  saveReport,
} from "../services/reportService";
import type { EvaluationResponseDTO } from "../types/evaluation";
import type { ReportResponseDTO, ReportSummaryDTO } from "../types/report";

const errorStyle = { color: "#b42318", fontWeight: 600 };
const categories = ["1", "2", "3", "4", "5"] as const;

interface ReportRouteTarget {
  mode: "batch" | "saved" | "invalid";
  code?: string;
  status?: string;
  reportId?: number;
}

function parseReportRouteTarget(): ReportRouteTarget {
  const fullHash = window.location.hash;
  const [rawPath, rawQuery = ""] = fullHash.split("?");
  const normalizedPath = rawPath.toLowerCase();
  const params = new URLSearchParams(rawQuery);

  if (normalizedPath === "#/reportes/lote" || normalizedPath === "#/reporte-lote") {
    const code = params.get("code")?.trim();
    const status = params.get("status")?.trim();
    if (code) {
      return { mode: "batch", code, status: status || undefined };
    }
    return { mode: "invalid" };
  }

  if (normalizedPath === "#/reportes/detalle") {
    const idParam = Number(params.get("id"));
    if (Number.isInteger(idParam) && idParam > 0) {
      return { mode: "saved", reportId: idParam };
    }
    return { mode: "invalid" };
  }

  const savedPathMatch = normalizedPath.match(/^#\/reportes\/(\d+)$/);
  if (savedPathMatch) {
    return { mode: "saved", reportId: Number(savedPathMatch[1]) };
  }

  return { mode: "invalid" };
}

function formatDecimal(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0,00";
  }
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
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

function findPart(unit: EvaluationResponseDTO, code: string) {
  return unit.results.find((item) => item.fishPartCode === code);
}

/**
 * HU-06 / HU-10 / HU-11 / HU-12: Batch report preview, frozen version detail, saving, and PDF export page.
 */
export default function ReportPage() {
  const { locale, t } = useI18n();
  const [target, setTarget] = useState<ReportRouteTarget>(parseReportRouteTarget);
  const [report, setReport] = useState<ReportResponseDTO | null>(null);
  const [batchStatus, setBatchStatus] = useState<string | null>(target.status ?? null);
  const [savedSummary, setSavedSummary] = useState<ReportSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const userFullName = getUserFullName();

  /** Implements showReport(response) from DS-HU6 and DS-HU11. */
  function showReport(response: ReportResponseDTO): void {
    setReport(response);
  }

  /** Implements showSavedReport(response) from DS-HU10. */
  function showSavedReport(response: ReportSummaryDTO): void {
    setSavedSummary(response);
    setBatchStatus("REPORTADO");
    setReport((current) =>
      current
        ? {
            ...current,
            reportId: response.id,
            version: response.version,
          }
        : current,
    );
  }

  /** Implements generateBatchReport(code) from DS-HU6. */
  async function generateBatchReport(code: string, initialStatus?: string): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);
    setSavedSummary(null);
    setBatchStatus(initialStatus ?? null);
    try {
      const reportResponse = await getBatchReport(code);
      showReport(reportResponse);
      try {
        const batch = await getBatchByCode(code);
        setBatchStatus(batch.statusCode);
      } catch {
        // Keep query-provided status if auxiliary batch lookup fails
      }
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("report.generateError");
      setErrorMessage(msg);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }

  /** Implements openReport(id) from DS-HU11. */
  async function openReport(id: number): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);
    setSavedSummary(null);
    setBatchStatus(null);
    try {
      const response = await getSavedReport(id);
      showReport(response);
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("report.consultError");
      setErrorMessage(msg);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }

  /** Implements saveBatchReport(code) from DS-HU10. */
  async function saveBatchReport(code: string): Promise<void> {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await saveReport(code);
      showSavedReport(response);
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("report.saveError");
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  }

  /** Implements exportReportPdf(id) from DS-HU12. */
  async function exportReportPdf(id: number): Promise<void> {
    setIsExporting(true);
    setErrorMessage(null);
    try {
      const { blob, filename } = await downloadReportPdf(id);
      const fallback = `reporte-${report?.batchCode ?? "lote"}-v${report?.version ?? 1}.pdf`;
      saveFile(blob, filename ?? fallback);
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("report.exportError");
      setErrorMessage(msg);
    } finally {
      setIsExporting(false);
    }
  }

  useEffect(() => {
    const syncTarget = () => setTarget(parseReportRouteTarget());
    window.addEventListener("hashchange", syncTarget);
    return () => window.removeEventListener("hashchange", syncTarget);
  }, []);

  useEffect(() => {
    if (target.mode === "batch" && target.code) {
      void generateBatchReport(target.code, target.status);
      return;
    }
    if (target.mode === "saved" && target.reportId) {
      void openReport(target.reportId);
      return;
    }
    setIsLoading(false);
    setReport(null);
    setErrorMessage(t("report.invalidTarget"));
  }, [target.mode, target.code, target.status, target.reportId]);

  const isSavedView = report !== null && report.reportId !== null;
  const maxCategoryCount = report
    ? Math.max(
        1,
        ...categories.map((cat) => Number(report.statistics.countByCategory?.[cat] ?? 0)),
      )
    : 1;
  const canSaveReport =
    report !== null &&
    report.reportId === null &&
    (batchStatus === null || batchStatus === "EVALUADO");

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col md:flex-row bg-[#f4f8fb]">
      <SideNav current={target.mode === "saved" ? "reportes" : "evaluados"} />
      <main id="main-content" className="flex-1 min-w-0 w-full max-w-full p-4 sm:p-6 lg:p-10 flex flex-col gap-5">
        <header className="top flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <hgroup>
            <h1 id="report-page-title" className="text-2xl sm:text-3xl lg:text-[36px] font-serif leading-tight">
              {isSavedView ? t("report.titleSaved", { version: report.version ?? 1 }) : t("report.titleBatch")}
            </h1>
            <p style={{ margin: "4px 0 0" }}>
              {t("report.subtitle")}
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
          <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm" style={errorStyle}>
            {localizeErrorMessage(errorMessage, locale)}
          </div>
        )}

        {savedSummary && (
          <section
            role="status"
            aria-live="polite"
            id="report-saved-banner"
            className="rounded-2xl border border-[#8fb0c9] bg-[#e8f2fa] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-5xl"
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm sm:text-base font-bold text-[#094b72] m-0">
                {t("report.savedBannerTitle", { version: savedSummary.version })}
              </p>
              <p className="text-xs text-[#4d6a80] m-0">
                {t("report.savedBannerStoredAt")}
                <time dateTime={savedSummary.generatedAt}>{formatDateTime(savedSummary.generatedAt)}</time>
                {t("report.savedBannerSuffix", { code: savedSummary.batchCode })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="#/reportes"
                className="o inline-flex items-center justify-center text-xs sm:text-sm no-underline px-4 h-10 rounded-xl"
              >
                {t("report.viewSavedReports")}
              </a>
            </div>
          </section>
        )}

        {isLoading ? (
          <section
            role="status"
            aria-live="polite"
            className="card w-full max-w-5xl p-10 rounded-2xl bg-white border border-[#d5e3ee] text-center text-[#4d6a80] font-medium"
          >
            {t("report.loading")}
          </section>
        ) : report ? (
          <div className="flex flex-col gap-5 max-w-5xl">
            <section
              aria-labelledby="batch-summary-heading"
              className="card p-5 sm:p-6 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-4"
            >
              <h2 id="batch-summary-heading" className="sr-only">
                {t("report.summaryHeading")}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 m-0">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#4d6a80]">{t("report.field.batchCode")}</dt>
                  <dd className="m-0 mt-1 text-sm font-bold text-[#0b3a5a]">{report.batchCode}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#4d6a80]">{t("report.field.captureDate")}</dt>
                  <dd className="m-0 mt-1 text-sm font-semibold text-[#0b3a5a]">
                    <time dateTime={report.captureDate}>{report.captureDate}</time>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#4d6a80]">{t("report.field.weightSample")}</dt>
                  <dd className="m-0 mt-1 text-sm font-semibold text-[#0b3a5a]">
                    {report.weightKg} kg · {formatUnitsCount(report.sampleUnitCount, locale)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#4d6a80]">{t("report.field.eyeSkinAvg")}</dt>
                  <dd className="m-0 mt-1 text-sm font-semibold text-[#0b3a5a]">
                    {formatDecimal(report.statistics.eyeAverage)} / {formatDecimal(report.statistics.skinAverage)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#4d6a80]">{t("report.field.finalClassification")}</dt>
                  <dd className="m-0 mt-1">
                    <span className="tag text-[#094b72]">
                      {formatDecimal(report.statistics.finalClassification)}
                      {report.version !== null
                        ? ` · v${report.version}`
                        : batchStatus
                          ? ` · ${formatBatchStatus(batchStatus, locale)}`
                          : ""}
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-[#4d6a80] m-0 pt-2 border-t border-[#e6eef5]">
                {t("report.notesLine", {
                  notes: report.notes && report.notes.trim() !== "" ? report.notes : t("report.noNotes"),
                })}
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <section
                aria-labelledby="ntc-distribution-title"
                className="lg:col-span-5 card p-5 sm:p-6 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-4"
              >
                <header>
                  <h2 id="ntc-distribution-title" className="text-xl font-serif text-[#0b3a5a] m-0">
                    {t("report.ntcTitle")}
                  </h2>
                  <p className="text-xs text-[#4d6a80] m-0 mt-1">
                    {t("report.ntcSubtitle")}
                  </p>
                </header>

                {report.chartImage ? (
                  <figure className="m-0 flex flex-col gap-2">
                    <img
                      src={report.chartImage}
                      alt={t("report.chartAlt")}
                      className="w-full h-auto rounded-xl border border-[#e6eef5] bg-[#f8fbfd]"
                    />
                  </figure>
                ) : (
                  <ul className="list-none p-0 m-0 flex flex-col gap-3 rounded-xl border border-[#d5e3ee] bg-[#f8fbfd] p-4" aria-label={t("report.ntcCountAria")}>
                    {categories.map((category) => {
                      const count = Number(report.statistics.countByCategory?.[category] ?? 0);
                      const widthPercent = count > 0 ? Math.max(8, Math.round((count / maxCategoryCount) * 100)) : 0;
                      return (
                        <li key={category} className="grid grid-cols-[54px_1fr_32px] items-center gap-3 text-xs text-[#0b3a5a]">
                          <span className="font-semibold">{t("report.catShort", { cat: category })}</span>
                          <div className="h-3 rounded-full bg-[#dcebf6] overflow-hidden" aria-hidden="true">
                            <div
                              className="h-full rounded-full bg-[#0b4f7a]"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                          <span className="text-right font-semibold">{count}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <footer className="text-xs text-[#4d6a80]">
                  {t("report.evaluationsCountFooter", {
                    count: report.statistics.evaluationCount,
                    total: formatUnitsCount(report.sampleUnitCount, locale),
                  })}
                </footer>
              </section>

              <section
                aria-labelledby="unit-evaluations-title"
                className="lg:col-span-7 card p-5 sm:p-6 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-4"
              >
                <header>
                  <h2 id="unit-evaluations-title" className="text-xl font-serif text-[#0b3a5a] m-0">
                    {report.units.length > 0 ? t("report.unitsTitle") : t("report.consolidatedTitle")}
                  </h2>
                </header>

                {report.units.length > 0 ? (
                  <div className="w-full max-w-full overflow-x-auto">
                    <table className="w-full text-left" id="report-units-table">
                      <caption className="sr-only">
                        {t("report.unitsTableCaption")}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col" className="px-2.5 py-2.5 text-xs whitespace-nowrap">{t("report.col.unit")}</th>
                          <th scope="col" className="px-2.5 py-2.5 text-xs whitespace-nowrap">{t("report.col.dateTime")}</th>
                          <th scope="col" className="px-2.5 py-2.5 text-xs whitespace-nowrap">{t("report.col.eye")}</th>
                          <th scope="col" className="px-2.5 py-2.5 text-xs whitespace-nowrap">{t("report.col.skin")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.units.map((unit, index) => {
                          const eye = findPart(unit, "OJO");
                          const skin = findPart(unit, "PIEL");
                          return (
                            <tr key={unit.id}>
                              <td className="px-2.5 py-2.5 text-xs sm:text-sm font-semibold">{index + 1}</td>
                              <td className="px-2.5 py-2.5 text-xs sm:text-sm whitespace-nowrap">
                                <time dateTime={unit.evaluatedAt}>{formatDateTime(unit.evaluatedAt)}</time>
                              </td>
                              <td className="px-2.5 py-2.5 text-xs sm:text-sm whitespace-nowrap">
                                {eye ? `${t("report.catShort", { cat: eye.ntcCategory })} · ${formatDecimal(eye.confidence, 4)}` : "—"}
                              </td>
                              <td className="px-2.5 py-2.5 text-xs sm:text-sm whitespace-nowrap">
                                {skin ? `${t("report.catShort", { cat: skin.ntcCategory })} · ${formatDecimal(skin.confidence, 4)}` : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#d5e3ee] bg-[#f8fbfd] p-4 flex flex-col gap-2 text-xs sm:text-sm text-[#4d6a80]">
                    <p className="m-0 font-semibold text-[#0b3a5a]">
                      {t("report.frozenTitle")}
                    </p>
                    <p className="m-0">
                      {t("report.frozenBody", {
                        count: formatUnitsCount(report.sampleUnitCount, locale),
                        eye: formatDecimal(report.statistics.eyeAverage),
                        skin: formatDecimal(report.statistics.skinAverage),
                        version: report.version ?? 1,
                      })}
                    </p>
                  </div>
                )}

                <footer className="flex flex-col gap-3 pt-2 border-t border-[#e6eef5]">
                  {report.reportId === null && (
                    <p className="text-xs text-[#4d6a80] m-0">
                      {batchStatus === "REPORTADO"
                        ? t("report.alreadyReportedHint")
                        : t("report.saveHint")}
                    </p>
                  )}

                  <div className="row flex flex-col sm:flex-row justify-end gap-3">
                    <a
                      href={target.mode === "saved" ? "#/reportes" : "#/evaluados"}
                      className="o inline-flex items-center justify-center no-underline px-5"
                    >
                      {target.mode === "saved" ? t("report.backToSaved") : t("report.backToEvaluated")}
                    </a>

                    {report.reportId === null ? (
                      <button
                        type="button"
                        id="save-report-button"
                        className="p cursor-pointer disabled:opacity-50"
                        disabled={!canSaveReport || isSaving}
                        onClick={() => void saveBatchReport(report.batchCode)}
                      >
                        {isSaving ? t("report.saving") : t("report.save")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="export-report-pdf-button"
                        className="p cursor-pointer disabled:opacity-50"
                        disabled={isExporting}
                        onClick={() => report.reportId !== null && void exportReportPdf(report.reportId)}
                      >
                        {isExporting ? t("report.exportingPdf") : t("report.exportPdf")}
                      </button>
                    )}
                  </div>
                </footer>
              </section>
            </div>
          </div>
        ) : (
          <section className="card w-full max-w-5xl p-8 rounded-2xl bg-white border border-[#d5e3ee] flex flex-col items-start gap-4">
            <p className="text-sm text-[#4d6a80] m-0">
              {t("report.unavailable")}
            </p>
            <a href="#/evaluados" className="o inline-flex items-center justify-center no-underline px-5">
              {t("report.backToEvaluated")}
            </a>
          </section>
        )}
      </main>
    </div>
  );
}
