import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { localizeErrorMessage } from "../i18n/translations";
import type { LoginRequestDTO, LoginResponseDTO } from "../types/auth";
import { login } from "../services/authService";
import {
  saveSession,
  removeLocalToken as clearStoredSession,
} from "../services/authStorage";
import { validateLoginForm, LoginFormErrors } from "../validation/authValidation";

/**
 * Login page implementing DC-HU2, DS-HU2-login, DS-HU2-logout, and test cases PL-2.01 to PL-2.24.
 * Split-screen 50/50 layout matching Mockup HU-02.
 */
export default function LoginPage() {
  const { locale, setLocale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DC-HU2 explicit method: removeLocalToken(): void
  const removeLocalToken = (): void => {
    clearStoredSession();
  };

  useEffect(() => {
    removeLocalToken();
  }, []);

  // DC-HU2 explicit method: showLoginResult(response: LoginResponseDTO): void
  const showLoginResult = (response: LoginResponseDTO): void => {
    saveSession(response);

    // PL-2.13 & PL-2.14: replace browser history to prevent navigation back to login
    if (response.roleCode === "ADMINISTRADOR") {
      window.location.replace("#/admin");
    } else {
      window.location.replace("#/register");
    }
  };

  // DC-HU2 explicit method: submitLogin(request: LoginRequestDTO): Promise<void>
  const submitLogin = async (request: LoginRequestDTO): Promise<void> => {
    setApiError(null);

    // Client-side validations (PL-2.01 to PL-2.08)
    const validationErrors = validateLoginForm(request);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    // PL-2.20: block submit button to prevent double authentication
    setIsSubmitting(true);

    try {
      // PL-2.10: normalize email before sending
      const normalizedRequest: LoginRequestDTO = {
        email: request.email.trim().toLowerCase(),
        password: request.password,
      };

      const response = await login(normalizedRequest);
      showLoginResult(response);
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError(t("auth.login.invalidCredentialsFallback"));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double trigger (PL-2.20)
    submitLogin({ email, password });
  };

  return (
    <main id="main-content" className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Panel Izquierdo Azul (Mockup HU-02) */}
      <aside
        aria-label={t("auth.systemInfoAria")}
        className="w-full md:w-1/2 bg-[#094b72] text-white p-8 sm:p-12 md:p-16 flex flex-col justify-center min-h-[360px] md:min-h-screen flex-shrink-0"
      >
        <header className="max-w-md mx-auto md:mx-0 w-full flex flex-col gap-4">
          <p className="font-serif text-xl sm:text-2xl text-white/90 m-0">
            {t("auth.brandName")}
          </p>
          <h1 id="hero-title" className="font-serif font-bold text-4xl sm:text-5xl text-white leading-tight m-0">
            {t("auth.login.heroTitle")}
          </h1>
          <p className="text-white/85 text-base sm:text-lg m-0 mt-2">
            {t("auth.login.heroSubtitle")}
          </p>
        </header>
        <footer className="max-w-md mx-auto md:mx-0 w-full pt-4">
          <span className="inline-block bg-[#073856] text-white/95 text-xs font-semibold px-4 py-2 rounded-full border border-white/10 shadow-sm">
            {t("auth.badgeNtc")}
          </span>
        </footer>
      </aside>

      {/* Panel Derecho Blanco (Formulario de Inicio de Sesión) */}
      <section
        aria-labelledby="form-title"
        className="w-full md:w-1/2 bg-white p-6 sm:p-10 md:p-16 flex flex-col justify-center items-center min-h-screen"
      >
        <div className="w-full max-w-[420px]">
          <header className="mb-8 flex items-center justify-between gap-3">
            <h2 id="form-title" className="text-3xl sm:text-4xl font-serif font-bold text-[#0d3b66] m-0">
              {t("auth.login.formTitle")}
            </h2>
            <div
              role="group"
              aria-label={t("app.languageLabel")}
              className="inline-flex rounded-lg border border-[#8fb0c9] bg-[#f4f8fb] p-0.5 shrink-0"
            >
              <button
                type="button"
                onClick={() => setLocale("es")}
                aria-pressed={locale === "es"}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  locale === "es" ? "bg-[#094b72] text-white" : "text-[#0d3b66]"
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                aria-pressed={locale === "en"}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  locale === "en" ? "bg-[#094b72] text-white" : "text-[#0d3b66]"
                }`}
              >
                EN
              </button>
            </div>
          </header>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 w-full">
            <fieldset
              className="p-0 m-0 border-0 flex flex-col gap-5"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <legend className="sr-only">{t("auth.login.legend")}</legend>

              {/* Campo Correo electrónico */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-[#0d3b66]"
                >
                  {t("auth.login.emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder={t("auth.login.emailPlaceholder")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`w-full h-12 px-4 rounded-xl border bg-white transition-colors outline-none focus:ring-2 focus:ring-[#094b72] text-[#0d3b66] text-sm ${
                    errors.email ? "border-red-500" : "border-[#8fb0c9]"
                  }`}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-red-600 text-xs font-semibold mt-1 mb-0">
                    {localizeErrorMessage(errors.email, locale)}
                  </p>
                )}
              </div>

              {/* Campo Contraseña */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-[#0d3b66]"
                >
                  {t("auth.login.passwordLabel")}
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`w-full h-12 px-4 rounded-xl border bg-white transition-colors outline-none focus:ring-2 focus:ring-[#094b72] text-[#0d3b66] text-sm ${
                    errors.password ? "border-red-500" : "border-[#8fb0c9]"
                  }`}
                />
                {errors.password && (
                  <p id="password-error" role="alert" className="text-red-600 text-xs font-semibold mt-1 mb-0">
                    {localizeErrorMessage(errors.password, locale)}
                  </p>
                )}
              </div>
            </fieldset>

            {/* Error de API / Credenciales inválidas */}
            {apiError && (
              <aside
                id="login-error-banner"
                role="alert"
                aria-live="assertive"
                className="text-red-600 text-xs font-semibold"
              >
                {localizeErrorMessage(apiError, locale)}
              </aside>
            )}

            {/* Botón Ingresar */}
            <button
              id="login-submit-button"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#094b72] hover:bg-[#073a5a] text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 text-base cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span>{t("auth.login.submitting")}</span>
                </>
              ) : (
                t("auth.login.submit")
              )}
            </button>

            {/* Enlace inferior y nota al pie agrupados en footer */}
            <footer className="flex flex-col gap-4 mt-2">
              <div className="text-center text-sm text-[#5b738b]">
                {t("auth.login.noAccount")}{" "}
                <a
                  href="#/registro"
                  id="login-to-register-link"
                  className="text-[#094b72] font-semibold underline underline-offset-4 hover:text-[#073a5a]"
                >
                  {t("auth.login.registerLink")}
                </a>
              </div>

              <p className="text-xs text-[#4d6a80] text-center m-0 leading-relaxed">
                {t("auth.login.roleNotice")}
              </p>
            </footer>
          </form>
        </div>
      </section>
    </main>
  );
}
