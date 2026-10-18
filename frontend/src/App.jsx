import { useState } from 'react'
import RegistrarLote from './components/RegistrarLote.jsx'

const MENU = [
  { texto: 'Registrar lote', activo: true },
  { texto: 'Evaluar lote' },
  { texto: 'Lotes evaluados' },
  { texto: 'Cerrar sesión' },
]

export default function App() {
  // TEMPORAL: usuario demo (V3). Se reemplaza cuando exista el login.
  const [usuarioId, setUsuarioId] = useState('1')

  return (
    <div className="min-h-screen md:grid md:grid-cols-[300px_1fr]">
      <nav aria-label="Menú principal" className="bg-marino px-4 py-6 text-white">
        <h3 className="px-4 pb-6 font-titulo text-3xl leading-tight">Calidad de Tilapia</h3>
        <ul className="flex flex-wrap gap-2 md:flex-col md:gap-3">
          {MENU.map((item) => (
            <li key={item.texto}>
              <span
                aria-current={item.activo ? 'page' : undefined}
                className={
                  'block rounded-2xl px-4 py-3 text-lg ' +
                  (item.activo ? 'bg-white font-semibold text-marino' : 'text-white/80')
                }
              >
                {item.texto}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <main className="px-6 py-8 md:px-12">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <hgroup>
            <h1 className="font-titulo text-4xl text-marino">Registrar lote</h1>
            <p className="mt-1 text-suave">Identifica tu lote para llevar su trazabilidad.</p>
          </hgroup>
          <span className="rounded-full bg-[#dcebf6] px-4 py-2 text-sm font-semibold text-marino">[Nombre Apellido]</span>
        </header>

        {/* key: al cambiar de piscicultor se reinicia el formulario y su lista */}
        <RegistrarLote key={usuarioId} usuarioId={usuarioId} />
      </main>
    </div>
  )
}
