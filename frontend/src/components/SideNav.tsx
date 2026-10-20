import React, { useState } from "react";
import { logout } from "../services/authService";
import {
  getRoleCode,
  getUserEmail,
  removeLocalToken as clearStoredSession,
} from "../services/authStorage";

export type SideNavPage = "register" | "evaluate" | "registro" | "admin" | "evaluated";

interface SideNavProps {
  current?: SideNavPage;
}

/**
 * Navigation sidebar implementing DC-HU2, DS-HU2-logout, and role-based links.
 */
export default function SideNav({ current }: SideNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const roleCode = getRoleCode();
  const userEmail = getUserEmail();

  // DC-HU2 explicit method: removeLocalToken(): void
  const removeLocalToken = (): void => {
    clearStoredSession();
  };

  // DC-HU2 explicit method: submitLogout(): void (DS-HU2-logout, PS-07, CN-10)
  const submitLogout = async (): Promise<void> => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Even if network or server fails, ensure local session is cleared
    } finally {
      removeLocalToken();
      // PS-07, CN-10: replace history so back button does not show private views
      window.location.replace("#/login");
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-sky-500/20 flex flex-col justify-between p-4 min-h-screen text-slate-200">
      <div>
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-2 py-4 mb-6 border-b border-sky-500/20">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-sky-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
            🐟
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">SECCT Tilapia</h2>
            <p className="text-xs text-sky-400/80">Evaluación de Calidad</p>
          </div>
        </div>

        {/* User Badge */}
        {userEmail && (
          <div className="mb-6 p-3 rounded-xl bg-slate-800/80 border border-sky-500/20">
            <p className="text-xs text-slate-400">Usuario activo</p>
            <p className="text-sm font-semibold text-white truncate">{userEmail}</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase ${
                roleCode === "ADMINISTRADOR"
                  ? "bg-purple-950/80 text-purple-300 border border-purple-500/40"
                  : "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40"
              }`}
            >
              {roleCode ?? "USUARIO"}
            </span>
          </div>
        )}

        {/* Navigation links based on role */}
        <nav className="space-y-1.5" aria-label="Menú principal">
          {roleCode === "ADMINISTRADOR" ? (
            <>
              <a
                href="#/admin"
                id="nav-admin-link"
                aria-current={current === "admin" ? "page" : undefined}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  current === "admin"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <span>📊</span>
                <span>Panel Administrador</span>
              </a>
              <a
                href="#/registro"
                id="nav-registro-link"
                aria-current={current === "registro" ? "page" : undefined}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  current === "registro"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <span>👤</span>
                <span>Registrar usuario</span>
              </a>
            </>
          ) : (
            <>
              <a
                href="#/register"
                id="nav-register-batch-link"
                aria-current={current === "register" ? "page" : undefined}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  current === "register"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <span>📦</span>
                <span>Registrar lote</span>
              </a>
              <a
                href="#/evaluate"
                id="nav-evaluate-batch-link"
                aria-current={current === "evaluate" ? "page" : undefined}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  current === "evaluate"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <span>🔬</span>
                <span>Evaluar lote</span>
              </a>
              <a
                href="#/registro"
                id="nav-registro-user-link"
                aria-current={current === "registro" ? "page" : undefined}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  current === "registro"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <span>👤</span>
                <span>Registrar usuario</span>
              </a>
            </>
          )}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="pt-4 border-t border-sky-500/20">
        <button
          type="button"
          id="nav-logout-button"
          onClick={submitLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoggingOut ? (
            <span>Cerrando sesión...</span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Cerrar sesión</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
