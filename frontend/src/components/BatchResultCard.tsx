import type { BatchResponseDTO } from "../types/batch";

interface BatchResultCardProps {
  batch: BatchResponseDTO;
  onRegisterAnother: () => void;
}

function formatWeight(weightKg: number): string {
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(weightKg);
}

export default function BatchResultCard({ batch, onRegisterAnother }: BatchResultCardProps) {
  return (
    <section className="card" style={{ maxWidth: "860px" }} aria-live="polite">
      <h2>Lote registrado</h2>
      <p>Código del lote: <strong>{batch.code}</strong></p>
      <p>Fecha de captura: {batch.captureDate}</p>
      <p>Peso: {formatWeight(batch.weightKg)} kg</p>
      <p>Número de unidades de muestra: {batch.sampleUnitCount}</p>
      {batch.notes && <p>Observaciones: {batch.notes}</p>}
      <p>Estado: {batch.statusCode}</p>
      <footer className="row">
        <button className="p" type="button" onClick={onRegisterAnother}>Registrar otro lote</button>
      </footer>
    </section>
  );
}
