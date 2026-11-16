import { useEffect, useState } from "react";
import AccessibilityWidget from "./components/AccessibilityWidget";
import { I18nProvider, useI18n } from "./i18n/I18nContext";
import AdminPage from "./pages/AdminPage";
import BatchManagementPage from "./pages/BatchManagementPage";
import EvaluateBatchPage from "./pages/EvaluateBatchPage";
import EvaluatedBatchesPage from "./pages/EvaluatedBatchesPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterBatchPage from "./pages/RegisterBatchPage";
import RegisterUserPage from "./pages/RegisterUserPage";
import ReportPage from "./pages/ReportPage";
import SavedReportsPage from "./pages/SavedReportsPage";
import { getRoleCode, isAuthenticated, removeLocalToken } from "./services/authStorage";
import { isMobileApp } from "./services/platform";

type Route =
  | "login"
  | "registro"
  | "evaluate"
  | "registerBatch"
  | "admin"
  | "evaluated"
  | "batchManagement"
  | "savedReports"
  | "report"
  | "profile";

function getCurrentRoute(): Route {
  const hashPath = window.location.hash.split("?")[0].toLowerCase();

  if (hashPath === "#/login") {
    return "login";
  }
  if (hashPath === "#/registro" || hashPath === "#/register-user") {
    return "registro";
  }
  if (hashPath === "#/admin") {
    return "admin";
  }
  if (hashPath === "#/evaluate") {
    return "evaluate";
  }
  if (hashPath === "#/evaluados" || hashPath === "#/evaluated" || hashPath === "#/lotes-evaluados") {
    return "evaluated";
  }
  if (hashPath === "#/gestion" || hashPath === "#/batches" || hashPath === "#/batch-management") {
    return "batchManagement";
  }
  if (hashPath === "#/reportes" || hashPath === "#/reports") {
    return "savedReports";
  }
  if (
    hashPath === "#/reportes/lote" ||
    hashPath === "#/reporte-lote" ||
    hashPath === "#/reportes/detalle" ||
    /^#\/reportes\/\d+$/.test(hashPath)
  ) {
    return "report";
  }
  if (hashPath === "#/cuenta" || hashPath === "#/profile") {
    return "profile";
  }
  if (hashPath === "#/register" || hashPath === "#/register-batch") {
    return "registerBatch";
  }

  // Root or unmapped route
  if (!isAuthenticated()) {
    return "login";
  }
  if (getRoleCode() === "ADMINISTRADOR") {
    return isMobileApp() ? "login" : "admin";
  }
  return "registerBatch";
}

function isProtectedRoute(route: Route): boolean {
  return route !== "login" && route !== "registro";
}

function renderCurrentPage(route: Route) {
  const auth = isAuthenticated();

  // Protected routes check: redirect to #/login if unauthenticated (PS-06, PL-2.19)
  if (!auth && isProtectedRoute(route)) {
    if (window.location.hash !== "#/login") {
      window.location.replace("#/login");
    }
    return <LoginPage />;
  }

  const role = getRoleCode();

  // In mobile APK, administrators cannot access monitoring or piscicultor flows
  if (auth && isMobileApp() && role === "ADMINISTRADOR") {
    removeLocalToken();
    if (window.location.hash !== "#/login") {
      window.location.replace("#/login");
    }
    return <LoginPage />;
  }

  // On desktop web, lock authenticated ADMINISTRADOR strictly to #/admin monitoring view
  if (auth && !isMobileApp() && role === "ADMINISTRADOR") {
    if (route !== "admin" || window.location.hash !== "#/admin") {
      window.location.replace("#/admin");
    }
    return <AdminPage />;
  }

  // If already authenticated and on login page, redirect to role home
  if (auth && route === "login") {
    const destination = "#/register";
    window.location.replace(destination);
    return <RegisterBatchPage />;
  }

  if (route === "login") {
    return <LoginPage />;
  }

  if (
    isMobileApp() &&
    (route === "admin" ||
      route === "batchManagement" ||
      route === "savedReports" ||
      route === "profile" ||
      route === "registro")
  ) {
    if (window.location.hash !== "#/register") {
      window.location.replace("#/register");
    }
    return <RegisterBatchPage />;
  }

  if (route === "registro") {
    return <RegisterUserPage />;
  }

  if (route === "admin") {
    return <AdminPage />;
  }

  if (route === "evaluate") {
    return <EvaluateBatchPage />;
  }

  if (route === "evaluated") {
    return <EvaluatedBatchesPage />;
  }

  if (route === "batchManagement") {
    return <BatchManagementPage />;
  }

  if (route === "savedReports") {
    return <SavedReportsPage />;
  }

  if (route === "report") {
    return <ReportPage />;
  }

  if (route === "profile") {
    return <ProfilePage />;
  }

  return <RegisterBatchPage />;
}

function AppShell() {
  const [route, setRoute] = useState<Route>(getCurrentRoute);
  const { t } = useI18n();

  useEffect(() => {
    const handleHashChange = () => setRoute(getCurrentRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#094b72] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-[#003465]"
      >
        {t("app.skipToMain")}
      </a>
      {renderCurrentPage(route)}
      <AccessibilityWidget />
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  );
}
