import SideNav from "../components/SideNav";
import { getRoleCode, getUserEmail } from "../services/authStorage";

/**
 * Admin panel page enforcing role check and displaying 403 Acceso Denegado for non-administrators (PL-2.15).
 */
export default function AdminPage() {
  const roleCode = getRoleCode();
  const userEmail = getUserEmail();

  // PL-2.15: If role is not ADMINISTRADOR, block access and display 403 Acceso Denegado
  if (roleCode !== "ADMINISTRADOR") {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <SideNav current="admin" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div
            id="access-denied-card"
            className="max-w-lg w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-red-950/30"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-4xl">
              🚫
            </div>
            <span
              id="status-403-badge"
              className="px-3 py-1 bg-red-950 text-red-400 border border-red-500/40 rounded-full text-xs font-black uppercase tracking-widest inline-block mb-3"
            >
              Estado 403
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              Acceso denegado
            </h1>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              No tienes los permisos requeridos para acceder al panel de administración del sistema SECCT.
              Este módulo está restringido exclusivamente a usuarios con rol{" "}
              <strong className="text-purple-400">ADMINISTRADOR</strong>.
            </p>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400 mb-6 text-left">
              <p>
                <strong className="text-slate-200">Usuario:</strong> {userEmail ?? "Desconocido"}
              </p>
              <p>
                <strong className="text-slate-200">Rol detectado:</strong>{" "}
                <span className="text-cyan-400 font-semibold">{roleCode ?? "SIN ROL"}</span>
              </p>
            </div>
            <a
              href="#/register"
              id="return-to-batches-button"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 font-bold hover:from-cyan-400 hover:to-sky-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              Volver a gestión de lotes
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <SideNav current="admin" />
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <header className="mb-8 border-b border-sky-500/20 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Panel de Administración
            </h1>
            <p className="text-sky-300/70 text-sm mt-1">
              Supervisión de usuarios, auditoría y métricas de calidad de tilapia.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-purple-950 text-purple-300 border border-purple-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
              Rol: {roleCode}
            </span>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-slate-900 border border-sky-500/20 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400 font-medium">Gestión de Usuarios</span>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-2xl font-black text-white">Usuarios Activos</p>
            <p className="text-xs text-sky-400 mt-2">
              <a href="#/registro" className="underline hover:text-cyan-300">
                Registrar nuevo usuario piscicultor →
              </a>
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-sky-500/20 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400 font-medium">Trazabilidad</span>
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-2xl font-black text-white">Eventos de Auditoría</p>
            <p className="text-xs text-sky-400 mt-2">Registro de inicios de sesión y operaciones</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-sky-500/20 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400 font-medium">Calidad Tilapia</span>
              <span className="text-2xl">🐟</span>
            </div>
            <p className="text-2xl font-black text-white">Modelo CNN ResNet</p>
            <p className="text-xs text-emerald-400 mt-2">Inferencia activa para ojo y piel</p>
          </div>
        </div>
      </main>
    </div>
  );
}
