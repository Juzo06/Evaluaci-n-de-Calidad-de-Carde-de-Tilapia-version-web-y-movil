import type { BatchResponseDTO } from "../types/batch";
import type { ClassificationResultDTO, EvaluatedUnitRow } from "../types/evaluation";

interface UnitResultsCardProps {
  rows: EvaluatedUnitRow[];
  canClose: boolean;
  isClosing: boolean;
  closedBatch: BatchResponseDTO | null;
  onClose: () => void;
}

function formatConfidence(confidence: number): string {
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(confidence);
}

function formatClassification(value: number): string {
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function findResult(row: EvaluatedUnitRow, fishPartCode: string): ClassificationResultDTO | undefined {
  return row.evaluation.results.find((result) => result.fishPartCode === fishPartCode);
}

function renderCategory(result: ClassificationResultDTO | undefined) {
  return <span className="tag">{result ? `Categoría ${result.ntcCategory}` : "-"}</span>;
}

export default function UnitResultsCard({ rows, canClose, isClosing, closedBatch, onClose }: UnitResultsCardProps) {
  return (
    <article className="card" style={{ flex: 1 }}>
      <h2 style={{ fontSize: "22px" }}>Resultado por unidad</h2>
      <table>
        <thead>
          <tr>
            <th>UNIDAD</th>
            <th>OJO</th>
            <th>PIEL</th>
            <th>CONFIANZA (0 a 1)</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4}>Aún no hay unidades clasificadas en esta sesión</td>
            </tr>
          )}
          {rows.map((row) => {
            const eye = findResult(row, "OJO");
            const skin = findResult(row, "PIEL");
            return (
              <tr key={row.evaluation.id}>
                <td>{row.unitNumber}</td>
                <td>{renderCategory(eye)}</td>
                <td>{renderCategory(skin)}</td>
                <td>
                  OJO {eye ? formatConfidence(eye.confidence) : "-"} · PIEL {skin ? formatConfidence(skin.confidence) : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {closedBatch ? (
        <small role="status">
          Evaluación finalizada. El lote {closedBatch.code} pasó a {closedBatch.statusCode} y su clasificación final es:{" "}
          <strong>{closedBatch.finalClassification !== null ? formatClassification(closedBatch.finalClassification) : "-"}</strong>
        </small>
      ) : (
        <small>
          Finalizar evaluación se habilita cuando todas las unidades están clasificadas. Al finalizar, el lote pasa a
          EVALUADO y se calcula su clasificación final.
        </small>
      )}
      <footer className="row">
        <button className="p" type="button" disabled={!canClose || isClosing} onClick={onClose}>
          {isClosing ? "Finalizando..." : "Finalizar evaluación"}
        </button>
      </footer>
    </article>
  );
}
