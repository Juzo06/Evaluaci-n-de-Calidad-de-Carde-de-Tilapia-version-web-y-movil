import { useEffect, useState } from "react";
import EvaluateBatchPage from "./pages/EvaluateBatchPage";
import RegisterBatchPage from "./pages/RegisterBatchPage";

function isEvaluateRoute(): boolean {
  return window.location.hash === "#/evaluate";
}

export default function App() {
  const [showEvaluate, setShowEvaluate] = useState(isEvaluateRoute);

  useEffect(() => {
    const handleHashChange = () => setShowEvaluate(isEvaluateRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return showEvaluate ? <EvaluateBatchPage /> : <RegisterBatchPage />;
}
