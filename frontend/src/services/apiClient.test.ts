import { Capacitor } from "@capacitor/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiDelete, apiGet, apiGetBlob, apiPost, resolveApiUrl } from "./apiClient";
import { getToken, saveToken } from "./authStorage";

describe("apiClient", () => {
  const store = new Map<string, string>();
  const replaceMock = vi.fn();

  beforeEach(() => {
    store.clear();
    replaceMock.mockReset();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    });
    vi.stubGlobal("window", {
      localStorage: globalThis.localStorage,
      location: { replace: replaceMock },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("adjunta Bearer token y resuelve 200 JSON / 204 No Content", async () => {
    saveToken("token-abc");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ code: "SECCT-20261115-001" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      });
    vi.stubGlobal("fetch", fetchMock);

    const batch = await apiGet<{ code: string }>("/api/batches/1");
    expect(batch.code).toBe("SECCT-20261115-001");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "GET",
      headers: { Authorization: "Bearer token-abc" },
    });

    const deleted = await apiDelete("/api/batches/SECCT-20261115-001");
    expect(deleted).toBeUndefined();
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "DELETE",
      headers: { Authorization: "Bearer token-abc" },
    });
  });

  it("extrae blob y filename desde Content-Disposition en apiGetBlob", async () => {
    saveToken("token-pdf");
    const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (header: string) =>
          header === "Content-Disposition"
            ? 'attachment; filename="reporte-SECCT-20261115-001-v1.pdf"'
            : null,
      },
      blob: async () => mockBlob,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiGetBlob("/api/reports/5/pdf");
    expect(result.blob).toBe(mockBlob);
    expect(result.filename).toBe("reporte-SECCT-20261115-001-v1.pdf");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: {
        Accept: "application/pdf",
        Authorization: "Bearer token-pdf",
      },
    });
  });

  it("limpia sesion, redirige a #/login y lanza ApiError ante HTTP 401", async () => {
    saveToken("expired-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Token expirado", errors: [] }),
      }),
    );

    await expect(apiPost("/api/batches", { weightKg: 10 })).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Token expirado",
    } satisfies Partial<ApiError>);

    expect(getToken()).toBeNull();
    expect(replaceMock).toHaveBeenCalledWith("#/login");
  });

  it("resuelve URL relativa en web, origen nativo Capacitor y VITE_API_BASE_URL", () => {
    vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(false);
    expect(resolveApiUrl("/api/batches")).toBe("/api/batches");

    vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    expect(resolveApiUrl("/api/batches")).toBe("https://secct-backend.onrender.com/api/batches");

    localStorage.setItem("secct_api_base_url", "http://192.168.1.25:8080///");
    expect(resolveApiUrl("/api/batches")).toBe("http://192.168.1.25:8080/api/batches");

    vi.stubEnv("VITE_API_BASE_URL", "https://api.secct.example.com/");
    expect(resolveApiUrl("/api/batches")).toBe("https://api.secct.example.com/api/batches");
  });
});
