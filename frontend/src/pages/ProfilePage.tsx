import { useState } from "react";
import type { SyntheticEvent } from "react";
import SideNav from "../components/SideNav";
import { useI18n } from "../i18n/I18nContext";
import { formatRoleName, localizeErrorMessage } from "../i18n/translations";
import { ApiError } from "../services/apiClient";
import { deleteAccount } from "../services/authService";
import {
  getRoleCode,
  getUserEmail,
  getUserFullName,
  removeLocalToken,
} from "../services/authStorage";
import type { DeleteAccountFormErrors } from "../types/auth";
import { validateDeleteAccountForm } from "../validation/authValidation";

const errorStyle = { color: "#b42318", fontWeight: 600 };

/**
 * HU-08: Authenticated user profile and logical cascade account deletion page (DS-HU8, Mockup HU-08).
 */
export default function ProfilePage() {
  const { locale, t } = useI18n();
  const fullName = getUserFullName();
  const email = getUserEmail();
  const roleCode = getRoleCode();

  const [password, setPassword] = useState<string>("");
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [errors, setErrors] = useState<DeleteAccountFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  function handleReset(): void {
    setPassword("");
    setConfirmed(false);
    setErrors({});
    setFormError(null);
  }

  /** Implements handleDeleteAccount(event) from DS-HU8 sequence diagram. */
  async function handleDeleteAccount(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validateDeleteAccountForm({ password, confirmed });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteAccount({ password });
      removeLocalToken();
      window.location.replace("#/login");
    } catch (error) {
      if (error instanceof ApiError) {
        const passwordFieldError = error.fieldErrors.find((fe) => fe.field === "password");
        if (passwordFieldError) {
          setErrors((current) => ({ ...current, password: passwordFieldError.message }));
        }
        setFormError(error.message);
      } else {
        setFormError(t("profile.deleteUnexpectedError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col md:flex-row bg-[#f4f8fb]">
      <SideNav current="cuenta" />
      <main id="main-content" className="flex-1 min-w-0 w-full max-w-full p-4 sm:p-6 lg:p-10 flex flex-col gap-5">
        <header className="top flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <hgroup>
            <h1 id="profile-page-title" className="text-2xl sm:text-3xl lg:text-[36px] font-serif leading-tight">
              {t("profile.title")}
            </h1>
            <p style={{ margin: "4px 0 0" }}>
              {t("profile.subtitle")}
            </p>
          </hgroup>
          <span
            aria-label={t("app.authenticatedUser")}
            className="self-start sm:self-auto shrink-0 max-w-full truncate bg-[#e6eff6] text-[#094b72] px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm"
          >
            {fullName}
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl items-start">
          <section
            aria-labelledby="account-holder-title"
            className="card p-6 sm:p-8 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-4"
          >
            <header>
              <h2 id="account-holder-title" className="text-xl sm:text-2xl font-serif text-[#094b72] m-0">
                {t("profile.holderTitle")}
              </h2>
            </header>

            <dl className="flex flex-col gap-4 m-0">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d6a80]">
                  {t("profile.field.fullName")}
                </dt>
                <dd className="m-0 mt-1 text-base font-semibold text-[#0b3a5a]">{fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d6a80]">
                  {t("profile.field.email")}
                </dt>
                <dd className="m-0 mt-1 text-base font-semibold text-[#0b3a5a]">
                  {email ?? t("profile.noEmail")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d6a80]">
                  {t("profile.field.role")}
                </dt>
                <dd className="m-0 mt-1">
                  <span className="tag text-[#094b72]">{formatRoleName(roleCode ?? "PISCICULTOR", locale)}</span>
                </dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby="delete-account-title"
            className="card p-6 sm:p-8 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-4"
          >
            <header>
              <h2 id="delete-account-title" className="text-xl sm:text-2xl font-serif text-[#9b2c1a] m-0">
                {t("profile.deleteTitle")}
              </h2>
            </header>

            <p className="text-sm text-[#0b3a5a] m-0 leading-relaxed">
              {t("profile.deleteDesc")}
            </p>

            {formError && (
              <div
                role="alert"
                aria-live="assertive"
                id="delete-account-server-error"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm"
                style={errorStyle}
              >
                {localizeErrorMessage(formError, locale, "profile.deleteUnexpectedError")}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} noValidate className="flex flex-col gap-4">
              <label htmlFor="deleteAccountPassword" className="flex flex-col gap-1.5 text-sm font-medium text-[#0b3a5a]">
                {t("profile.passwordLabel")}
                <input
                  id="deleteAccountPassword"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("profile.passwordPlaceholder")}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errors.password) {
                      setErrors((current) => ({ ...current, password: undefined }));
                    }
                  }}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "deleteAccountPasswordError" : "deleteAccountPasswordHint"}
                  disabled={isSubmitting}
                  required
                />
                <small id="deleteAccountPasswordHint">
                  {t("profile.passwordHint")}
                </small>
                {errors.password && (
                  <small id="deleteAccountPasswordError" role="alert" aria-live="polite" style={errorStyle}>
                    {localizeErrorMessage(errors.password, locale)}
                  </small>
                )}
              </label>

              <div className="flex flex-col gap-1">
                <div className="flex items-start gap-2.5">
                  <input
                    id="confirmDeleteAccount"
                    name="confirmed"
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => {
                      setConfirmed(event.target.checked);
                      if (errors.confirmed) {
                        setErrors((current) => ({ ...current, confirmed: undefined }));
                      }
                    }}
                    aria-invalid={Boolean(errors.confirmed)}
                    aria-describedby={errors.confirmed ? "confirmDeleteAccountError" : undefined}
                    disabled={isSubmitting}
                    className="!h-4 !w-4 mt-0.5 shrink-0 accent-[#9b2c1a]"
                  />
                  <label
                    htmlFor="confirmDeleteAccount"
                    className="!flex-row !items-center text-xs sm:text-sm text-[#0b3a5a] cursor-pointer"
                  >
                    {t("profile.confirmCheck")}
                  </label>
                </div>
                {errors.confirmed && (
                  <small id="confirmDeleteAccountError" role="alert" aria-live="polite" style={errorStyle}>
                    {localizeErrorMessage(errors.confirmed, locale)}
                  </small>
                )}
              </div>

              <p className="text-xs text-[#9b2c1a] font-medium m-0">
                {t("profile.irreversibleWarning")}
              </p>

              <div className="row flex flex-col sm:flex-row justify-end gap-3 pt-1">
                <button
                  type="button"
                  className="o cursor-pointer"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  {t("profile.cancel")}
                </button>
                <button
                  type="submit"
                  id="delete-account-submit-button"
                  className="h-[52px] px-6 rounded-xl border-0 bg-[#9b2c1a] text-white font-semibold text-base hover:bg-[#7d2214] transition-colors cursor-pointer disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("profile.submittingDelete") : t("profile.submitDelete")}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
