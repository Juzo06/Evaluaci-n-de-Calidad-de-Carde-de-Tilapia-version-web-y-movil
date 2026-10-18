import { useEffect, useState } from 'react'
import { ApiError, listarLotes, registrarLote } from '../api/lotes.js'

const VACIO = {
  fechaCaptura: '',
  peso: '',
  numeroUnidadesMuestra: '',
  observaciones: '',
}

/** Fecha de hoy en hora local (yyyy-MM-dd), para bloquear fechas futuras. */
function hoy() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** "120,50" o "120.5" -> 120.5 ; texto inválido -> NaN */
function aNumeroPeso(texto) {
  return Number(texto.trim().replace(',', '.'))
}

/** Mismas reglas de HU3 que valida el backend. */
function validar(f) {
  const e = {}
  if (!f.fechaCaptura) e.fechaCaptura = 'La fecha de captura es obligatoria'
  else if (f.fechaCaptura > hoy()) e.fechaCaptura = 'La fecha de captura no puede ser futura'

  const texto = f.peso.trim()
  if (!texto) e.peso = 'El peso es obligatorio'
  else if (!/^\d+([.,]\d{1,2})?$/.test(texto)) e.peso = 'Use números con máximo 2 decimales'
  else {
    const peso = aNumeroPeso(texto)
    if (peso <= 0) e.peso = 'Debe ser mayor que 0'
    else if (peso > 10000) e.peso = 'No puede superar 10.000,00'
  }

  if (f.numeroUnidadesMuestra === '') e.numeroUnidadesMuestra = 'Las unidades son obligatorias'
  else {
    const n = Number(f.numeroUnidadesMuestra)
    if (!Number.isInteger(n) || n < 1 || n > 500) e.numeroUnidadesMuestra = 'Entero de 1 a 500'
  }

  if (f.observaciones.length > 500) e.observaciones = 'Máximo 500 caracteres'
  return e
}

function Campo({ id, etiqueta, ayuda, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-lg">
        {etiqueta}
      </label>
      {children}
      <p
        id={`${id}-msg`}
        className={'mt-1.5 text-sm ' + (error ? 'font-semibold text-error' : 'text-suave')}
      >
        {error || ayuda}
      </p>
    </div>
  )
}

const ENTRADA =
  'w-full rounded-2xl border border-borde bg-white px-4 py-3 text-lg outline-none ' +
  'placeholder:text-suave/60 focus:border-marino focus:ring-2 focus:ring-marino/30'

export default function RegistrarLote({ usuarioId }) {
  const [form, setForm] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [lotes, setLotes] = useState([])

  const cargarLotes = () =>
    listarLotes(usuarioId)
      .then(setLotes)
      .catch(() => setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' }))

  useEffect(() => {
    cargarLotes()
  }, [usuarioId])

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const limpiar = () => {
    setForm(VACIO)
    setErrores({})
    setAviso(null)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setAviso(null)

    const locales = validar(form)
    if (Object.keys(locales).length > 0) {
      setErrores(locales)
      return
    }

    setEnviando(true)
    try {
      const creado = await registrarLote(usuarioId, {
        fechaCaptura: form.fechaCaptura,
        peso: aNumeroPeso(form.peso),
        numeroUnidadesMuestra: Number(form.numeroUnidadesMuestra),
        observaciones: form.observaciones.trim() || null,
      })
      setAviso({
        tipo: 'ok',
        texto: `Lote ${creado.codigo} registrado en estado ${creado.estado}.`,
      })
      setForm(VACIO)
      setErrores({})
      cargarLotes()
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const porCampo = {}
        err.errores.forEach((x) => (porCampo[x.campo] = x.mensaje))
        setErrores(porCampo)
        setAviso({ tipo: 'error', texto: err.message })
      } else {
        setAviso({ tipo: 'error', texto: 'No se pudo guardar el lote. Intente de nuevo.' })
      }
    } finally {
      setEnviando(false)
    }
  }

  const propsEntrada = (campo) => ({
    id: campo,
    value: form[campo],
    onChange: cambiar(campo),
    'aria-invalid': errores[campo] ? true : undefined,
    'aria-describedby': `${campo}-msg`,
    className: ENTRADA + (errores[campo] ? ' border-error' : ''),
  })

  return (
    <>
      <section className="max-w-[860px] rounded-[2rem] border border-borde/60 bg-white/70 p-8">
        <form onSubmit={guardar} noValidate className="flex flex-col gap-5">
          <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            <Campo id="fechaCaptura" etiqueta="Fecha de captura" ayuda="No puede ser futura" error={errores.fechaCaptura}>
              <input type="date" max={hoy()} {...propsEntrada('fechaCaptura')} />
            </Campo>
            <Campo id="peso" etiqueta="Peso (kg)" ayuda="Mayor que 0, hasta 2 decimales, máx. 10.000,00" error={errores.peso}>
              <input type="text" inputMode="decimal" placeholder="0,00" {...propsEntrada('peso')} />
            </Campo>
            <Campo id="numeroUnidadesMuestra" etiqueta="Número de unidades de muestra" ayuda="Entero de 1 a 500" error={errores.numeroUnidadesMuestra}>
              <input type="number" min="1" max="500" step="1" {...propsEntrada('numeroUnidadesMuestra')} />
            </Campo>
          </div>

          <Campo id="observaciones" etiqueta="Observaciones (opcional)" ayuda="Máximo 500 caracteres" error={errores.observaciones}>
            <textarea rows={4} placeholder="Máximo 500 caracteres" {...propsEntrada('observaciones')} />
          </Campo>

          <p className="text-sm text-suave">
            El código del lote (máx. 30 caracteres) lo genera el sistema al guardar. El lote queda en estado ABIERTO, disponible para evaluar.
          </p>

          {aviso && (
            <p
              role="status"
              className={
                'rounded-2xl px-4 py-3 font-semibold ' +
                (aviso.tipo === 'ok' ? 'bg-[#dff3e6] text-[#1b5e35]' : 'bg-[#fbe4e2] text-error')
              }
            >
              {aviso.texto}
            </p>
          )}

          <footer className="flex justify-end gap-3">
            <button
              type="button"
              onClick={limpiar}
              className="rounded-2xl border-2 border-marino px-8 py-3 text-lg font-semibold text-marino hover:bg-marino/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-2xl bg-marino px-8 py-3 text-lg font-semibold text-white hover:bg-marino-oscuro disabled:opacity-60"
            >
              {enviando ? 'Guardando…' : 'Guardar lote'}
            </button>
          </footer>
        </form>
      </section>

      <section className="mt-10 max-w-[860px]">
        <h2 className="mb-3 font-titulo text-2xl text-marino">Mis lotes</h2>
        {lotes.length === 0 ? (
          <p className="text-suave">Aún no has registrado lotes.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-borde/60 bg-white/70">
            <table className="w-full text-left">
              <thead className="border-b border-borde/60 text-sm text-suave">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Captura</th>
                  <th className="px-4 py-3 text-right font-semibold">Peso (kg)</th>
                  <th className="px-4 py-3 text-right font-semibold">Unidades</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((l) => (
                  <tr key={l.codigo} className="border-b border-borde/40 last:border-0">
                    <td className="px-4 py-3 font-semibold">{l.codigo}</td>
                    <td className="px-4 py-3">{l.fechaCaptura}</td>
                    <td className="px-4 py-3 text-right">
                      {Number(l.peso).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right">{l.numeroUnidadesMuestra}</td>
                    <td className="px-4 py-3">{l.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}