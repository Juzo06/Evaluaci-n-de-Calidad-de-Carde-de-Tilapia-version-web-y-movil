import { useEffect, useState } from "react";
import EvaluateBatchPage from "./pages/EvaluateBatchPage";
import RegisterBatchPage from "./pages/RegisterBatchPage";
import RegisterUserPage from "./pages/RegisterUserPage";

type Route = "registro" | "evaluate" | "registerBatch";

function getCurrentRoute(): Route {
  const hash = window.location.hash.toLowerCase();
  if (hash === "#/registro" || hash === "#/register-user") {
    return "registro";
  }
  if (hash === "#/evaluate") {
    return "evaluate";
  }
  return "registerBatch";
}

export default function App() {
  const [route, setRoute] = useState<Route>(getCurrentRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getCurrentRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (route === "registro") {
    return <RegisterUserPage />;
  }

  if (route === "evaluate") {
    return <EvaluateBatchPage />;
  }

  return <RegisterBatchPage />;
}
