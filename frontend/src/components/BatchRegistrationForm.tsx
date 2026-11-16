import { useState } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import { useI18n } from "../i18n/I18nContext";
import { localizeErrorMessage } from "../i18n/translations";
import type { BatchFormField, BatchFormValues, RegisterBatchRequestDTO } from "../types/batch";
import { ApiError } from "../services/apiClient";
import { toRegisterBatchRequest, validateBatchForm } from "../validation/batchValidation";
import type { BatchFormErrors } from "../validation/batchValidation";

interface BatchRegistrationFormProps {
  onSubmit: (request: RegisterBatchRequestDTO) => Promise<void>;
}

const emptyValues: BatchFormValues = {
  captureDate: "",
  weightKg: "",
  sampleUnitCount: "",
  notes: "",
};

const errorStyle = { color: "#b42318", fontWeight: 600 };

const knownFields: BatchFormField[] = ["captureDate", "weightKg", "sampleUnitCount", "notes"];

export default function BatchRegistrationForm({ onSubmit }: BatchRegistrationFormProps) {
  const { locale, t } = useI18n();
  const [values, setValues] = useState<BatchFormValues>(emptyValues);
  const [errors, setErrors] = useState<BatchFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const field = event.target.name as BatchFormField;
    setValues((current) => ({ ...current, [field]: event.target.value }));
  }

  function handleCancel() {
    setValues(emptyValues);
    setErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validateBatchForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(toRegisterBatchRequest(values));
    } catch (error) {
      if (error instanceof ApiError) {
        const serverErrors: BatchFormErrors = {};
        for (const fieldError of error.fieldErrors) {
          if (knownFields.includes(fieldError.field as BatchFormField)) {
            serverErrors[fieldError.field as BatchFormField] = fieldError.message;
          }
        }
        setErrors(serverErrors);
        setFormError(error.message);
      } else {
        setFormError(t("app.unexpectedError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderError(field: BatchFormField) {
    const message = errors[field];
    if (!message) {
      return null;
    }
    return (
      <small id={`${field}Error`} role="alert" style={errorStyle}>
        {localizeErrorMessage(message, locale)}
      </small>
    );
  }

  function describedBy(field: BatchFormField): string {
    return errors[field] ? `${field}Error` : `${field}Hint`;
  }

  return (
    <section aria-labelledby="register-batch-title" className="card w-full max-w-3xl p-4 sm:p-6 lg:p-8 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm">
      <form
        className="flex flex-col gap-4 w-full"
        onSubmit={handleSubmit}
        noValidate
      >
        {formError && (
          <aside role="alert" aria-live="assertive">
            <small style={errorStyle}>{localizeErrorMessage(formError, locale, "app.unexpectedError")}</small>
          </aside>
        )}
        <fieldset className="border-0 p-0 m-0 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
          <legend className="sr-only">{t("batchForm.dataLegend")}</legend>
          <label htmlFor="captureDate" className="flex flex-col gap-1.5 text-sm w-full min-w-0">
            {t("batchForm.captureDateLabel")}
            <input
              id="captureDate"
              type="date"
              placeholder={t("batchForm.captureDatePlaceholder")}
              name="captureDate"
              value={values.captureDate}
              onChange={handleChange}
              aria-invalid={Boolean(errors.captureDate)}
              aria-describedby={describedBy("captureDate")}
              className="w-full min-w-0"
            />
            <small id="captureDateHint">{t("batchForm.captureDateHint")}</small>
            {renderError("captureDate")}
          </label>
          <label htmlFor="weightKg" className="flex flex-col gap-1.5 text-sm w-full min-w-0">
            {t("batchForm.weightLabel")}
            <input
              id="weightKg"
              type="text"
              placeholder={t("batchForm.weightPlaceholder")}
              name="weightKg"
              value={values.weightKg}
              onChange={handleChange}
              aria-invalid={Boolean(errors.weightKg)}
              aria-describedby={describedBy("weightKg")}
              className="w-full min-w-0"
            />
            <small id="weightKgHint">{t("batchForm.weightHint")}</small>
            {renderError("weightKg")}
          </label>
          <label htmlFor="sampleUnitCount" className="flex flex-col gap-1.5 text-sm w-full min-w-0">
            {t("batchForm.unitsLabel")}
            <input
              id="sampleUnitCount"
              type="number"
              placeholder=""
              name="sampleUnitCount"
              value={values.sampleUnitCount}
              onChange={handleChange}
              aria-invalid={Boolean(errors.sampleUnitCount)}
              aria-describedby={describedBy("sampleUnitCount")}
              className="w-full min-w-0"
            />
            <small id="sampleUnitCountHint">{t("batchForm.unitsHint")}</small>
            {renderError("sampleUnitCount")}
          </label>
        </fieldset>

        <fieldset className="border-0 p-0 m-0 flex flex-col gap-1.5 w-full">
          <legend className="sr-only">{t("batchForm.notesLegend")}</legend>
          <label htmlFor="notes" className="flex flex-col gap-1.5 text-sm w-full min-w-0">
            {t("batchForm.notesLabel")}
            <textarea
              id="notes"
              placeholder={t("batchForm.notesPlaceholder")}
              name="notes"
              value={values.notes}
              onChange={handleChange}
              aria-invalid={Boolean(errors.notes)}
              aria-describedby={errors.notes ? "notesError" : "notesHint"}
              className="w-full min-w-0"
            />
            {renderError("notes")}
          </label>
        </fieldset>

        <small id="notesHint" className="text-xs text-[#4d6a80]">
          {t("batchForm.codeNote")}
        </small>
        <footer className="row flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 w-full">
          <button className="o w-full sm:w-auto" type="button" onClick={handleCancel}>
            {t("batchForm.cancel")}
          </button>
          <button className="p w-full sm:w-auto" type="submit" disabled={isSubmitting}>
            {t("batchForm.submit")}
          </button>
        </footer>
      </form>
    </section>
  );
}
