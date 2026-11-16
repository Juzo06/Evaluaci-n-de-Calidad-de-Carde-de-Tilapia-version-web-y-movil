import { useState } from "react";
import type { SyntheticEvent } from "react";
import { useI18n } from "../i18n/I18nContext";
import {
  formatBatchStatus,
  formatSampleUnitsSummary,
  localizeErrorMessage,
} from "../i18n/translations";
import { ApiError } from "../services/apiClient";
import { expandSample } from "../services/batchService";
import type { BatchResponseDTO, ExpandFormErrors } from "../types/batch";
import { validateExpandForm } from "../validation/batchValidation";

interface ExpandSampleFormProps {
  batch: BatchResponseDTO;
  onCancel: () => void;
  onExpanded?: (updatedBatch: BatchResponseDTO) => void;
}

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
 * HU-13: Form component to expand the sample unit count of an evaluated or reported batch (DS-HU13, Mockup HU-13).
 */
export default function ExpandSampleForm({ batch, onCancel, onExpanded }: ExpandSampleFormProps) {
  const { locale, t } = useI18n();
  const [additionalUnits, setAdditionalUnits] = useState<string>("");
  const [errors, setErrors] = useState<ExpandFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const maxAdditionalAllowed = Math.max(0, 500 - batch.sampleUnitCount);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validateExpandForm({ additionalUnits }, batch.sampleUnitCount);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedBatch = await expandSample(batch.code, {
        additionalUnits: Number(additionalUnits.trim()),
      });
      onExpanded?.(updatedBatch);
      window.location.hash = `#/evaluate?code=${encodeURIComponent(batch.code)}`;
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldError = error.fieldErrors.find((fe) => fe.field === "additionalUnits");
        if (fieldError) {
          setErrors({ additionalUnits: fieldError.message });
        }
        setFormError(error.message);
      } else {
        setFormError(t("expand.unexpectedError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="expand-sample-title"
      className="card w-full min-w-0 max-w-5xl p-4 sm:p-6 lg:p-8 rounded-2xl bg-white border border-[#8fb0c9] shadow-sm flex flex-col gap-5"
    >
      <header className="flex flex-col gap-1">
        <h2 id="expand-sample-title" className="text-xl sm:text-2xl font-serif text-[#0b3a5a] m-0">
          {t("expand.title")}
        </h2>
        <p className="text-sm text-[#4d6a80] m-0">
          {t("expand.subtitle")}
        </p>
      </header>

      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#f4f8fb] border border-[#d5e3ee] m-0">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#4d6a80]">{t("expand.col.code")}</dt>
          <dd className="m-0 mt-1 text-sm font-bold text-[#0b3a5a]">{batch.code}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#4d6a80]">{t("expand.col.currentStatus")}</dt>
          <dd className="m-0 mt-1">
            <span className="tag text-[#094b72]">{formatBatchStatus(batch.statusCode, locale)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#4d6a80]">{t("expand.col.currentSample")}</dt>
          <dd className="m-0 mt-1 text-sm font-semibold text-[#0b3a5a]">
            {formatSampleUnitsSummary(batch.sampleUnitCount, batch.evaluationCount, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#4d6a80]">{t("expand.col.currentClassification")}</dt>
          <dd className="m-0 mt-1 text-sm font-bold text-[#094b72]">
            {formatClassification(batch.finalClassification)}
          </dd>
        </div>
      </dl>

      {formError && (
        <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm" style={errorStyle}>
          {localizeErrorMessage(formError, locale, "expand.unexpectedError")}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div>
            <p className="text-sm font-medium text-[#0b3a5a] m-0 mb-1.5">{t("expand.selectedBatch")}</p>
            <div className="h-12 px-3.5 rounded-xl border border-[#d5e3ee] bg-[#f8fbfd] flex items-center text-sm text-[#0b3a5a] font-medium">
              {batch.code} · {t("expand.sampleCompleted")} ({batch.evaluationCount}/{batch.sampleUnitCount})
            </div>
            <small className="block mt-1">{t("expand.enabledHint")}</small>
          </div>

          <label htmlFor="additionalUnits" className="flex flex-col gap-1.5 text-sm font-medium text-[#0b3a5a]">
            {t("expand.additionalUnitsLabel")}
            <input
              id="additionalUnits"
              name="additionalUnits"
              type="number"
              min={1}
              max={maxAdditionalAllowed > 0 ? Math.min(499, maxAdditionalAllowed) : 499}
              step={1}
              placeholder={t("expand.additionalUnitsPlaceholder")}
              value={additionalUnits}
              onChange={(event) => {
                setAdditionalUnits(event.target.value);
                if (errors.additionalUnits) {
                  setErrors({});
                }
              }}
              aria-invalid={Boolean(errors.additionalUnits)}
              aria-describedby={errors.additionalUnits ? "additionalUnitsError" : "additionalUnitsHint"}
              disabled={isSubmitting || maxAdditionalAllowed <= 0}
              required
            />
            <small id="additionalUnitsHint">
              {t("expand.additionalUnitsHint", { max: maxAdditionalAllowed })}
            </small>
            {errors.additionalUnits && (
              <small id="additionalUnitsError" role="alert" aria-live="polite" style={errorStyle}>
                {localizeErrorMessage(errors.additionalUnits, locale)}
              </small>
            )}
          </label>
        </div>

        <p className="text-xs text-[#4d6a80] m-0 leading-relaxed">
          {t("expand.infoNote")}
        </p>

        <div className="row flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            className="o cursor-pointer"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("expand.cancel")}
          </button>
          <button
            type="submit"
            id="confirm-expand-sample-button"
            className="p cursor-pointer disabled:opacity-50"
            disabled={isSubmitting || maxAdditionalAllowed <= 0}
          >
            {isSubmitting ? t("expand.submitting") : t("expand.submit")}
          </button>
        </div>
      </form>
    </section>
  );
}
