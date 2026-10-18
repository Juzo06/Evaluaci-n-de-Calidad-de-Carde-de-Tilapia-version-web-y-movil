// Llamadas a los endpoints de Spring Boot (HU3).
// Por ahora el piscicultor se identifica con el encabezado X-Usuario-Id
// (ids 1 y 2 = usuarios demo de la migración V3). Cuando exista el login,
// solo cambia esta función de encabezados.

export class ApiError extends Error {
  constructor(status, cuerpo) {
    super(cuerpo?.mensaje ?? `Error ${status}`)
    this.status = status
    this.errores = cuerpo?.errores ?? [] // [{ campo, mensaje }]
  }
}

function encabezados(usuarioId) {
  return {
    'Content-Type': 'application/json',
    'X-Usuario-Id': String(usuarioId),
  }
}

async function leerRespuesta(res) {
  const cuerpo = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, cuerpo)
  return cuerpo
}

/** POST /api/lotes -> { codigo, estado, mensaje } */
export async function registrarLote(usuarioId, datos) {
  const res = await fetch('/api/lotes', {
    method: 'POST',
    headers: encabezados(usuarioId),
    body: JSON.stringify(datos),
  })
  return leerRespuesta(res)
}

/** GET /api/lotes -> lotes del piscicultor (solo los propios) */
export async function listarLotes(usuarioId) {
  const res = await fetch('/api/lotes', { headers: encabezados(usuarioId) })
  return leerRespuesta(res)
}
