import type { ChangeEvent } from "react";
import { useI18n } from "../i18n/I18nContext";
import { formatUnitsCount } from "../i18n/translations";
import type { BatchResponseDTO } from "../types/batch";

interface BatchSelectorProps {
  batches: BatchResponseDTO[];
  selectedCode: string;
  isLoading: boolean;
  disabled: boolean;
  onSelect: (code: string) => void;
}

export default function BatchSelector({ batches, selectedCode, isLoading, disabled, onSelect }: BatchSelectorProps) {
  const { locale, t } = useI18n();
  const hasBatches = batches.length > 0;

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onSelect(event.target.value);
  }

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      <label htmlFor="batchCode" className="text-sm">
        {t("selector.label")}
      </label>
      <select
        id="batchCode"
        name="batchCode"
        value={selectedCode}
        onChange={handleChange}
        disabled={disabled || isLoading || !hasBatches}
        aria-describedby={!isLoading && !hasBatches ? "batchCodeHelp" : undefined}
        className="w-full max-w-full min-w-0"
      >
        {isLoading && <option value="">{t("selector.loading")}</option>}
        {!isLoading && !hasBatches && <option value="">{t("selector.empty")}</option>}
        {!isLoading && hasBatches && <option value="">{t("selector.placeholder")}</option>}
        {batches.map((batch) => (
          <option key={batch.code} value={batch.code}>
            {batch.code} ({batch.evaluationCount}/{formatUnitsCount(batch.sampleUnitCount, locale)})
          </option>
        ))}
      </select>
      {!isLoading && !hasBatches && (
        <small id="batchCodeHelp" role="status">
          {t("selector.emptyHelp")}
        </small>
      )}
    </div>
  );
}
