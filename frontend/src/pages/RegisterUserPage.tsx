import { useState } from "react";
import UserRegistrationForm from "../components/UserRegistrationForm";
import UserRegistrationResultCard from "../components/UserRegistrationResultCard";
import { useI18n } from "../i18n/I18nContext";
import { apiPost } from "../services/apiClient";
import type { RegisterUserRequestDTO, RegisterUserResponseDTO } from "../types/auth";

export default function RegisterUserPage() {
  const [registeredUser, setRegisteredUser] = useState<RegisterUserResponseDTO | null>(null);
  const { locale, setLocale, t } = useI18n();

  /**
   * Implements submitRegistration from DC-HU1 diagram using apiPost.
   */
  async function submitRegistration(request: RegisterUserRequestDTO): Promise<void> {
    const response = await apiPost<RegisterUserRequestDTO, RegisterUserResponseDTO>("/api/users", request);
    showRegistrationResult(response);
  }

  /**
   * Implements showRegistrationResult from DC-HU1 diagram.
   */
  function showRegistrationResult(response: RegisterUserResponseDTO): void {
    setRegisteredUser(response);
  }

  return (
    <main id="main-content" className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Panel Izquierdo Azul (Mockup HU-01) */}
      <aside
        aria-label={t("auth.systemInfoAria")}
        className="w-full md:w-1/2 bg-[#094b72] text-white p-8 sm:p-12 md:p-16 flex flex-col justify-center min-h-[360px] md:min-h-screen flex-shrink-0"
      >
        <header className="max-w-md mx-auto md:mx-0 w-full flex flex-col gap-4">
          <p className="font-serif text-xl sm:text-2xl text-white/90 m-0">
            {t("auth.brandName")}
          </p>
          <h1 id="hero-title" className="font-serif font-bold text-4xl sm:text-5xl text-white leading-tight m-0">
            {t("auth.register.heroTitle")}
          </h1>
          <p className="text-white/85 text-base sm:text-lg m-0 mt-2">
            {t("auth.register.heroSubtitle")}
          </p>
        </header>
        <footer className="max-w-md mx-auto md:mx-0 w-full pt-4">
          <span className="inline-block bg-[#073856] text-white/95 text-xs font-semibold px-4 py-2 rounded-full border border-white/10 shadow-sm">
            {t("auth.badgeNtc")}
          </span>
        </footer>
      </aside>

      {/* Panel Derecho Blanco (Formulario de Registro) */}
      <section
        aria-labelledby="form-title"
        className="w-full md:w-1/2 bg-white p-6 sm:p-10 md:p-16 flex flex-col justify-center items-center min-h-screen"
      >
        <div className="w-full max-w-[500px] flex flex-col gap-4">
          <div className="flex justify-end">
            <div
              role="group"
              aria-label={t("app.languageLabel")}
              className="inline-flex rounded-lg border border-[#8fb0c9] bg-[#f4f8fb] p-0.5"
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
          </div>
          {registeredUser ? (
            <UserRegistrationResultCard
              user={registeredUser}
              onRegisterAnother={() => setRegisteredUser(null)}
            />
          ) : (
            <UserRegistrationForm onSubmit={submitRegistration} />
          )}
        </div>
      </section>
    </main>
  );
}
