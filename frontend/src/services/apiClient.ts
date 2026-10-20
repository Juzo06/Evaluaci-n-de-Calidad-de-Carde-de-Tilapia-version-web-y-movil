import type { ErrorResponseDTO, FieldErrorDTO } from "../types/batch";
import { getToken } from "./authStorage";

const baseUrl: string = import.meta.env.VITE_API_URL ?? "";

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

export async function apiPost<TRequest, TResponse>(path: string, body: TRequest): Promise<TResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.", 0);
  }

  if (response.ok) {
    return (await response.json()) as TResponse;
  }

  if (response.status === 401) {
    throw new ApiError("Tu sesión no es válida o expiró. Inicia sesión de nuevo.", 401);
  }

  let errorBody: Partial<ErrorResponseDTO> = {};
  try {
    errorBody = (await response.json()) as Partial<ErrorResponseDTO>;
  } catch {
    // The body is not JSON; the generic message below is used.
  }
  throw new ApiError(
    errorBody.message ?? "No se pudo completar la solicitud.",
    response.status,
    errorBody.errors ?? [],
  );
}

/** HU-04: builds the ApiError for a failed response. */
async function toApiError(response: Response): Promise<ApiError> {
  if (response.status === 401) {
    return new ApiError("Tu sesión no es válida o expiró. Inicia sesión de nuevo.", 401);
  }
  let errorBody: Partial<ErrorResponseDTO> = {};
  try {
    errorBody = (await response.json()) as Partial<ErrorResponseDTO>;
  } catch {
    // The body is not JSON; the generic message below is used.
  }
  return new ApiError(
    errorBody.message ?? "No se pudo completar la solicitud.",
    response.status,
    errorBody.errors ?? [],
  );
}

/** HU-04: GET request that returns the parsed JSON body. */
export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { method: "GET", headers });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.", 0);
  }

  if (response.ok) {
    return (await response.json()) as TResponse;
  }
  throw await toApiError(response);
}

/** HU-04: multipart POST (the browser sets the Content-Type with its boundary). */
export async function apiPostForm<TResponse>(path: string, body: FormData): Promise<TResponse> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { method: "POST", headers, body });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.", 0);
  }

  if (response.ok) {
    return (await response.json()) as TResponse;
  }
  throw await toApiError(response);
}
