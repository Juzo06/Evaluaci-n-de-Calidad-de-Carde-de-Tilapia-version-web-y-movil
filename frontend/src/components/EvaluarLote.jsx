import { useEffect, useState } from 'react'
import {
  cerrarEvaluacion,
  evaluarUnidad,
  listarLotesDisponibles,
  obtenerDetalleLote,
} from '../api/evaluaciones'

export default function EvaluarLote({ usuarioId }) {
  const [lotes, setLotes] = useState([])
  const [loteSeleccionado, setLoteSeleccionado] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [aviso, setAviso] = useState(null)

  const cargarDisponibles = async () => {
    try {
      const data = await listarLotesDisponibles(usuarioId)
      setLotes(data)
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message })
    }
  }

  useEffect(() => {
    cargarDisponibles()
  }, [usuarioId])

  const seleccionarLote = async (codigo) => {
    setAviso(null)
    setLoteSeleccionado(codigo)
    setArchivo(null)
    if (!codigo) {
      setDetalle(null)
      return
    }
    try {
      const data = await obtenerDetalleLote(usuarioId, codigo)
      setDetalle(data)
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message })
    }
  }

  const handleSubirImagen = async (e) => {
    e.preventDefault()
    if (!archivo || !loteSeleccionado) return

    setProcesando(true)
    setAviso(null)

    try {
      await evaluarUnidad(usuarioId, loteSeleccionado, archivo)
      setArchivo(null)
      await seleccionarLote(loteSeleccionado)
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message })
    } finally {
      setProcesando(false)
    }
  }

  const handleCerrar = async () => {
    if (!loteSeleccionado) return
    setProcesando(true)
    setAviso(null)

    try {
      const res = await cerrarEvaluacion(usuarioId, loteSeleccionado)
      setAviso({
        tipo: 'ok',
        texto: `${res.mensaje} Clasificación final asignada: ${Number(res.clasificacionFinal).toFixed(2)}`,
      })
      setDetalle(null)
      setLoteSeleccionado('')
      cargarDisponibles()
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message })
    } finally {
      setProcesando(false)
    }
  }

  const unidadesClasificadas = detalle?.unidadesEvaluadas || 0
  const totalUnidades = detalle?.numero_unidades_muestra || 0
  const completado = totalUnidades > 0 && unidadesClasificadas >= totalUnidades

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="font-titulo text-4xl text-marino">Evaluar lote</h1>
        <p className="mt-1 text-suave">Carga una imagen por unidad y el sistema la clasifica.</p>
      </header>

      {aviso && (
        <p
          className={
            'max-w-[860px] rounded-2xl px-4 py-3 font-semibold ' +
            (aviso.tipo === 'ok' ? 'bg-[#dff3e6] text-[#1b5e35]' : 'bg-[#fbe4e2] text-error')
          }
        >
          {aviso.texto}
        </p>
      )}

      <section className="flex flex-col gap-5 lg:flex-row max-w-[1100px]">
        {/* Columna Izquierda: Formulario de Carga */}
        <form
          onSubmit={handleSubirImagen}
          className="flex w-full flex-col gap-4 rounded-[2rem] border border-borde/60 bg-white/70 p-6 lg:w-[420px]"
        >
          <div>
            <label htmlFor="loteSelect" className="mb-2 block text-lg font-semibold text-marino">
              Lote disponible
            </label>
            <select
              id="loteSelect"
              value={loteSeleccionado}
              onChange={(e) => seleccionarLote(e.target.value)}
              className="w-full rounded-2xl border border-borde bg-white px-4 py-3 text-base outline-none focus:border-marino"
            >
              <option value="">-- Seleccionar Lote --</option>
              {lotes.map((l) => (
                <option key={l.codigo} value={l.codigo}>
                  [{l.codigo}]
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-borde p-6 text-center bg-white/50">
            <p className="text-sm font-semibold text-marino">Arrastra una imagen aquí o selecciónala</p>
            <p className="mt-1 text-xs text-suave">JPG o PNG, máximo 5 MB</p>
            <input
              type="file"
              accept="image/jpeg,image/png"
              disabled={!loteSeleccionado || completado || procesando}
              onChange={(e) => setArchivo(e.target.files[0])}
              className="mt-3 w-full text-sm text-suave file:mr-3 file:rounded-xl file:border-0 file:bg-marino/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-marino"
            />
          </div>

          <small className="text-sm text-suave">
            Unidades clasificadas: {unidadesClasificadas} de {totalUnidades}
          </small>

          <button
            type="submit"
            disabled={!archivo || !loteSeleccionado || completado || procesando}
            className="rounded-2xl border-2 border-marino px-6 py-3 text-base font-semibold text-marino hover:bg-marino/5 disabled:opacity-50"
          >
            {procesando ? 'Procesando...' : 'Cargar imagen'}
          </button>
        </form>

        {/* Columna Derecha: Tabla de Resultados y Cierre */}
        <article className="flex-1 rounded-[2rem] border border-borde/60 bg-white/70 p-6 flex flex-col justify-between">
          <div>
            <h2 className="mb-4 font-titulo text-2xl text-marino">Resultado por unidad</h2>

            {!detalle || !detalle.evaluaciones || detalle.evaluaciones.length === 0 ? (
              <p className="text-suave py-8 text-center">
                Selecciona un lote y carga imágenes para ver la clasificación por unidad.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-borde/60 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-borde/60 bg-gray-50 text-suave">
                    <tr>
                      <th className="px-4 py-3 font-semibold">UNIDAD</th>
                      <th className="px-4 py-3 font-semibold">OJO</th>
                      <th className="px-4 py-3 font-semibold">PIEL</th>
                      <th className="px-4 py-3 font-semibold">CONFIANZA (0 a 1)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.evaluaciones.map((e, idx) => (
                      <tr key={e.id} className="border-b border-borde/40 last:border-0">
                        <td className="px-4 py-3 font-semibold">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-marino/10 px-2 py-1 text-xs font-semibold text-marino">
                            Categoría {e.categoria_unidad || 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-marino/10 px-2 py-1 text-xs font-semibold text-marino">
                            Categoría {e.categoria_unidad || 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono">0,9500</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-borde/60 space-y-4">
            <small className="block text-xs text-suave">
              Finalizar evaluación se habilita cuando todas las unidades están clasificadas. Al finalizar, el lote pasa a EVALUADO y se calcula su clasificación final: [{detalle?.clasificacion_final ? Number(detalle.clasificacion_final).toFixed(2) : '0,00'}].
            </small>

            <footer className="flex justify-end">
              <button
                type="button"
                onClick={handleCerrar}
                disabled={!completado || procesando}
                className="rounded-2xl bg-marino px-8 py-3 text-base font-semibold text-white hover:bg-marino-oscuro disabled:opacity-50"
              >
                Finalizar evaluación
              </button>
            </footer>
          </div>
        </article>
      </section>
    </div>
  )
}