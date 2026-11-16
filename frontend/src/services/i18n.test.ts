import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const nativeStore = new Map<string, string>();
const webStore = new Map<string, string>();

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: nativeStore.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      nativeStore.set(key, value);
    }),
    remove: vi.fn(async ({ key }: { key: string }) => {
      nativeStore.delete(key);
    }),
  },
}));

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  applyDocumentLang,
  formatBatchStatus,
  formatRoleName,
  formatSampleUnitsSummary,
  formatUnitsCount,
  loadLocale,
  localizeErrorMessage,
  saveLocale,
  syncLocaleFromNative,
  translate,
} from "../i18n/translations";

function setupBrowserMocks(initialLang = "es") {
  const mockLocalStorage = {
    getItem: (key: string) => webStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      webStore.set(key, value);
    },
    removeItem: (key: string) => {
      webStore.delete(key);
    },
    clear: () => webStore.clear(),
  };
  const docElement = { lang: initialLang };

  vi.stubGlobal("window", { localStorage: mockLocalStorage });
  vi.stubGlobal("localStorage", mockLocalStorage);
  vi.stubGlobal("document", { documentElement: docElement });

  return docElement;
}

describe("i18n", () => {
  beforeEach(() => {
    nativeStore.clear();
    webStore.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa español ('es') como idioma inicial por defecto y actualiza documentElement.lang", () => {
    const docEl = setupBrowserMocks("");
    const locale = loadLocale();

    expect(DEFAULT_LOCALE).toBe("es");
    expect(locale).toBe("es");
    expect(docEl.lang).toBe("es");
  });

  it("cambia a inglés ('en'), persiste en localStorage ('secct.locale') y @capacitor/preferences, y actualiza html lang", async () => {
    const docEl = setupBrowserMocks("es");

    const saved = saveLocale("en");
    await Promise.resolve();

    expect(saved).toBe("en");
    expect(docEl.lang).toBe("en");
    expect(webStore.get(LOCALE_STORAGE_KEY)).toBe("en");
    expect(nativeStore.get(LOCALE_STORAGE_KEY)).toBe("en");
    expect(loadLocale()).toBe("en");

    webStore.clear();
    applyDocumentLang("es");
    const synced = await syncLocaleFromNative();
    expect(synced).toBe("en");
    expect(docEl.lang).toBe("en");
    expect(webStore.get(LOCALE_STORAGE_KEY)).toBe("en");
  });

  it("traduce claves clave en español e inglés e interpola parámetros dinámicos", () => {
    expect(translate("es", "nav.registerBatch")).toBe("Registrar lote");
    expect(translate("en", "nav.registerBatch")).toBe("Register batch");

    expect(translate("es", "auth.login.submit")).toBe("Ingresar");
    expect(translate("en", "auth.login.submit")).toBe("Sign in");

    expect(translate("es", "savedReports.emptyTitle")).toBe("Aún no tienes reportes guardados");
    expect(translate("en", "savedReports.emptyTitle")).toBe("You don't have any saved reports yet");

    expect(translate("es", "manage.deleteSuccess", { code: "LOT-09" })).toBe(
      "Lote LOT-09 eliminado correctamente.",
    );
    expect(translate("en", "manage.deleteSuccess", { code: "LOT-09" })).toBe(
      "Batch LOT-09 deleted successfully.",
    );

    expect(translate("en", "clave.inexistente")).toBe("clave.inexistente");
  });

  it("formatea estados de lote y roles de usuario en español e inglés sin códigos crudos", () => {
    expect(formatBatchStatus("ABIERTO", "es")).toBe("Abierto");
    expect(formatBatchStatus("ABIERTO", "en")).toBe("Open");
    expect(formatBatchStatus("EN_EVALUACION", "es")).toBe("En evaluación");
    expect(formatBatchStatus("EN_EVALUACION", "en")).toBe("In evaluation");
    expect(formatBatchStatus("EVALUADO", "es")).toBe("Evaluado");
    expect(formatBatchStatus("EVALUADO", "en")).toBe("Evaluated");
    expect(formatBatchStatus("REPORTADO", "es")).toBe("Reportado");
    expect(formatBatchStatus("REPORTADO", "en")).toBe("Reported");

    expect(formatRoleName("PISCICULTOR", "es")).toBe("Piscicultor");
    expect(formatRoleName("PISCICULTOR", "en")).toBe("Fish Farmer");
    expect(formatRoleName("ADMINISTRADOR", "es")).toBe("Administrador");
    expect(formatRoleName("ADMINISTRADOR", "en")).toBe("Administrator");
  });

  it("aplica concordancia singular y plural correcta para unidades y evaluaciones", () => {
    expect(formatUnitsCount(1, "es")).toBe("1 unidad");
    expect(formatUnitsCount(5, "es")).toBe("5 unidades");
    expect(formatUnitsCount(1, "en")).toBe("1 unit");
    expect(formatUnitsCount(5, "en")).toBe("5 units");

    expect(formatSampleUnitsSummary(1, 1, "es")).toBe("1 unidad (1 evaluada)");
    expect(formatSampleUnitsSummary(5, 1, "es")).toBe("5 unidades (1 evaluada)");
    expect(formatSampleUnitsSummary(10, 10, "es")).toBe("10 unidades (10 evaluadas)");
    expect(formatSampleUnitsSummary(1, 1, "en")).toBe("1 unit (1 evaluated)");
    expect(formatSampleUnitsSummary(5, 5, "en")).toBe("5 units (5 evaluated)");
  });

  it("localiza errores de validación y red cuando el idioma activo es inglés", () => {
    expect(localizeErrorMessage("El correo es obligatorio", "es")).toBe("El correo es obligatorio");
    expect(localizeErrorMessage("El correo es obligatorio", "en")).toBe("Email address is required");
    expect(
      localizeErrorMessage(
        "No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.",
        "en",
      ),
    ).toBe("Could not connect to the server. Please check your connection and try again.");
    expect(localizeErrorMessage(null, "en", "savedReports.loadError")).toBe(
      "Could not retrieve saved reports.",
    );
  });
});
