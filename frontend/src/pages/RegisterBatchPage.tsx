import { useState } from "react";
import BatchRegistrationForm from "../components/BatchRegistrationForm";
import BatchResultCard from "../components/BatchResultCard";
import { registerBatch } from "../services/batchService";
import type { BatchResponseDTO, RegisterBatchRequestDTO } from "../types/batch";

import SideNav from "../components/SideNav";

export default function RegisterBatchPage() {
  const [registeredBatch, setRegisteredBatch] = useState<BatchResponseDTO | null>(null);

  async function submitBatchRegistration(request: RegisterBatchRequestDTO): Promise<void> {
    const response = await registerBatch(request);
    showBatchResult(response);
  }

  function showBatchResult(response: BatchResponseDTO): void {
    setRegisteredBatch(response);
  }

  return (
    <main className="app">
      <SideNav current="register" />
      <section className="main">
        <header className="top">
          <hgroup>
            <h1 style={{ fontSize: "36px" }}>Registrar lote</h1>
            <p style={{ margin: "4px 0 0" }}>Identifica tu lote para llevar su trazabilidad.</p>
          </hgroup>
          <span className="badge">[Nombre Apellido]</span>
        </header>
        {registeredBatch ? (
          <BatchResultCard batch={registeredBatch} onRegisterAnother={() => setRegisteredBatch(null)} />
        ) : (
          <BatchRegistrationForm onSubmit={submitBatchRegistration} />
        )}
      </section>
    </main>
  );
}
