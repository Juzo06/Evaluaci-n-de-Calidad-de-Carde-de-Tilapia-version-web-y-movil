import { useI18n } from "../i18n/I18nContext";
import { formatBatchStatus } from "../i18n/translations";
import type { BatchResponseDTO } from "../types/batch";
import type { ClassificationResultDTO, EvaluatedUnitRow } from "../types/evaluation";

interface UnitResultsCardProps {
  rows: EvaluatedUnitRow[];
  canClose: boolean;
  isClosing: boolean;
  closedBatch: BatchResponseDTO | null;
  onClose: () => void;
}

function formatConfidence(confidence: number): string {
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(confidence);
}

function formatClassification(value: number): string {
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function findResult(row: EvaluatedUnitRow, fishPartCode: string): ClassificationResultDTO | undefined {
  return row.evaluation.results.find((result) => result.fishPartCode === fishPartCode);
}

export default function UnitResultsCard({ rows, canClose, isClosing, closedBatch, onClose }: UnitResultsCardProps) {
  const { locale, t } = useI18n();

  function renderCategory(result: ClassificationResultDTO | undefined) {
    return (
      <span className="inline-block bg-[#e0edf7] text-[#094b72] px-3 py-1 rounded-full text-xs font-semibold">
        {result ? t("unitResults.category", { category: result.ntcCategory }) : "-"}
      </span>
    );
  }

  return (
    <article className="card min-w-0 w-full p-4 sm:p-6 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-4 flex-1" aria-labelledby="unit-results-title">
      <header>
        <h2 id="unit-results-title" className="text-xl sm:text-2xl font-serif">{t("unitResults.title")}</h2>
      </header>
      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">{t("unitResults.caption")}</caption>
          <thead>
            <tr>
              <th scope="col" className="px-2.5 py-2 text-xs sm:text-sm whitespace-nowrap">{t("unitResults.col.unit")}</th>
              <th scope="col" className="px-2.5 py-2 text-xs sm:text-sm whitespace-nowrap">{t("unitResults.col.eye")}</th>
              <th scope="col" className="px-2.5 py-2 text-xs sm:text-sm whitespace-nowrap">{t("unitResults.col.skin")}</th>
              <th scope="col" className="px-2.5 py-2 text-xs sm:text-sm whitespace-nowrap">{t("unitResults.col.confidence")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2.5 py-3 text-xs sm:text-sm text-slate-500">{t("unitResults.empty")}</td>
              </tr>
            )}
            {rows.map((row) => {
              const eye = findResult(row, "OJO");
              const skin = findResult(row, "PIEL");
              return (
                <tr key={row.evaluation.id}>
                  <td className="px-2.5 py-2.5 text-xs sm:text-sm">{row.unitNumber}</td>
                  <td className="px-2.5 py-2.5 text-xs sm:text-sm">{renderCategory(eye)}</td>
                  <td className="px-2.5 py-2.5 text-xs sm:text-sm">{renderCategory(skin)}</td>
                  <td className="px-2.5 py-2.5 text-xs sm:text-sm whitespace-nowrap">
                    {t("unitResults.eyeLabel")} {eye ? formatConfidence(eye.confidence) : "-"} · {t("unitResults.skinLabel")} {skin ? formatConfidence(skin.confidence) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-col gap-3 mt-auto pt-2">
        {closedBatch ? (
          <p role="status" className="text-xs text-[#4d6a80] m-0">
            {t("unitResults.closedPrefix", {
              code: closedBatch.code,
              status: formatBatchStatus(closedBatch.statusCode, locale),
            })}{" "}
            <strong>{closedBatch.finalClassification !== null ? formatClassification(closedBatch.finalClassification) : "-"}</strong>
          </p>
        ) : (
          <p className="text-xs text-[#4d6a80] m-0">
            {t("unitResults.closeHint")}
          </p>
        )}
        <div className="row flex flex-col sm:flex-row justify-end">
          <button className="p w-full sm:w-auto" type="button" disabled={!canClose || isClosing} onClick={onClose}>
            {isClosing ? t("unitResults.closing") : t("unitResults.closeButton")}
          </button>
        </div>
      </footer>
    </article>
  );
}
