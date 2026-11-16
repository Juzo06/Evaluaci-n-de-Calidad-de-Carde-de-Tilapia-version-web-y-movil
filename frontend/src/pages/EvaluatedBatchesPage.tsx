import { useEffect, useState } from "react";
import ExpandSampleForm from "../components/ExpandSampleForm";
import SideNav from "../components/SideNav";
import { useI18n } from "../i18n/I18nContext";
import { formatBatchStatus, localizeErrorMessage } from "../i18n/translations";
import { ApiError } from "../services/apiClient";
import { consultEvaluatedBatches as apiConsultEvaluatedBatches } from "../services/batchService";
import { getUserFullName } from "../services/authStorage";
import type { BatchResponseDTO } from "../types/batch";

const errorStyle = { color: "#b42318", fontWeight: 600 };

function formatClassification(value: number | null): string {
  if (value === null || value === undefined) {
    return "0,00";
  }
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * HU-05 / HU-06 / HU-13: Page for consulting evaluated and reported batches (DS-HU5, Mockup HU-05).
 */
export default function EvaluatedBatchesPage() {
  const { locale, t } = useI18n();
  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandingBatch, setExpandingBatch] = useState<BatchResponseDTO | null>(null);
  const userFullName = getUserFullName();

  /** Implements showEvaluatedBatches from DC-HU5 / DS-HU5 diagram. */
  function showEvaluatedBatches(data: BatchResponseDTO[]): void {
    setBatches(data);
    setIsEmpty(false);
  }

  /** Implements showEmptyResults from DC-HU5 / DS-HU5 diagram (PL-5.01, CN-08). */
  function showEmptyResults(): void {
    setBatches([]);
    setIsEmpty(true);
  }

  /** Implements consultEvaluatedBatches from DC-HU5 / DS-HU5 diagram. */
  async function consultEvaluatedBatches(): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiConsultEvaluatedBatches();
      if (!data || data.length === 0) {
        showEmptyResults();
      } else {
        showEvaluatedBatches(data);
      }
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("evaluated.loadError");
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenReport(batch: BatchResponseDTO): void {
    window.location.hash = `#/reportes/lote?code=${encodeURIComponent(batch.code)}&status=${encodeURIComponent(batch.statusCode)}`;
  }

  useEffect(() => {
    void consultEvaluatedBatches();
  }, []);

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col md:flex-row bg-[#f4f8fb]">
      <SideNav current="evaluados" />
      <main id="main-content" className="flex-1 min-w-0 w-full max-w-full p-4 sm:p-6 lg:p-10 flex flex-col gap-5">
        <header className="top flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <hgroup>
            <h1 id="evaluated-batches-title" className="text-2xl sm:text-3xl lg:text-[36px] font-serif leading-tight">
              {t("evaluated.title")}
            </h1>
            <p style={{ margin: "4px 0 0" }}>
              {t("evaluated.subtitle")}
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
            {localizeErrorMessage(errorMessage, locale, "evaluated.loadError")}
          </div>
        )}

        {expandingBatch && (
          <ExpandSampleForm
            batch={expandingBatch}
            onCancel={() => setExpandingBatch(null)}
            onExpanded={() => setExpandingBatch(null)}
          />
        )}

        <section
          aria-labelledby="evaluated-batches-title"
          aria-live="polite"
          className="card w-full min-w-0 max-w-5xl p-4 sm:p-6 lg:p-8 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm"
        >
          {isLoading ? (
            <div className="py-12 text-center text-[#4d6a80] font-medium" role="status">
              {t("evaluated.loading")}
            </div>
          ) : isEmpty || batches.length === 0 ? (
            <section
              role="status"
              aria-live="polite"
              id="empty-results-container"
              className="py-16 text-center flex flex-col items-center justify-center gap-3"
            >
              <p id="empty-results-text" className="text-base font-semibold text-[#0b3a5a] m-0">
                {t("evaluated.emptyTitle")}
              </p>
            </section>
          ) : (
            <div className="w-full max-w-full overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
              <table className="w-full text-left" id="evaluated-batches-table">
                <caption className="sr-only">
                  {t("evaluated.tableCaption")}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="px-2.5 py-3 text-xs whitespace-nowrap">{t("evaluated.col.code")}</th>
                    <th scope="col" className="px-2.5 py-3 text-xs whitespace-nowrap">{t("evaluated.col.capture")}</th>
                    <th scope="col" className="px-2.5 py-3 text-xs whitespace-nowrap">{t("evaluated.col.weight")}</th>
                    <th scope="col" className="px-2.5 py-3 text-xs whitespace-nowrap text-center">{t("evaluated.col.sample")}</th>
                    <th scope="col" className="px-2.5 py-3 text-xs min-w-[120px] max-w-[190px]">{t("evaluated.col.notes")}</th>
                    <th scope="col" className="px-2.5 py-3 text-xs whitespace-nowrap text-center">{t("evaluated.col.eval")}</th>
                    <th scope="col" className="px-2.5 py-3 text-xs whitespace-nowrap">{t("evaluated.col.status")}</th>
                    <th scope="col" className="px-2.5 py-3 text-xs whitespace-nowrap">{t("evaluated.col.classification")}</th>
                    <th scope="col" className="px-2.5 py-3 text-xs whitespace-nowrap">{t("evaluated.col.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr key={batch.id || batch.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-2.5 py-3 text-xs sm:text-sm font-semibold text-[#0b4f7a] whitespace-nowrap">
                        {batch.code}
                      </td>
                      <td className="px-2.5 py-3 text-xs sm:text-sm whitespace-nowrap">
                        <time dateTime={batch.captureDate}>{batch.captureDate}</time>
                      </td>
                      <td className="px-2.5 py-3 text-xs sm:text-sm whitespace-nowrap">{batch.weightKg}</td>
                      <td className="px-2.5 py-3 text-xs sm:text-sm text-center whitespace-nowrap">{batch.sampleUnitCount}</td>
                      <td
                        className="px-2.5 py-3 text-xs sm:text-sm min-w-[120px] max-w-[190px] truncate"
                        title={batch.notes ?? undefined}
                      >
                        {batch.notes && batch.notes.trim().length > 0 ? batch.notes : "—"}
                      </td>
                      <td className="px-2.5 py-3 text-xs sm:text-sm text-center whitespace-nowrap">{batch.evaluationCount}</td>
                      <td className="px-2.5 py-3 text-xs whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                            batch.statusCode === "REPORTADO"
                              ? "bg-[#d8ebfa] text-[#083f62]"
                              : "bg-[#e0edf7] text-[#094b72]"
                          }`}
                        >
                          {formatBatchStatus(batch.statusCode, locale)}
                        </span>
                      </td>
                      <td className="px-2.5 py-3 text-xs sm:text-sm whitespace-nowrap">
                        <span className="bg-[#e0edf7] text-[#094b72] font-semibold px-3 py-1 rounded-full text-xs inline-block">
                          <data value={batch.finalClassification ?? ""}>
                            {formatClassification(batch.finalClassification)}
                          </data>
                        </span>
                      </td>
                      <td className="px-2.5 py-3 text-xs whitespace-nowrap">
                        <div className="inline-flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReport(batch)}
                            aria-label={t("evaluated.action.generateReportAria", { code: batch.code })}
                            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-[#d5e3ee] bg-[#f4f8fb] text-xs font-semibold leading-none text-[#0b4f7a] hover:bg-[#e6eff6] whitespace-nowrap cursor-pointer m-0"
                          >
                            {t("evaluated.action.generateReport")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandingBatch(batch)}
                            aria-label={t("evaluated.action.expandSampleAria", { code: batch.code })}
                            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-[#d5e3ee] bg-[#f4f8fb] text-xs font-semibold leading-none text-[#094b72] hover:bg-[#e6eff6] whitespace-nowrap cursor-pointer m-0"
                          >
                            {t("evaluated.action.expandSample")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
