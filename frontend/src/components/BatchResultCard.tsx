import { useI18n } from "../i18n/I18nContext";
import { formatBatchStatus } from "../i18n/translations";
import type { BatchResponseDTO } from "../types/batch";

interface BatchResultCardProps {
  batch: BatchResponseDTO;
  onRegisterAnother: () => void;
}

function formatWeight(weightKg: number): string {
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(weightKg);
}

export default function BatchResultCard({ batch, onRegisterAnother }: BatchResultCardProps) {
  const { locale, t } = useI18n();

  return (
    <article className="card w-full max-w-3xl p-4 sm:p-6 lg:p-8 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm" aria-live="polite">
      <header>
        <h2 className="text-xl sm:text-2xl font-serif">{t("batchCard.title")}</h2>
      </header>
      <dl className="grid grid-cols-1 sm:grid-cols-[max-content_minmax(0,1fr)] gap-2 sm:gap-x-4 sm:gap-y-2 m-0 text-sm">
        <dt style={{ color: "#4d6a80" }}>{t("batchCard.code")}</dt>
        <dd style={{ margin: 0 }}><strong>{batch.code}</strong></dd>
        <dt style={{ color: "#4d6a80" }}>{t("batchCard.captureDate")}</dt>
        <dd style={{ margin: 0 }}>{batch.captureDate}</dd>
        <dt style={{ color: "#4d6a80" }}>{t("batchCard.weight")}</dt>
        <dd style={{ margin: 0 }}>{formatWeight(batch.weightKg)} kg</dd>
        <dt style={{ color: "#4d6a80" }}>{t("batchCard.units")}</dt>
        <dd style={{ margin: 0 }}>{batch.sampleUnitCount}</dd>
        {batch.notes && (
          <>
            <dt style={{ color: "#4d6a80" }}>{t("batchCard.notes")}</dt>
            <dd style={{ margin: 0 }} className="min-w-0 break-words [overflow-wrap:anywhere]">{batch.notes}</dd>
          </>
        )}
        <dt style={{ color: "#4d6a80" }}>{t("batchCard.status")}</dt>
        <dd style={{ margin: 0 }}>{formatBatchStatus(batch.statusCode, locale)}</dd>
      </dl>
      <footer className="row flex flex-col sm:flex-row justify-end mt-4">
        <button className="p w-full sm:w-auto" type="button" onClick={onRegisterAnother}>
          {t("batchCard.registerAnother")}
        </button>
      </footer>
    </article>
  );
}
