import { useEffect, useState } from "react";
import EvaluateBatchPage from "./pages/EvaluateBatchPage";
import RegisterBatchPage from "./pages/RegisterBatchPage";
import RegisterUserPage from "./pages/RegisterUserPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import { isAuthenticated, getRoleCode } from "./services/authStorage";

type Route = "login" | "registro" | "evaluate" | "registerBatch" | "admin";

function getCurrentRoute(): Route {
  const hash = window.location.hash.toLowerCase();

  if (hash === "#/login") {
    return "login";
  }
  if (hash === "#/registro" || hash === "#/register-user") {
    return "registro";
  }
  if (hash === "#/admin") {
    return "admin";
  }
  if (hash === "#/evaluate") {
    return "evaluate";
  }
  if (hash === "#/register" || hash === "#/register-batch") {
    return "registerBatch";
  }

  // Root or unmapped route
  if (!isAuthenticated()) {
    return "login";
  }
  return getRoleCode() === "ADMINISTRADOR" ? "admin" : "registerBatch";
}

export default function App() {
  const [route, setRoute] = useState<Route>(getCurrentRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getCurrentRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const authenticated = isAuthenticated();

  // Protected routes check: redirect to #/login if unauthenticated (PS-06, PL-2.19)
  if (!authenticated && (route === "registerBatch" || route === "evaluate" || route === "admin")) {
    if (window.location.hash !== "#/login") {
      window.location.replace("#/login");
    }
    return <LoginPage />;
  }

  // If already authenticated and on login page, redirect to role home
  if (authenticated && route === "login") {
    const role = getRoleCode();
    const destination = role === "ADMINISTRADOR" ? "#/admin" : "#/register";
    window.location.replace(destination);
    return role === "ADMINISTRADOR" ? <AdminPage /> : <RegisterBatchPage />;
  }

  if (route === "login") {
    return <LoginPage />;
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

  return <RegisterBatchPage />;
}
