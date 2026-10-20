import type { ChangeEvent } from "react";
import type { BatchResponseDTO } from "../types/batch";

interface BatchSelectorProps {
  batches: BatchResponseDTO[];
  selectedCode: string;
  isLoading: boolean;
  disabled: boolean;
  onSelect: (code: string) => void;
}

export default function BatchSelector({ batches, selectedCode, isLoading, disabled, onSelect }: BatchSelectorProps) {
  const hasBatches = batches.length > 0;

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onSelect(event.target.value);
  }

  return (
    <label>
      Lote disponible
      <select
        name="batchCode"
        value={selectedCode}
        onChange={handleChange}
        disabled={disabled || isLoading || !hasBatches}
      >
        {isLoading && <option value="">Cargando lotes...</option>}
        {!isLoading && !hasBatches && <option value="">Sin resultados</option>}
        {!isLoading && hasBatches && <option value="">Selecciona un lote</option>}
        {batches.map((batch) => (
          <option key={batch.code} value={batch.code}>
            {batch.code} ({batch.evaluationCount}/{batch.sampleUnitCount} unidades)
          </option>
        ))}
      </select>
      {!isLoading && !hasBatches && <small role="status">Sin resultados: no tienes lotes disponibles para evaluar</small>}
    </label>
  );
}
