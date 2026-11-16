import { useState } from "react";
import BatchRegistrationForm from "../components/BatchRegistrationForm";
import BatchResultCard from "../components/BatchResultCard";
import { useI18n } from "../i18n/I18nContext";
import { registerBatch } from "../services/batchService";
import { getUserFullName } from "../services/authStorage";
import type { BatchResponseDTO, RegisterBatchRequestDTO } from "../types/batch";
import SideNav from "../components/SideNav";

export default function RegisterBatchPage() {
  const [registeredBatch, setRegisteredBatch] = useState<BatchResponseDTO | null>(null);
  const { t } = useI18n();
  const userFullName = getUserFullName();

  async function submitBatchRegistration(request: RegisterBatchRequestDTO): Promise<void> {
    const response = await registerBatch(request);
    showBatchResult(response);
  }

  function showBatchResult(response: BatchResponseDTO): void {
    setRegisteredBatch(response);
  }

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col md:flex-row bg-[#f4f8fb]">
      <SideNav current="register" />
      <main id="main-content" className="flex-1 min-w-0 w-full max-w-full p-4 sm:p-6 lg:p-10 flex flex-col gap-5">
        <header className="top flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <hgroup>
            <h1 id="register-batch-title" className="text-2xl sm:text-3xl lg:text-[36px] font-serif leading-tight">
              {t("batch.register.title")}
            </h1>
            <p style={{ margin: "4px 0 0" }}>{t("batch.register.subtitle")}</p>
          </hgroup>
          <span aria-label={t("app.authenticatedUser")} className="self-start sm:self-auto shrink-0 max-w-full truncate bg-[#e6eff6] text-[#094b72] px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
            {userFullName}
          </span>
        </header>
        {registeredBatch ? (
          <BatchResultCard batch={registeredBatch} onRegisterAnother={() => setRegisteredBatch(null)} />
        ) : (
          <BatchRegistrationForm onSubmit={submitBatchRegistration} />
        )}
      </main>
    </div>
  );
}
