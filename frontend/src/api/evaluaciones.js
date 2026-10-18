export class ApiError extends Error {
  constructor(status, cuerpo) {
    super(cuerpo?.mensaje ?? `Error ${status}`)
    this.status = status
  }
}

function encabezados(usuarioId) {
  return {
    'X-Usuario-Id': String(usuarioId),
  }
}

async function leerRespuesta(res) {
  const cuerpo = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, cuerpo)
  return cuerpo
}

export async function listarLotesDisponibles(usuarioId) {
  const res = await fetch('/api/evaluaciones/lotes-disponibles', {
    headers: encabezados(usuarioId),
  })
  return leerRespuesta(res)
}

export async function obtenerDetalleLote(usuarioId, codigo) {
  const res = await fetch(`/api/evaluaciones/lotes/${codigo}`, {
    headers: encabezados(usuarioId),
  })
  return leerRespuesta(res)
}

export async function evaluarUnidad(usuarioId, codigo, archivoImagen) {
  const formData = new FormData()
  formData.append('imagen', archivoImagen)

  const res = await fetch(`/api/evaluaciones/lotes/${codigo}/evaluar`, {
    method: 'POST',
    headers: encabezados(usuarioId),
    body: formData,
  })
  return leerRespuesta(res)
}

export async function cerrarEvaluacion(usuarioId, codigo) {
  const res = await fetch(`/api/evaluaciones/lotes/${codigo}/cerrar`, {
    method: 'POST',
    headers: encabezados(usuarioId),
  })
  return leerRespuesta(res)
}