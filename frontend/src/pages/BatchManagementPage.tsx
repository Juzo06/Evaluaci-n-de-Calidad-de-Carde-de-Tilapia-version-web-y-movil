import { useEffect, useState } from "react";
import SideNav from "../components/SideNav";
import { useI18n } from "../i18n/I18nContext";
import { formatBatchStatus, localizeErrorMessage } from "../i18n/translations";
import { ApiError } from "../services/apiClient";
import { getUserFullName } from "../services/authStorage";
import {
  consultEvaluatedBatches,
  listAvailableBatches,
  requestDeleteBatch,
} from "../services/batchService";
import type { BatchResponseDTO } from "../types/batch";

const errorStyle = { color: "#b42318", fontWeight: 600 };

function formatClassification(value: number | null): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * HU-09: Batch management page allowing logical deletion of any own active batch (DS-HU9, Mockup HU-09).
 */
export default function BatchManagementPage() {
  const { locale, t } = useI18n();
  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletedBatchCode, setDeletedBatchCode] = useState<string | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<BatchResponseDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const userFullName = getUserFullName();

  /** Implements loadBatches from DS-HU9 sequence diagram. */
  async function loadBatches(): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [available, evaluated] = await Promise.all([
        listAvailableBatches(),
        consultEvaluatedBatches(),
      ]);
      const combinedMap = new Map<string, BatchResponseDTO>();
      for (const batch of [...available, ...evaluated]) {
        combinedMap.set(batch.code, batch);
      }
      const sorted = Array.from(combinedMap.values()).sort((a, b) => b.id - a.id);
      setBatches(sorted);
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("manage.loadError");
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }

  /** Implements deleteBatch(code) from DS-HU9 sequence diagram. */
  async function deleteBatch(code: string): Promise<void> {
    setIsDeleting(true);
    setErrorMessage(null);
    setDeletedBatchCode(null);
    try {
      await requestDeleteBatch(code);
      setBatchToDelete(null);
      setDeletedBatchCode(code);
      await loadBatches();
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("manage.deleteError");
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    void loadBatches();
  }, []);

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col md:flex-row bg-[#f4f8fb]">
      <SideNav current="gestion" />
      <main id="main-content" className="flex-1 min-w-0 w-full max-w-full p-4 sm:p-6 lg:p-10 flex flex-col gap-5">
        <header className="top flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <hgroup>
            <h1 id="batch-management-title" className="text-2xl sm:text-3xl lg:text-[36px] font-serif leading-tight">
              {t("manage.title")}
            </h1>
            <p style={{ margin: "4px 0 0" }}>
              {t("manage.subtitle")}
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

        {deletedBatchCode && (
          <div role="status" aria-live="polite" className="rounded-xl border border-[#8fb0c9] bg-[#e6eff6] px-4 py-3 text-sm text-[#094b72] font-semibold">
            {t("batchManagement.successDelete", { code: deletedBatchCode })}
          </div>
        )}

        <section
          aria-labelledby="batch-management-title"
          aria-live="polite"
          className="card w-full min-w-0 max-w-5xl p-4 sm:p-6 lg:p-8 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm"
        >
          {isLoading ? (
            <div className="py-12 text-center text-[#4d6a80] font-medium" role="status">
              {t("manage.loading")}
            </div>
          ) : batches.length === 0 ? (
            <section role="status" aria-live="polite" className="py-14 text-center flex flex-col items-center gap-2">
              <p className="text-base font-semibold text-[#0b3a5a] m-0">{t("manage.emptyTitle")}</p>
              <p className="text-xs text-[#4d6a80] m-0">
                {t("manage.emptySubtitle")}
              </p>
            </section>
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left" id="batch-management-table">
                <caption className="sr-only">
                  {t("manage.tableCaption")}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-3 text-xs whitespace-nowrap">{t("manage.col.code")}</th>
                    <th scope="col" className="px-3 py-3 text-xs whitespace-nowrap">{t("manage.col.captureDate")}</th>
                    <th scope="col" className="px-3 py-3 text-xs whitespace-nowrap">{t("manage.col.weight")}</th>
                    <th scope="col" className="px-3 py-3 text-xs whitespace-nowrap text-center">{t("manage.col.units")}</th>
                    <th scope="col" className="px-3 py-3 text-xs whitespace-nowrap">{t("manage.col.status")}</th>
                    <th scope="col" className="px-3 py-3 text-xs whitespace-nowrap">{t("manage.col.classification")}</th>
                    <th scope="col" className="px-3 py-3 text-xs whitespace-nowrap text-right">{t("manage.col.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => {
                    const isSelected = batchToDelete?.code === batch.code;
                    return (
                      <tr
                        key={batch.code}
                        className={isSelected ? "bg-[#f4f8fb]" : "hover:bg-slate-50/80 transition-colors"}
                      >
                        <td className="px-3 py-3 text-xs sm:text-sm font-semibold text-[#0b4f7a] whitespace-nowrap">
                          {batch.code}
                        </td>
                        <td className="px-3 py-3 text-xs sm:text-sm whitespace-nowrap">
                          <time dateTime={batch.captureDate}>{batch.captureDate}</time>
                        </td>
                        <td className="px-3 py-3 text-xs sm:text-sm whitespace-nowrap">{batch.weightKg}</td>
                        <td className="px-3 py-3 text-xs sm:text-sm text-center whitespace-nowrap">
                          {batch.sampleUnitCount}
                        </td>
                        <td className="px-3 py-3 text-xs whitespace-nowrap">
                          <span className="tag text-[#094b72]">{formatBatchStatus(batch.statusCode, locale)}</span>
                        </td>
                        <td className="px-3 py-3 text-xs sm:text-sm whitespace-nowrap font-medium text-[#094b72]">
                          {formatClassification(batch.finalClassification)}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setBatchToDelete(batch);
                              setDeletedBatchCode(null);
                              setErrorMessage(null);
                            }}
                            aria-label={t("manage.deleteAria", { code: batch.code })}
                            className="px-3.5 py-1.5 rounded-lg border border-[#b42318]/40 text-[#b42318] text-xs font-semibold bg-white hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            {t("manage.delete")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {batchToDelete && (
          <section
            role="dialog"
            aria-modal="false"
            aria-labelledby="confirm-delete-batch-title"
            className="card w-full max-w-5xl p-5 sm:p-6 rounded-2xl bg-red-50/60 border border-[#b42318]/40 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex flex-col gap-1">
              <h2 id="confirm-delete-batch-title" className="text-lg sm:text-xl font-serif text-[#8a1c13] m-0">
                {t("manage.confirmTitle", { code: batchToDelete.code })}
              </h2>
              <p className="text-xs sm:text-sm text-[#4d6a80] m-0">
                {t("manage.confirmBody")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                className="o cursor-pointer h-11 px-5 text-sm"
                onClick={() => setBatchToDelete(null)}
                disabled={isDeleting}
              >
                {t("manage.cancel")}
              </button>
              <button
                type="button"
                id="confirm-delete-batch-button"
                className="h-11 px-5 rounded-xl border-0 bg-[#9b2c1a] text-white text-sm font-semibold hover:bg-[#7d2214] transition-colors cursor-pointer disabled:opacity-50"
                onClick={() => void deleteBatch(batchToDelete.code)}
                disabled={isDeleting}
              >
                {isDeleting ? t("manage.deleting") : t("manage.confirmDelete")}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
