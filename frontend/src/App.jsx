import { useState } from 'react'
import RegistrarLote from './components/RegistrarLote.jsx'
import EvaluarLote from './components/EvaluarLote.jsx'

export default function App() {
  // TEMPORAL: usuario demo (V3). Se reemplaza cuando exista el login.
  const [usuarioId, setUsuarioId] = useState('1')
  
  // Estado para la pantalla activa ('registrar' | 'evaluar')
  const [vista, setVista] = useState('registrar')

  const MENU = [
    { id: 'registrar', texto: 'Registrar lote' },
    { id: 'evaluar', texto: 'Evaluar lote' },
    { id: 'evaluados', texto: 'Lotes evaluados', deshabilitado: true },
    { id: 'cerrar', texto: 'Cerrar sesión', deshabilitado: true },
  ]

  return (
    <div className="min-h-screen md:grid md:grid-cols-[300px_1fr]">
      <nav aria-label="Menú principal" className="bg-marino px-4 py-6 text-white">
        <h3 className="px-4 pb-6 font-titulo text-3xl leading-tight">Calidad de Tilapia</h3>
        <ul className="flex flex-wrap gap-2 md:flex-col md:gap-3">
          {MENU.map((item) => {
            const esActivo = vista === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={item.deshabilitado}
                  onClick={() => !item.deshabilitado && setVista(item.id)}
                  aria-current={esActivo ? 'page' : undefined}
                  className={
                    'w-full text-left block rounded-2xl px-4 py-3 text-lg transition-colors ' +
                    (esActivo
                      ? 'bg-white font-semibold text-marino'
                      : item.deshabilitado
                      ? 'text-white/50 cursor-not-allowed'
                      : 'text-white/80 hover:bg-white/10')
                  }
                >
                  {item.texto}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <main className="px-6 py-8 md:px-12">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <hgroup>
            <h1 className="font-titulo text-4xl text-marino">
              {vista === 'registrar' ? 'Registrar lote' : 'Evaluar lote'}
            </h1>
            <p className="mt-1 text-suave">
              {vista === 'registrar'
                ? 'Identifica tu lote para llevar su trazabilidad.'
                : 'Carga una imagen por unidad y el sistema la clasifica.'}
            </p>
          </hgroup>
          <span className="rounded-full bg-[#dcebf6] px-4 py-2 text-sm font-semibold text-marino">
            [Nombre Apellido]
          </span>
        </header>

        {/* Carga dinámica sin alterar la estructura del layout */}
        {vista === 'registrar' && <RegistrarLote key={usuarioId} usuarioId={usuarioId} />}
        {vista === 'evaluar' && <EvaluarLote key={usuarioId} usuarioId={usuarioId} />}
      </main>
    </div>
  )
}