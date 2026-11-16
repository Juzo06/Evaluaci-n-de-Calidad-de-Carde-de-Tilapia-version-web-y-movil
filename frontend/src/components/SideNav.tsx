import { useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { logout } from "../services/authService";
import {
  getRoleCode,
  removeLocalToken as clearStoredSession,
} from "../services/authStorage";
import { isMobileApp } from "../services/platform";

export type SideNavPage =
  | "register"
  | "evaluate"
  | "registro"
  | "admin"
  | "evaluated"
  | "evaluados"
  | "gestion"
  | "reportes"
  | "cuenta";

interface SideNavProps {
  current?: SideNavPage;
}

/**
 * Navigation sidebar implementing DC-HU2, DS-HU2-logout, matching Mockups HU-03, HU-04, HU-05.
 * Background: #094b72 (petroleum blue). Clean white serif branding without icons.
 * Inactive items have the exact same white color and hover effect as "Cerrar sesión".
 */
export default function SideNav({ current }: SideNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { locale, setLocale, t } = useI18n();
  const roleCode = getRoleCode();
  const mobileMode = isMobileApp();

  // DC-HU2 explicit method: removeLocalToken(): void
  const removeLocalToken = (): void => {
    clearStoredSession();
  };

  // DC-HU2 explicit method: submitLogout(): void (DS-HU2-logout, PS-07, CN-10)
  const submitLogout = async (): Promise<void> => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Even if network fails, ensure local session is cleared
    } finally {
      removeLocalToken();
      window.location.replace("#/login");
    }
  };

  const isEvaluatedActive = current === "evaluados" || current === "evaluated";

  const getLinkStyle = (isActive: boolean) => ({
    color: isActive ? "#094b72" : "rgba(255, 255, 255, 0.9)",
    textDecoration: "none",
  });

  return (
    <aside
      aria-label={t("nav.sidebarAria")}
      className="w-full md:w-60 lg:w-64 bg-[#094b72] text-white flex flex-col md:justify-between p-4 md:p-6 md:min-h-screen md:flex-shrink-0"
    >
      <div>
        {/* Brand Header: Clean 2-line Serif without icons */}
        <header className="pt-1 pb-3 mb-2 md:pt-2 md:pb-6 md:mb-4">
          <h2 className="text-xl md:text-2xl font-serif text-white leading-tight">
            {t("nav.brandLine1")}<br className="hidden md:inline" />{" "}
            <span>{t("nav.brandLine2")}</span>
          </h2>
        </header>

        {/* Navigation links */}
        <nav aria-label={t("nav.mainAria")}>
          <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:flex-col md:space-y-2 p-0 m-0 list-none">
            {roleCode === "ADMINISTRADOR" ? (
              <li className="m-0 p-0">
                <a
                  href="#/admin"
                  id="nav-admin-link"
                  aria-current={current === "admin" ? "page" : undefined}
                  style={getLinkStyle(current === "admin")}
                  className={`block w-full text-center md:text-left px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm transition-colors ${
                    current === "admin"
                      ? "bg-white font-semibold shadow-sm"
                      : "hover:bg-white/10"
                  }`}
                >
                  {t("nav.adminMonitoring")}
                </a>
              </li>
            ) : (
              <>
                <li className="m-0 p-0">
                  <a
                    href="#/register"
                    id="nav-register-batch-link"
                    aria-current={current === "register" ? "page" : undefined}
                    style={getLinkStyle(current === "register")}
                    className={`block w-full text-center md:text-left px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm transition-colors ${
                      current === "register"
                        ? "bg-white font-semibold shadow-sm"
                        : "hover:bg-white/10"
                    }`}
                  >
                    {t("nav.registerBatch")}
                  </a>
                </li>
                <li className="m-0 p-0">
                  <a
                    href="#/evaluate"
                    id="nav-evaluate-batch-link"
                    aria-current={current === "evaluate" ? "page" : undefined}
                    style={getLinkStyle(current === "evaluate")}
                    className={`block w-full text-center md:text-left px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm transition-colors ${
                      current === "evaluate"
                        ? "bg-white font-semibold shadow-sm"
                        : "hover:bg-white/10"
                    }`}
                  >
                    {t("nav.evaluateBatch")}
                  </a>
                </li>
                <li className="m-0 p-0">
                  <a
                    href="#/evaluados"
                    id="nav-evaluated-batches-link"
                    aria-current={isEvaluatedActive ? "page" : undefined}
                    style={getLinkStyle(isEvaluatedActive)}
                    className={`block w-full text-center md:text-left px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm transition-colors ${
                      isEvaluatedActive
                        ? "bg-white font-semibold shadow-sm"
                        : "hover:bg-white/10"
                    }`}
                  >
                    {t("nav.evaluatedBatches")}
                  </a>
                </li>
                {!mobileMode && (
                  <>
                    <li className="m-0 p-0">
                      <a
                        href="#/gestion"
                        id="nav-batch-management-link"
                        aria-current={current === "gestion" ? "page" : undefined}
                        style={getLinkStyle(current === "gestion")}
                        className={`block w-full text-center md:text-left px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm transition-colors ${
                          current === "gestion"
                            ? "bg-white font-semibold shadow-sm"
                            : "hover:bg-white/10"
                        }`}
                      >
                        {t("nav.batchManagement")}
                      </a>
                    </li>
                    <li className="m-0 p-0">
                      <a
                        href="#/reportes"
                        id="nav-saved-reports-link"
                        aria-current={current === "reportes" ? "page" : undefined}
                        style={getLinkStyle(current === "reportes")}
                        className={`block w-full text-center md:text-left px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm transition-colors ${
                          current === "reportes"
                            ? "bg-white font-semibold shadow-sm"
                            : "hover:bg-white/10"
                        }`}
                      >
                        {t("nav.savedReports")}
                      </a>
                    </li>
                    <li className="m-0 p-0">
                      <a
                        href="#/cuenta"
                        id="nav-profile-link"
                        aria-current={current === "cuenta" ? "page" : undefined}
                        style={getLinkStyle(current === "cuenta")}
                        className={`block w-full text-center md:text-left px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm transition-colors ${
                          current === "cuenta"
                            ? "bg-white font-semibold shadow-sm"
                            : "hover:bg-white/10"
                        }`}
                      >
                        {t("nav.profile")}
                      </a>
                    </li>
                  </>
                )}
              </>
            )}

            {/* Cerrar sesión with identical styling */}
            <li className="m-0 p-0">
              <button
                type="button"
                id="nav-logout-button"
                onClick={submitLogout}
                disabled={isLoggingOut}
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
                className="w-full text-center md:text-left px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 md:mt-1 block"
              >
                {isLoggingOut ? t("nav.loggingOut") : t("nav.logout")}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between gap-2">
        <span className="text-xs text-white/80 font-medium">{t("nav.languageHeading")}</span>
        <div
          role="group"
          aria-label={t("app.languageLabel")}
          className="inline-flex rounded-lg bg-[#073a59] p-0.5 border border-white/15"
        >
          <button
            type="button"
            id="nav-lang-es"
            onClick={() => setLocale("es")}
            aria-pressed={locale === "es"}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              locale === "es"
                ? "bg-white text-[#094b72]"
                : "text-white/85 hover:text-white"
            }`}
          >
            ES
          </button>
          <button
            type="button"
            id="nav-lang-en"
            onClick={() => setLocale("en")}
            aria-pressed={locale === "en"}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              locale === "en"
                ? "bg-white text-[#094b72]"
                : "text-white/85 hover:text-white"
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </aside>
  );
}
