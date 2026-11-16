import { useEffect, useState } from "react";
import BatchSelector from "../components/BatchSelector";
import UnitImageForm from "../components/UnitImageForm";
import UnitResultsCard from "../components/UnitResultsCard";
import { useI18n } from "../i18n/I18nContext";
import { localizeErrorMessage } from "../i18n/translations";
import { ApiError } from "../services/apiClient";
import { getBatchByCode, listAvailableBatches } from "../services/batchService";
import { closeEvaluation as requestCloseEvaluation, evaluateUnit } from "../services/evaluationService";
import SideNav from "../components/SideNav";
import { getUserFullName } from "../services/authStorage";
import type { BatchResponseDTO } from "../types/batch";
import type { EvaluatedUnitRow } from "../types/evaluation";

const errorStyle = { color: "#b42318", fontWeight: 600 };

function toMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function getBatchCodeFromHash(): string | null {
  const queryIndex = window.location.hash.indexOf("?");
  if (queryIndex === -1) {
    return null;
  }
  const params = new URLSearchParams(window.location.hash.slice(queryIndex + 1));
  const code = params.get("code")?.trim();
  return code && code.length > 0 ? code : null;
}

export default function EvaluateBatchPage() {
  const { locale, t } = useI18n();
  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchResponseDTO | null>(null);
  const [rows, setRows] = useState<EvaluatedUnitRow[]>([]);
  const [closedBatch, setClosedBatch] = useState<BatchResponseDTO | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    void loadAvailableBatches();
    const initialCode = getBatchCodeFromHash();
    if (initialCode) {
      void selectBatch(initialCode);
    }

    const handleHashChange = () => {
      const code = getBatchCodeFromHash();
      if (code) {
        void selectBatch(code);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  async function loadAvailableBatches(): Promise<void> {
    setIsLoadingBatches(true);
    try {
      setBatches(await listAvailableBatches());
    } catch (error) {
      setPageError(toMessage(error, t("app.unexpectedError")));
    } finally {
      setIsLoadingBatches(false);
    }
  }

  async function selectBatch(code: string): Promise<void> {
    setPageError(null);
    setRows([]);
    setClosedBatch(null);
    if (!code) {
      setSelectedBatch(null);
      return;
    }
    try {
      setSelectedBatch(await getBatchByCode(code));
    } catch (error) {
      setSelectedBatch(null);
      setPageError(toMessage(error, t("app.unexpectedError")));
    }
  }

  /** Returns true when the unit was classified, so the form can clear the chosen image. */
  async function submitUnitEvaluation(code: string, image: File): Promise<boolean> {
    setPageError(null);
    setIsUploading(true);
    try {
      const evaluation = await evaluateUnit(code, image);
      const refreshedBatch = await getBatchByCode(code);
      setSelectedBatch(refreshedBatch);
      setBatches((current) => current.map((batch) => (batch.code === code ? refreshedBatch : batch)));
      setRows((current) => [...current, { unitNumber: refreshedBatch.evaluationCount, evaluation }]);
      return true;
    } catch (error) {
      setPageError(toMessage(error, t("app.unexpectedError")));
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function closeEvaluation(code: string): Promise<void> {
    setPageError(null);
    setIsClosing(true);
    try {
      const batch = await requestCloseEvaluation(code);
      setSelectedBatch(batch);
      setClosedBatch(batch);
      await loadAvailableBatches();
    } catch (error) {
      setPageError(toMessage(error, t("app.unexpectedError")));
    } finally {
      setIsClosing(false);
    }
  }

  const totalUnits = selectedBatch ? selectedBatch.sampleUnitCount : null;
  const classifiedCount = selectedBatch ? selectedBatch.evaluationCount : 0;
  const isEvaluated = closedBatch !== null;
  const allClassified = selectedBatch !== null && classifiedCount >= selectedBatch.sampleUnitCount;
  const canUpload = selectedBatch !== null && !allClassified && !isEvaluated;
  const canClose = selectedBatch !== null && allClassified && !isEvaluated;

  const userFullName = getUserFullName();

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col md:flex-row bg-[#f4f8fb]">
      <SideNav current="evaluate" />
      <main id="main-content" className="flex-1 min-w-0 w-full max-w-full p-4 sm:p-6 lg:p-10 flex flex-col gap-5">
        <header className="top flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <hgroup>
            <h1 id="evaluate-batch-title" className="text-2xl sm:text-3xl lg:text-[36px] font-serif leading-tight">
              {t("eval.title")}
            </h1>
            <p style={{ margin: "4px 0 0" }}>{t("eval.subtitle")}</p>
          </hgroup>
          <span aria-label={t("app.authenticatedUser")} className="self-start sm:self-auto shrink-0 max-w-full truncate bg-[#e6eff6] text-[#094b72] px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
            {userFullName}
          </span>
        </header>
        {pageError && (
          <aside role="alert" aria-live="assertive">
            <small style={errorStyle}>{localizeErrorMessage(pageError, locale, "app.unexpectedError")}</small>
          </aside>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0 items-start">
          <section
            aria-labelledby="batch-selection-title"
            className="card min-w-0 w-full p-4 sm:p-6 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-5"
          >
            <header className="sr-only">
              <h2 id="batch-selection-title">{t("eval.sectionAria")}</h2>
            </header>
            <BatchSelector
              batches={batches}
              selectedCode={selectedBatch && !isEvaluated ? selectedBatch.code : ""}
              isLoading={isLoadingBatches}
              disabled={isUploading || isClosing}
              onSelect={(code) => void selectBatch(code)}
            />
            <UnitImageForm
              classifiedCount={classifiedCount}
              totalUnits={totalUnits}
              disabled={!canUpload}
              isUploading={isUploading}
              onSubmit={(image) => (selectedBatch ? submitUnitEvaluation(selectedBatch.code, image) : Promise.resolve(false))}
            />
          </section>
          <section aria-labelledby="unit-results-title" className="min-w-0 w-full flex">
            <UnitResultsCard
              rows={rows}
              canClose={canClose}
              isClosing={isClosing}
              closedBatch={closedBatch}
              onClose={() => selectedBatch && void closeEvaluation(selectedBatch.code)}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
