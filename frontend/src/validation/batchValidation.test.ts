import { describe, expect, it } from "vitest";
import {
  getTodayIsoDate,
  toRegisterBatchRequest,
  validateBatchForm,
  validateExpandForm,
} from "./batchValidation";

describe("batchValidation", () => {
  it("acepta lote valido y convierte coma decimal y notas vacias a null", () => {
    const today = getTodayIsoDate();
    const values = {
      captureDate: today,
      weightKg: "45,75",
      sampleUnitCount: "12",
      notes: "   ",
    };

    expect(validateBatchForm(values)).toEqual({});
    expect(toRegisterBatchRequest(values)).toEqual({
      captureDate: today,
      weightKg: 45.75,
      sampleUnitCount: 12,
      notes: null,
    });
  });

  it("rechaza fecha futura, peso con mas de 2 decimales y unidades fuera de rango", () => {
    const errors = validateBatchForm({
      captureDate: "2999-01-01",
      weightKg: "10.123",
      sampleUnitCount: "501",
      notes: "x".repeat(501),
    });

    expect(errors.captureDate).toBe("La fecha de captura no puede ser futura");
    expect(errors.weightKg).toBe("El peso admite máximo 2 decimales");
    expect(errors.sampleUnitCount).toBe(
      "Las unidades de muestra deben ser un entero entre 1 y 500",
    );
    expect(errors.notes).toBe("Las observaciones admiten máximo 500 caracteres");
  });

  it("valida ampliacion de muestra dentro de [1, 499] y tope acumulado de 500 (HU-13)", () => {
    expect(validateExpandForm({ additionalUnits: "10" }, 490)).toEqual({});
    expect(validateExpandForm({ additionalUnits: "0" }, 10)).toEqual({
      additionalUnits: "Las unidades adicionales deben ser un entero entre 1 y 499",
    });
    expect(validateExpandForm({ additionalUnits: "15" }, 490)).toEqual({
      additionalUnits: "La muestra no puede superar 500 unidades",
    });
  });
});
