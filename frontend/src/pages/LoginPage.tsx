import { useEffect, useState } from "react";
import type { LoginRequestDTO, LoginResponseDTO } from "../types/auth";
import { login } from "../services/authService";
import {
  saveSession,
  removeLocalToken as clearStoredSession,
} from "../services/authStorage";
import { validateLoginForm, LoginFormErrors } from "../validation/authValidation";

/**
 * Login page implementing DC-HU2, DS-HU2-login, DS-HU2-logout, and test cases PL-2.01 to PL-2.24.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      // PL-2.10: normalize email before sending (handled by authValidation or backend)
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
        setApiError("credenciales inválidas");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double trigger (PL-2.20)
    submitLogin({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Decorative background fish scale circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-sky-600 blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-sky-500/20 rounded-2xl shadow-2xl shadow-cyan-950/50 p-6 sm:p-8">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-400 shadow-lg shadow-cyan-500/30 mb-4 transform hover:scale-105 transition-transform duration-300">
            <svg
              className="w-9 h-9 text-slate-950"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11m0 0c0 2.473.345 4.866.99 7.132M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sistema SECCT
          </h1>
          <p className="mt-2 text-sm text-sky-200/70">
            Evaluación de Calidad de Carne de Tilapia Roja
          </p>
          <div className="mt-2 inline-block px-3 py-1 bg-sky-950/60 border border-sky-400/20 rounded-full text-xs text-sky-300 font-medium">
            Inicio de Sesión
          </div>
        </div>

        {/* Global API error notification */}
        {apiError && (
          <div
            id="login-error-alert"
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-sm flex items-start space-x-3 animate-shake"
          >
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email input field */}
          <div>
            <label
              htmlFor="login-email-input"
              className="block text-sm font-medium text-sky-100 mb-1.5"
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                id="login-email-input"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                disabled={isSubmitting}
                placeholder="usuario@unillanos.edu.co"
                className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.email
                    ? "border-red-500/80 focus:ring-red-400/50 bg-red-950/20"
                    : "border-sky-500/30 focus:border-cyan-400 focus:ring-cyan-400/40"
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
            </div>
            {errors.email && (
              <p
                id="login-email-error"
                className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1"
              >
                <span>⚠</span> {errors.email}
              </p>
            )}
          </div>

          {/* Password input field */}
          <div>
            <label
              htmlFor="login-password-input"
              className="block text-sm font-medium text-sky-100 mb-1.5"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="login-password-input"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                disabled={isSubmitting}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.password
                    ? "border-red-500/80 focus:ring-red-400/50 bg-red-950/20"
                    : "border-sky-500/30 focus:border-cyan-400 focus:ring-cyan-400/40"
                }`}
              />
              <button
                type="button"
                id="toggle-password-visibility-button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-cyan-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="login-password-error"
                className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1"
              >
                <span>⚠</span> {errors.password}
              </p>
            )}
          </div>

          {/* Submit button (blocked during submission: PL-2.20) */}
          <button
            type="submit"
            id="login-submit-button"
            disabled={isSubmitting}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-slate-950 transition-all duration-300 shadow-lg ${
              isSubmitting
                ? "bg-cyan-500/50 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-cyan-500/25 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            } flex items-center justify-center space-x-2`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-slate-950"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        {/* Links footer */}
        <div className="mt-8 pt-6 border-t border-sky-500/20 text-center text-sm text-sky-200/70">
          ¿No tienes una cuenta aún?{" "}
          <a
            href="#/registro"
            id="login-to-register-link"
            className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 transition-colors"
          >
            Regístrate aquí
          </a>
        </div>
      </div>
    </div>
  );
}
