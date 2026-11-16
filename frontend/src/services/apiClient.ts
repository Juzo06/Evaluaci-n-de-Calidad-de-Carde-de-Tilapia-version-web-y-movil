import { Capacitor } from "@capacitor/core";
import type { ErrorResponseDTO, FieldErrorDTO } from "../types/batch";
import { getToken, removeLocalToken } from "./authStorage";

const DEFAULT_NATIVE_API_BASE_URL = "http://localhost:8080";

function joinBaseUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function resolveApiUrl(path: string): string {
  const configuredBaseUrl = (
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    ""
  ).trim();
  if (configuredBaseUrl) {
    return joinBaseUrl(configuredBaseUrl, path);
  }

  if (Capacitor.isNativePlatform()) {
    const storedBaseUrl =
      typeof localStorage !== "undefined" ? localStorage.getItem("secct_api_base_url") : null;
    const nativeBaseUrl = storedBaseUrl?.trim() || DEFAULT_NATIVE_API_BASE_URL;
    return joinBaseUrl(nativeBaseUrl, path);
  }

  return path;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrorDTO[];

  constructor(message: string, status: number, fieldErrors: FieldErrorDTO[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Handles 401 Unauthorized responses according to PS-06.
 */
function handleUnauthorized(path: string): void {
  removeLocalToken();
  if (!path.includes("/api/auth/login")) {
    window.location.replace("#/login");
  }
}

async function extractError(response: Response, path: string): Promise<ApiError> {
  if (response.status === 401) {
    handleUnauthorized(path);
  }

  let errorBody: Partial<ErrorResponseDTO> = {};
  try {
    errorBody = (await response.json()) as Partial<ErrorResponseDTO>;
  } catch {
    // Non-JSON response
  }

  const defaultMessage =
    response.status === 401
      ? "Tu sesión no es válida o expiró. Inicia sesión de nuevo."
      : "No se pudo completar la solicitud.";

  return new ApiError(
    errorBody.message ?? defaultMessage,
    response.status,
    errorBody.errors ?? [],
  );
}

function buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function performFetch(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(resolveApiUrl(path), init);
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.", 0);
  }
}

export async function apiPost<TRequest, TResponse>(path: string, body?: TRequest): Promise<TResponse> {
  const headers = buildHeaders({ "Content-Type": "application/json" });
  const response = await performFetch(path, {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.ok) {
    if (response.status === 204) {
      return undefined as TResponse;
    }
    return (await response.json()) as TResponse;
  }

  throw await extractError(response, path);
}

/**
 * GET request attaching Authorization header (PI-04) and handling 401 redirection (PS-06).
 */
export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const headers = buildHeaders();
  const response = await performFetch(path, { method: "GET", headers });

  if (response.ok) {
    if (response.status === 204) {
      return undefined as TResponse;
    }
    return (await response.json()) as TResponse;
  }

  throw await extractError(response, path);
}

/**
 * DELETE request attaching Authorization header and handling 204 No Content.
 */
export async function apiDelete<TResponse = void>(path: string): Promise<TResponse> {
  const headers = buildHeaders();
  const response = await performFetch(path, { method: "DELETE", headers });

  if (response.ok) {
    if (response.status === 204) {
      return undefined as TResponse;
    }
    return (await response.json()) as TResponse;
  }

  throw await extractError(response, path);
}

/**
 * Binary PDF GET request extracting optional Content-Disposition filename.
 */
export async function apiGetBlob(path: string): Promise<{ blob: Blob; filename: string | null }> {
  const headers = buildHeaders({ Accept: "application/pdf" });
  const response = await performFetch(path, { method: "GET", headers });

  if (!response.ok) {
    throw await extractError(response, path);
  }

  const disposition = response.headers.get("Content-Disposition");
  let filename: string | null = null;
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";\r\n]+)/i);
    if (match?.[1]) {
      const cleaned = match[1].trim().replace(/^"|"$/g, "");
      try {
        filename = decodeURIComponent(cleaned);
      } catch {
        filename = cleaned;
      }
    }
  }

  return { blob: await response.blob(), filename };
}

/**
 * Multipart POST request (HU-04) attaching token and handling 401.
 */
export async function apiPostForm<TResponse>(path: string, body: FormData): Promise<TResponse> {
  const headers = buildHeaders();
  const response = await performFetch(path, { method: "POST", headers, body });

  if (response.ok) {
    return (await response.json()) as TResponse;
  }

  throw await extractError(response, path);
}
