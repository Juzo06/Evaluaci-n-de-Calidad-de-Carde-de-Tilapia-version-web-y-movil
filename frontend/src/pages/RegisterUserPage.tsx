import { useState } from "react";
import UserRegistrationForm from "../components/UserRegistrationForm";
import UserRegistrationResultCard from "../components/UserRegistrationResultCard";
import { apiPost } from "../services/apiClient";
import type { RegisterUserRequestDTO, RegisterUserResponseDTO } from "../types/auth";

export default function RegisterUserPage() {
  const [registeredUser, setRegisteredUser] = useState<RegisterUserResponseDTO | null>(null);

  /**
   * Implements submitRegistration from DC-HU1 diagram using apiPost based on fetch.
   */
  async function submitRegistration(request: RegisterUserRequestDTO): Promise<void> {
    const response = await apiPost<RegisterUserRequestDTO, RegisterUserResponseDTO>("/api/users", request);
    showRegistrationResult(response);
  }

  /**
   * Implements showRegistrationResult from DC-HU1 diagram.
   */
  function showRegistrationResult(response: RegisterUserResponseDTO): void {
    setRegisteredUser(response);
  }

  return (
    <main className="flex flex-col md:flex-row min-h-screen w-full max-w-full overflow-x-hidden bg-[#f3f8fc]">
      {/* Responsive navigation: compact top bar on mobile, sidebar on desktop */}
      <nav
        className="w-full md:w-60 bg-[#0b4f7a] text-white p-4 md:p-7 flex flex-col gap-2 md:gap-3 flex-shrink-0"
        aria-label="Menú principal"
      >
        <div className="flex items-center justify-between md:block">
          <h2 className="text-xl md:text-2xl font-serif md:pb-5 text-white">Calidad de Tilapia</h2>
          <span className="md:hidden text-xs bg-[#13608f] px-2.5 py-1 rounded-full font-semibold">
            SECCT
          </span>
        </div>

        <div className="flex flex-wrap md:flex-col gap-1.5 pt-2">
          <a
            href="#/registro"
            aria-current="page"
            className="text-sm px-3.5 py-2.5 rounded-xl transition-colors font-semibold bg-white text-[#0b4f7a]"
          >
            Registrar usuario
          </a>
          <a
            href="#/register"
            className="text-sm px-3.5 py-2.5 rounded-xl transition-colors text-white hover:bg-[#13608f]"
          >
            Registrar lote
          </a>
          <a
            href="#/evaluate"
            className="text-sm px-3.5 py-2.5 rounded-xl transition-colors text-white hover:bg-[#13608f]"
          >
            Evaluar lote
          </a>
        </div>
      </nav>

      {/* Main content area: responsive padding without horizontal overflow (PS-04) */}
      <section className="flex-1 p-4 sm:p-6 md:p-9 flex flex-col gap-5 w-full max-w-full overflow-x-hidden">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#0b3a5a]">
              Registrar usuario
            </h1>
            <p className="text-[#4d6a80] text-sm mt-1">
              Crea una cuenta para piscicultores y gestiona la trazabilidad de tus lotes.
            </p>
          </div>
          <span className="bg-[#dcebf6] text-[#0b4f7a] text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0">
            Rol: Piscicultor
          </span>
        </header>

        {registeredUser ? (
          <UserRegistrationResultCard
            user={registeredUser}
            onRegisterAnother={() => setRegisteredUser(null)}
          />
        ) : (
          <UserRegistrationForm onSubmit={submitRegistration} />
        )}
      </section>
    </main>
  );
}
