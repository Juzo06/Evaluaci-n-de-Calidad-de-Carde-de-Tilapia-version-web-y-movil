import { useEffect, useState } from "react";
import BatchSelector from "../components/BatchSelector";
import UnitImageForm from "../components/UnitImageForm";
import UnitResultsCard from "../components/UnitResultsCard";
import { ApiError } from "../services/apiClient";
import { getBatchByCode, listAvailableBatches } from "../services/batchService";
import { closeEvaluation as requestCloseEvaluation, evaluateUnit } from "../services/evaluationService";
import type { BatchResponseDTO } from "../types/batch";
import type { EvaluatedUnitRow } from "../types/evaluation";

const errorStyle = { color: "#b42318", fontWeight: 600 };

function toMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Ocurrió un error inesperado. Intenta de nuevo.";
}

export default function EvaluateBatchPage() {
  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchResponseDTO | null>(null);
  const [rows, setRows] = useState<EvaluatedUnitRow[]>([]);
  const [closedBatch, setClosedBatch] = useState<BatchResponseDTO | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    void loadAvailableBatches();
  }, []);

  async function loadAvailableBatches(): Promise<void> {
    setIsLoadingBatches(true);
    try {
      setBatches(await listAvailableBatches());
    } catch (error) {
      setPageError(toMessage(error));
    } finally {
      setIsLoadingBatches(false);
    }
  }

  async function selectBatch(code: string): Promise<void> {
    setPageError(null);
    setRows([]);
    setClosedBatch(null);
    if (!code) {
      setSelectedBatch(null);
      return;
    }
    try {
      setSelectedBatch(await getBatchByCode(code));
    } catch (error) {
      setSelectedBatch(null);
      setPageError(toMessage(error));
    }
  }

  /** Returns true when the unit was classified, so the form can clear the chosen image. */
  async function submitUnitEvaluation(code: string, image: File): Promise<boolean> {
    setPageError(null);
    setIsUploading(true);
    try {
      const evaluation = await evaluateUnit(code, image);
      const refreshedBatch = await getBatchByCode(code);
      setSelectedBatch(refreshedBatch);
      setBatches((current) => current.map((batch) => (batch.code === code ? refreshedBatch : batch)));
      setRows((current) => [...current, { unitNumber: refreshedBatch.evaluationCount, evaluation }]);
      return true;
    } catch (error) {
      setPageError(toMessage(error));
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function closeEvaluation(code: string): Promise<void> {
    setPageError(null);
    setIsClosing(true);
    try {
      const batch = await requestCloseEvaluation(code);
      setSelectedBatch(batch);
      setClosedBatch(batch);
      await loadAvailableBatches();
    } catch (error) {
      setPageError(toMessage(error));
    } finally {
      setIsClosing(false);
    }
  }

  const totalUnits = selectedBatch ? selectedBatch.sampleUnitCount : null;
  const classifiedCount = selectedBatch ? selectedBatch.evaluationCount : 0;
  const isEvaluated = closedBatch !== null;
  const allClassified = selectedBatch !== null && classifiedCount >= selectedBatch.sampleUnitCount;
  const canUpload = selectedBatch !== null && !allClassified && !isEvaluated;
  const canClose = selectedBatch !== null && allClassified && !isEvaluated;

  return (
    <main className="app">
      <nav className="side" aria-label="Menú principal">
        <h3 style={{ fontSize: "24px", padding: "0 16px 20px" }}>Calidad de Tilapia</h3>
        <a href="#/registro">Registrar usuario</a>
        <a href="#/register">Registrar lote</a>
        <a href="#/evaluate" aria-current="page">Evaluar lote</a>
        <a href="m-hu5.html">Lotes evaluados</a>
        <a href="m-hu2.html">Cerrar sesión</a>
      </nav>
      <section className="main">
        <header className="top">
          <hgroup>
            <h1 style={{ fontSize: "36px" }}>Evaluar lote</h1>
            <p style={{ margin: "4px 0 0" }}>Carga una imagen por unidad y el sistema la clasifica.</p>
          </hgroup>
          <span className="badge">[Nombre Apellido]</span>
        </header>
        {pageError && (
          <small role="alert" style={errorStyle}>
            {pageError}
          </small>
        )}
        <section style={{ display: "flex", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "420px" }}>
            <section className="card">
              <BatchSelector
                batches={batches}
                selectedCode={selectedBatch && !isEvaluated ? selectedBatch.code : ""}
                isLoading={isLoadingBatches}
                disabled={isUploading || isClosing}
                onSelect={(code) => void selectBatch(code)}
              />
            </section>
            <UnitImageForm
              classifiedCount={classifiedCount}
              totalUnits={totalUnits}
              disabled={!canUpload}
              isUploading={isUploading}
              onSubmit={(image) => (selectedBatch ? submitUnitEvaluation(selectedBatch.code, image) : Promise.resolve(false))}
            />
          </div>
          <UnitResultsCard
            rows={rows}
            canClose={canClose}
            isClosing={isClosing}
            closedBatch={closedBatch}
            onClose={() => selectedBatch && void closeEvaluation(selectedBatch.code)}
          />
        </section>
      </section>
    </main>
  );
}
