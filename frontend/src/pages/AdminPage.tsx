import { useEffect, useState } from "react";
import SideNav from "../components/SideNav";
import { useI18n } from "../i18n/I18nContext";
import { formatRoleName, localizeErrorMessage } from "../i18n/translations";
import { getSystemInfo } from "../services/adminService";
import { ApiError } from "../services/apiClient";
import { getRoleCode, getUserEmail, getUserFullName } from "../services/authStorage";
import type { SystemInfoResponseDTO } from "../types/admin";

const numberFormatter = new Intl.NumberFormat("es-CO");

function formatCount(value: number): string {
  return numberFormatter.format(value);
}

/**
 * HU-07: Admin monitoring panel enforcing ADMINISTRADOR role and loading system metrics (DS-HU7, PL-2.15).
 */
export default function AdminPage() {
  const { locale, t } = useI18n();
  const roleCode = getRoleCode();
  const userEmail = getUserEmail();
  const userFullName = getUserFullName();

  const [systemInfo, setSystemInfo] = useState<SystemInfoResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(roleCode === "ADMINISTRADOR");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** Implements showSystemInfo from DC-HU7 / DS-HU7 diagram. */
  function showSystemInfo(response: SystemInfoResponseDTO): void {
    setSystemInfo(response);
  }

  /** Implements loadSystemInfo from DC-HU7 / DS-HU7 diagram. */
  async function loadSystemInfo(): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await getSystemInfo();
      showSystemInfo(response);
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t("admin.loadError");
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (roleCode === "ADMINISTRADOR") {
      void loadSystemInfo();
    }
  }, [roleCode]);

  // PL-2.15: If role is not ADMINISTRADOR, block access and display 403 Acceso Denegado
  if (roleCode !== "ADMINISTRADOR") {
    return (
      <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col md:flex-row bg-[#f4f8fb]">
        <SideNav current="admin" />
        <main id="main-content" className="flex-1 flex items-center justify-center p-6">
          <section
            id="access-denied-card"
            aria-labelledby="access-denied-title"
            className="max-w-lg w-full bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm"
            role="alert"
          >
            <span
              id="status-403-badge"
              className="px-3 py-1 bg-red-50 text-[#b42318] border border-red-200 rounded-full text-xs font-bold uppercase tracking-widest inline-block mb-3"
            >
              {t("admin.status403")}
            </span>
            <h1 id="access-denied-title" className="text-3xl font-serif text-[#0b3a5a] mb-3">
              {t("admin.accessDenied")}
            </h1>
            <p className="text-[#4d6a80] text-sm mb-6 leading-relaxed">
              {t("admin.accessDeniedBodyPrefix")}
              <strong className="text-[#094b72]">{formatRoleName("ADMINISTRADOR", locale)}</strong>.
            </p>
            <dl className="p-4 rounded-xl bg-[#f4f8fb] border border-[#d5e3ee] text-xs text-[#4d6a80] mb-6 text-left m-0 flex flex-col gap-2">
              <div className="flex gap-2">
                <dt className="text-[#0b3a5a] font-bold">{t("admin.userLabel")}</dt>
                <dd className="m-0">{userEmail ?? t("admin.unknownUser")}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[#0b3a5a] font-bold">{t("admin.detectedRoleLabel")}</dt>
                <dd className="m-0 text-[#0b4f7a] font-semibold">
                  {roleCode ? formatRoleName(roleCode, locale) : t("admin.noRole")}
                </dd>
              </div>
            </dl>
            <footer>
              <a
                href="#/register"
                id="return-to-batches-button"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#0b4f7a] text-white font-semibold hover:bg-[#094b72] transition-colors no-underline"
              >
                {t("admin.backToBatches")}
              </a>
            </footer>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col md:flex-row bg-[#f4f8fb]">
      <SideNav current="admin" />
      <main id="main-content" className="flex-1 min-w-0 w-full max-w-full p-4 sm:p-6 lg:p-10 flex flex-col gap-6">
        <header className="top flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <hgroup>
            <h1 id="system-monitoring-title" className="text-2xl sm:text-3xl lg:text-[36px] font-serif leading-tight">
              {t("admin.title")}
            </h1>
            <p style={{ margin: "4px 0 0" }}>
              {t("admin.subtitle")}
            </p>
          </hgroup>
          <span
            aria-label={t("admin.badgeAria")}
            className="self-start sm:self-auto shrink-0 max-w-full truncate bg-[#e6eff6] text-[#094b72] px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm"
          >
            {t("admin.badgePrefix", { name: userFullName })}
          </span>
        </header>

        {errorMessage && (
          <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#b42318] font-semibold">
            {localizeErrorMessage(errorMessage, locale, "admin.loadError")}
          </div>
        )}

        <section
          aria-labelledby="system-metrics-heading"
          aria-live="polite"
          className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl"
        >
          <h2 id="system-metrics-heading" className="sr-only">
            {t("admin.metricsHeading")}
          </h2>

          <article className="card p-6 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-2">
            <header>
              <h3 className="text-xs font-semibold tracking-wider text-[#4d6a80] uppercase font-sans m-0">
                {t("admin.metricUsersTitle")}
              </h3>
            </header>
            <p className="text-4xl font-serif font-bold text-[#094b72] m-0" id="total-users-metric">
              {isLoading ? "—" : systemInfo ? formatCount(systemInfo.totalUsers) : "0"}
            </p>
            <p className="text-xs text-[#4d6a80] m-0">
              {t("admin.metricUsersDesc")}
            </p>
          </article>

          <article className="card p-6 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-2">
            <header>
              <h3 className="text-xs font-semibold tracking-wider text-[#4d6a80] uppercase font-sans m-0">
                {t("admin.metricBatchesTitle")}
              </h3>
            </header>
            <p className="text-4xl font-serif font-bold text-[#094b72] m-0" id="total-batches-metric">
              {isLoading ? "—" : systemInfo ? formatCount(systemInfo.totalBatches) : "0"}
            </p>
            <p className="text-xs text-[#4d6a80] m-0">
              {t("admin.metricBatchesDesc")}
            </p>
          </article>

          <article className="card p-6 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-2">
            <header>
              <h3 className="text-xs font-semibold tracking-wider text-[#4d6a80] uppercase font-sans m-0">
                {t("admin.metricEvaluationsTitle")}
              </h3>
            </header>
            <p className="text-4xl font-serif font-bold text-[#094b72] m-0" id="total-evaluations-metric">
              {isLoading ? "—" : systemInfo ? formatCount(systemInfo.totalEvaluations) : "0"}
            </p>
            <p className="text-xs text-[#4d6a80] m-0">
              {t("admin.metricEvaluationsDesc")}
            </p>
          </article>
        </section>

        <section
          aria-labelledby="metrics-detail-title"
          className="card w-full min-w-0 max-w-5xl p-4 sm:p-6 lg:p-8 rounded-2xl bg-white border border-[#d5e3ee] shadow-sm flex flex-col gap-4"
        >
          <header>
            <h2 id="metrics-detail-title" className="text-xl sm:text-2xl font-serif text-[#0b3a5a] m-0">
              {t("admin.detailTitle")}
            </h2>
          </header>

          {isLoading ? (
            <div className="py-8 text-center text-[#4d6a80] text-sm font-medium" role="status" aria-live="polite">
              {t("admin.loadingMetrics")}
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left" id="system-metrics-table">
                <caption className="sr-only">
                  {t("admin.tableCaption")}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-3 text-xs whitespace-nowrap">{t("admin.col.indicator")}</th>
                    <th scope="col" className="px-3 py-3 text-xs">{t("admin.col.rule")}</th>
                    <th scope="col" className="px-3 py-3 text-xs whitespace-nowrap text-right">{t("admin.col.total")}</th>
                    <th scope="col" className="px-3 py-3 text-xs whitespace-nowrap text-center">{t("admin.col.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-3 text-xs sm:text-sm font-semibold text-[#0b3a5a]">
                      {t("admin.row.usersName")}
                    </td>
                    <td className="px-3 py-3 text-xs sm:text-sm text-[#4d6a80]">
                      {t("admin.row.usersRule")}
                    </td>
                    <td className="px-3 py-3 text-xs sm:text-sm font-bold text-[#094b72] text-right whitespace-nowrap">
                      {systemInfo ? formatCount(systemInfo.totalUsers) : "0"}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="tag text-[#094b72]">{t("admin.statusOperational")}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 text-xs sm:text-sm font-semibold text-[#0b3a5a]">
                      {t("admin.row.batchesName")}
                    </td>
                    <td className="px-3 py-3 text-xs sm:text-sm text-[#4d6a80]">
                      {t("admin.row.batchesRule")}
                    </td>
                    <td className="px-3 py-3 text-xs sm:text-sm font-bold text-[#094b72] text-right whitespace-nowrap">
                      {systemInfo ? formatCount(systemInfo.totalBatches) : "0"}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="tag text-[#094b72]">{t("admin.statusOperational")}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 text-xs sm:text-sm font-semibold text-[#0b3a5a]">
                      {t("admin.row.evalsName")}
                    </td>
                    <td className="px-3 py-3 text-xs sm:text-sm text-[#4d6a80]">
                      {t("admin.row.evalsRule")}
                    </td>
                    <td className="px-3 py-3 text-xs sm:text-sm font-bold text-[#094b72] text-right whitespace-nowrap">
                      {systemInfo ? formatCount(systemInfo.totalEvaluations) : "0"}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="tag text-[#094b72]">{t("admin.statusOperational")}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-[#e6eef5]">
            <p className="text-xs text-[#4d6a80] m-0">
              {t("admin.footerNote")}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#/registro"
                className="o inline-flex items-center justify-center text-sm no-underline px-4 h-11 rounded-xl"
              >
                {t("admin.registerNewUser")}
              </a>
              <button
                type="button"
                id="refresh-system-info-button"
                className="o cursor-pointer text-sm px-5 h-11 rounded-xl"
                onClick={() => void loadSystemInfo()}
                disabled={isLoading}
              >
                {isLoading ? t("admin.refreshing") : t("admin.refresh")}
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
