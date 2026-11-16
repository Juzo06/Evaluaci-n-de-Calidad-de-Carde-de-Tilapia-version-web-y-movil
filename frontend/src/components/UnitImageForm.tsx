import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useI18n } from "../i18n/I18nContext";
import { localizeErrorMessage } from "../i18n/translations";
import { validateImageFile } from "../validation/imageValidation";

interface UnitImageFormProps {
  classifiedCount: number;
  totalUnits: number | null;
  disabled: boolean;
  isUploading: boolean;
  onSubmit: (image: File) => Promise<boolean>;
}

const errorStyle = { color: "#b42318", fontWeight: 600 };

export default function UnitImageForm({ classifiedCount, totalUnits, disabled, isUploading, onSubmit }: UnitImageFormProps) {
  const { locale, t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function chooseFile(candidate: File | undefined) {
    setFile(null);
    setFileError(null);
    if (!candidate) {
      return;
    }
    const error = await validateImageFile(candidate);
    if (error) {
      setFileError(error);
      return;
    }
    setFile(candidate);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void chooseFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      void chooseFile(event.dataTransfer.files[0]);
    }
  }

  function handleDropKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  async function handleUpload() {
    if (!file) {
      return;
    }
    const wasEvaluated = await onSubmit(file);
    if (wasEvaluated) {
      setFile(null);
    }
  }

  return (
    <form className="flex flex-col gap-4 w-full min-w-0" onSubmit={(event) => event.preventDefault()}>
      <figure
        className="drop w-full max-w-full min-w-0"
        style={{ margin: 0, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, borderColor: isDragging ? "#0b4f7a" : undefined }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={t("unitForm.dropAria")}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={handleDropKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <figcaption className="text-sm text-center px-3" style={{ color: "inherit" }}>
          {file ? (
            <strong className="break-all">{file.name}</strong>
          ) : (
            <>
              {t("unitForm.dropPrompt1")}
              <br />
              {t("unitForm.dropPrompt2")}
            </>
          )}
        </figcaption>
        <label htmlFor="unit-image-file" className="sr-only">
          {t("unitForm.fileInputAria")}
        </label>
        <input
          ref={inputRef}
          id="unit-image-file"
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={handleInputChange}
        />
      </figure>
      {fileError && (
        <aside role="alert" aria-live="assertive">
          <small style={errorStyle}>
            {localizeErrorMessage(fileError, locale)}
          </small>
        </aside>
      )}
      {totalUnits !== null && (
        <div className="flex items-center justify-between gap-2 text-xs text-[#4d6a80]">
          <output aria-live="polite">
            {t("unitForm.classifiedUnits", { count: classifiedCount, total: totalUnits })}
          </output>
          <progress
            value={classifiedCount}
            max={totalUnits}
            className="sr-only"
            aria-label={t("unitForm.progressAria")}
          >
            {t("unitForm.progressValue", { count: classifiedCount, total: totalUnits })}
          </progress>
        </div>
      )}
      <button className="o w-full sm:w-auto" type="button" disabled={disabled || !file || isUploading} onClick={handleUpload}>
        {isUploading ? t("unitForm.uploading") : t("unitForm.upload")}
      </button>
    </form>
  );
}
