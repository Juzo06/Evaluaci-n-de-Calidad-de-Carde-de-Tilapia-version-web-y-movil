import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiGetMock, apiPostMock, apiDeleteMock, apiPostFormMock, apiGetBlobMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPostMock: vi.fn(),
  apiDeleteMock: vi.fn(),
  apiPostFormMock: vi.fn(),
  apiGetBlobMock: vi.fn(),
}));

vi.mock("./apiClient", () => ({
  apiGet: apiGetMock,
  apiPost: apiPostMock,
  apiDelete: apiDeleteMock,
  apiPostForm: apiPostFormMock,
  apiGetBlob: apiGetBlobMock,
}));

import { getSystemInfo } from "./adminService";
import { deleteAccount, login, logout, register } from "./authService";
import {
  consultEvaluatedBatches,
  expandSample,
  getBatchByCode,
  listAvailableBatches,
  registerBatch,
  requestDeleteBatch,
} from "./batchService";
import { closeEvaluation, evaluateUnit } from "./evaluationService";
import {
  downloadReportPdf,
  getBatchReport,
  getSavedReport,
  listSavedReports,
  requestDeleteReport,
  saveFile,
  saveReport,
} from "./reportService";

describe("domainServices", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
    apiDeleteMock.mockReset();
    apiPostFormMock.mockReset();
    apiGetBlobMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("authService", () => {
    it("envía login, logout, register y deleteAccount a los endpoints esperados", async () => {
      const loginPayload = { email: "ana@example.com", password: "Password1!" };
      const loginResponse = {
        id: 1,
        email: "ana@example.com",
        roleCode: "PISCICULTOR",
        accessToken: "jwt-123",
        expiresInMinutes: 60,
      };
      apiPostMock.mockResolvedValueOnce(loginResponse);
      expect(await login(loginPayload)).toEqual(loginResponse);
      expect(apiPostMock).toHaveBeenCalledWith("/api/auth/login", loginPayload);

      apiPostMock.mockResolvedValueOnce(undefined);
      await logout();
      expect(apiPostMock).toHaveBeenCalledWith("/api/auth/logout");

      const registerPayload = {
        firstName: "Ana",
        lastName: "Pérez",
        email: "ana@example.com",
        phone: "3001234567",
        password: "Password1!",
      };
      apiPostMock.mockResolvedValueOnce({ id: 2, email: "ana@example.com" });
      expect(await register(registerPayload)).toEqual({ id: 2, email: "ana@example.com" });
      expect(apiPostMock).toHaveBeenCalledWith("/api/users", registerPayload);

      apiPostMock.mockResolvedValueOnce(undefined);
      await deleteAccount({ password: "Password1!" });
      expect(apiPostMock).toHaveBeenCalledWith("/api/users/me/delete", { password: "Password1!" });
    });
  });

  describe("batchService", () => {
    it("gestiona registro, consulta, eliminación lógica y ampliación de muestra con codificación de código", async () => {
      const registerReq = {
        captureDate: "2026-11-15",
        weightKg: 25.5,
        sampleUnitCount: 5,
        notes: "Lote inicial",
      };
      const sampleBatch = {
        id: 10,
        code: "LOTE-2026/01",
        captureDate: "2026-11-15",
        weightKg: 25.5,
        sampleUnitCount: 5,
        notes: "Lote inicial",
        evaluationCount: 0,
        finalClassification: null,
        statusCode: "ABIERTO",
      };

      apiPostMock.mockResolvedValueOnce(sampleBatch);
      expect(await registerBatch(registerReq)).toEqual(sampleBatch);
      expect(apiPostMock).toHaveBeenCalledWith("/api/batches", registerReq);

      apiGetMock.mockResolvedValueOnce([sampleBatch]);
      expect(await listAvailableBatches()).toEqual([sampleBatch]);
      expect(apiGetMock).toHaveBeenCalledWith("/api/batches");

      apiGetMock.mockResolvedValueOnce(sampleBatch);
      expect(await getBatchByCode("LOTE-2026/01")).toEqual(sampleBatch);
      expect(apiGetMock).toHaveBeenCalledWith("/api/batches/LOTE-2026%2F01");

      apiGetMock.mockResolvedValueOnce([sampleBatch]);
      expect(await consultEvaluatedBatches()).toEqual([sampleBatch]);
      expect(apiGetMock).toHaveBeenCalledWith("/api/batches/evaluated");

      apiDeleteMock.mockResolvedValueOnce(undefined);
      await requestDeleteBatch("LOTE-2026/01");
      expect(apiDeleteMock).toHaveBeenCalledWith("/api/batches/LOTE-2026%2F01");

      apiPostMock.mockResolvedValueOnce({ ...sampleBatch, sampleUnitCount: 8 });
      const expanded = await expandSample("LOTE-2026/01", { additionalUnits: 3 });
      expect(expanded.sampleUnitCount).toBe(8);
      expect(apiPostMock).toHaveBeenCalledWith("/api/batches/LOTE-2026%2F01/expand", {
        additionalUnits: 3,
      });
    });
  });

  describe("evaluationService", () => {
    it("envía imagen FormData en evaluateUnit y cierra evaluación en closeEvaluation", async () => {
      const fakeFile = new File(["binary"], "tilapia.jpg", { type: "image/jpeg" });
      const evalRes = {
        id: 55,
        evaluatedAt: "2026-11-15T12:00:00Z",
        results: [
          { fishPartCode: "OJO", ntcCategory: 2, confidence: 0.94 },
          { fishPartCode: "PIEL", ntcCategory: 2, confidence: 0.91 },
        ],
      };

      apiPostFormMock.mockResolvedValueOnce(evalRes);
      expect(await evaluateUnit("LOT-01", fakeFile)).toEqual(evalRes);
      expect(apiPostFormMock).toHaveBeenCalledTimes(1);
      const [path, formData] = apiPostFormMock.mock.calls[0] as [string, FormData];
      expect(path).toBe("/api/evaluations/batches/LOT-01/units");
      expect(formData.get("image")).toBe(fakeFile);

      const closedBatch = {
        id: 1,
        code: "LOT-01",
        captureDate: "2026-11-15",
        weightKg: 12,
        sampleUnitCount: 2,
        notes: null,
        evaluationCount: 2,
        finalClassification: 2,
        statusCode: "EVALUADO",
      };
      apiPostMock.mockResolvedValueOnce(closedBatch);
      expect(await closeEvaluation("LOT-01")).toEqual(closedBatch);
      expect(apiPostMock).toHaveBeenCalledWith("/api/evaluations/batches/LOT-01/close", {});
    });
  });

  describe("reportService", () => {
    it("ejecuta consultas, guardado, exportación PDF, eliminación lógica y descarga saveFile", async () => {
      const reportDetail = {
        reportId: 7,
        version: 1,
        batchCode: "LOT-01",
        captureDate: "2026-11-15",
        weightKg: 12,
        sampleUnitCount: 2,
        notes: null,
        statistics: {
          evaluationCount: 2,
          finalClassification: 2,
          eyeAverage: 2,
          skinAverage: 2,
          countByCategory: { "2": 2 },
        },
        units: [],
        chartImage: null,
      };
      const summary = {
        id: 7,
        batchCode: "LOT-01",
        version: 1,
        current: true,
        finalClassification: 2,
        generatedAt: "2026-11-15T12:10:00Z",
      };

      apiGetMock.mockResolvedValueOnce(reportDetail);
      expect(await getBatchReport("LOT-01")).toEqual(reportDetail);
      expect(apiGetMock).toHaveBeenCalledWith("/api/reports/batches/LOT-01");

      apiPostMock.mockResolvedValueOnce(summary);
      expect(await saveReport("LOT-01")).toEqual(summary);
      expect(apiPostMock).toHaveBeenCalledWith("/api/reports/batches/LOT-01");

      apiGetMock.mockResolvedValueOnce([summary]);
      expect(await listSavedReports()).toEqual([summary]);
      expect(apiGetMock).toHaveBeenCalledWith("/api/reports");

      apiGetMock.mockResolvedValueOnce(reportDetail);
      expect(await getSavedReport(7)).toEqual(reportDetail);
      expect(apiGetMock).toHaveBeenCalledWith("/api/reports/7");

      const pdfBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
      apiGetBlobMock.mockResolvedValueOnce({ blob: pdfBlob, filename: "reporte-LOT-01-v1.pdf" });
      expect(await downloadReportPdf(7)).toEqual({
        blob: pdfBlob,
        filename: "reporte-LOT-01-v1.pdf",
      });
      expect(apiGetBlobMock).toHaveBeenCalledWith("/api/reports/7/pdf");

      apiDeleteMock.mockResolvedValueOnce(undefined);
      await requestDeleteReport(7);
      expect(apiDeleteMock).toHaveBeenCalledWith("/api/reports/7");

      // Verificar saveFile con stubs de DOM y URL
      const anchor = {
        href: "",
        download: "",
        style: { display: "" },
        click: vi.fn(),
      };
      const appendChildMock = vi.fn();
      const removeChildMock = vi.fn();
      const createObjectUrlMock = vi.fn(() => "blob:secct/report.pdf");
      const revokeObjectUrlMock = vi.fn();
      const timeoutMock = vi.fn((cb: () => void) => {
        cb();
        return 1;
      });

      vi.stubGlobal("document", {
        createElement: vi.fn(() => anchor),
        body: { appendChild: appendChildMock, removeChild: removeChildMock },
      });
      vi.stubGlobal("window", { setTimeout: timeoutMock });
      vi.stubGlobal("URL", {
        createObjectURL: createObjectUrlMock,
        revokeObjectURL: revokeObjectUrlMock,
      });

      saveFile(pdfBlob, "fallback.pdf");

      expect(createObjectUrlMock).toHaveBeenCalledWith(pdfBlob);
      expect(anchor.download).toBe("fallback.pdf");
      expect(appendChildMock).toHaveBeenCalledWith(anchor);
      expect(anchor.click).toHaveBeenCalledTimes(1);
      expect(removeChildMock).toHaveBeenCalledWith(anchor);
      expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:secct/report.pdf");
    });
  });

  describe("adminService", () => {
    it("consulta las métricas globales desde /api/admin/system-info", async () => {
      const info = { totalUsers: 12, totalBatches: 34, totalEvaluations: 120 };
      apiGetMock.mockResolvedValueOnce(info);
      expect(await getSystemInfo()).toEqual(info);
      expect(apiGetMock).toHaveBeenCalledWith("/api/admin/system-info");
    });
  });
});
