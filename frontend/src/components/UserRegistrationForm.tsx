import { useState } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import type { RegisterUserFormField, RegisterUserFormValues, RegisterUserRequestDTO } from "../types/auth";
import { ApiError } from "../services/apiClient";
import { toRegisterUserRequest, validateAuthForm } from "../validation/authValidation";
import type { AuthFormErrors } from "../validation/authValidation";

interface UserRegistrationFormProps {
  onSubmit: (request: RegisterUserRequestDTO) => Promise<void>;
  onCancel?: () => void;
}

const emptyValues: RegisterUserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const knownFields: RegisterUserFormField[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "password",
  "confirmPassword",
];

export default function UserRegistrationForm({ onSubmit, onCancel }: UserRegistrationFormProps) {
  const [values, setValues] = useState<RegisterUserFormValues>(emptyValues);
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as RegisterUserFormField;
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    // Clear field-specific error upon typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleReset() {
    setValues(emptyValues);
    setErrors({});
    setFormError(null);
    if (onCancel) {
      onCancel();
    }
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validateAuthForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // PQ-11: Disable button during in-flight request to prevent double submit
    setIsSubmitting(true);
    try {
      await onSubmit(toRegisterUserRequest(values));
    } catch (error) {
      if (error instanceof ApiError) {
        const serverErrors: AuthFormErrors = {};
        for (const fieldError of error.fieldErrors) {
          if (knownFields.includes(fieldError.field as RegisterUserFormField)) {
            serverErrors[fieldError.field as RegisterUserFormField] = fieldError.message;
          }
        }
        setErrors(serverErrors);
        setFormError(error.message);
      } else {
        setFormError("Ocurrió un error inesperado al registrar el usuario. Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderError(field: RegisterUserFormField) {
    const message = errors[field];
    if (!message) return null;
    return (
      <small id={`${field}Error`} role="alert" className="text-red-600 font-semibold text-xs mt-1">
        {message}
      </small>
    );
  }

  function describedBy(field: RegisterUserFormField): string {
    return errors[field] ? `${field}Error` : `${field}Hint`;
  }

  return (
    <section className="card w-full max-w-[860px] mx-auto p-4 sm:p-7 md:p-8 overflow-hidden">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5 w-full"
        aria-label="Formulario de registro de usuario"
      >
        {formError && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formError}</span>
          </div>
        )}

        {/* Responsive grid: 1 column on mobile (>=360px), 2 columns on tablet/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
          {/* Nombres */}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#0b3a5a]">
            <span>Nombres <span className="text-red-500">*</span></span>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              autoComplete="given-name"
              placeholder="Ej. Juan Carlos"
              value={values.firstName}
              onChange={handleChange}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={describedBy("firstName")}
              className={`w-full h-12 px-3.5 rounded-xl border bg-white transition-colors outline-none focus:ring-2 focus:ring-[#0b4f7a] ${
                errors.firstName ? "border-red-500" : "border-[#8fb0c9]"
              }`}
            />
            {renderError("firstName")}
          </label>

          {/* Apellidos */}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#0b3a5a]">
            <span>Apellidos <span className="text-red-500">*</span></span>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              autoComplete="family-name"
              placeholder="Ej. Pérez Gómez"
              value={values.lastName}
              onChange={handleChange}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={describedBy("lastName")}
              className={`w-full h-12 px-3.5 rounded-xl border bg-white transition-colors outline-none focus:ring-2 focus:ring-[#0b4f7a] ${
                errors.lastName ? "border-red-500" : "border-[#8fb0c9]"
              }`}
            />
            {renderError("lastName")}
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
          {/* Correo */}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#0b3a5a]">
            <span>Correo electrónico <span className="text-red-500">*</span></span>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="piscicultor@correo.com"
              value={values.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy("email")}
              className={`w-full h-12 px-3.5 rounded-xl border bg-white transition-colors outline-none focus:ring-2 focus:ring-[#0b4f7a] ${
                errors.email ? "border-red-500" : "border-[#8fb0c9]"
              }`}
            />
            {renderError("email")}
          </label>

          {/* Teléfono */}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#0b3a5a]">
            <span>Teléfono celular <span className="text-red-500">*</span></span>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="3101234567"
              value={values.phone}
              onChange={handleChange}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy("phone")}
              className={`w-full h-12 px-3.5 rounded-xl border bg-white transition-colors outline-none focus:ring-2 focus:ring-[#0b4f7a] ${
                errors.phone ? "border-red-500" : "border-[#8fb0c9]"
              }`}
            />
            {renderError("phone")}
          </label>
        </div>

        {/* PE-12: Ambos campos deben usar type="password" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
          {/* Contraseña */}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#0b3a5a]">
            <span>Contraseña <span className="text-red-500">*</span></span>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={values.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={describedBy("password")}
              className={`w-full h-12 px-3.5 rounded-xl border bg-white transition-colors outline-none focus:ring-2 focus:ring-[#0b4f7a] ${
                errors.password ? "border-red-500" : "border-[#8fb0c9]"
              }`}
            />
            {renderError("password")}
          </label>

          {/* Confirmar contraseña */}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#0b3a5a]">
            <span>Confirmar contraseña <span className="text-red-500">*</span></span>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              value={values.confirmPassword}
              onChange={handleChange}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={describedBy("confirmPassword")}
              className={`w-full h-12 px-3.5 rounded-xl border bg-white transition-colors outline-none focus:ring-2 focus:ring-[#0b4f7a] ${
                errors.confirmPassword ? "border-red-500" : "border-[#8fb0c9]"
              }`}
            />
            {renderError("confirmPassword")}
          </label>
        </div>

        {/* Buttons: PQ-11 disabled during request */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4 pt-3 border-t border-[#e6eef5]">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="o h-12 px-6 rounded-xl border border-[#0b4f7a] text-[#0b4f7a] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="p h-12 px-8 rounded-xl bg-[#0b4f7a] hover:bg-[#083a5a] text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Registrando...</span>
              </>
            ) : (
              "Registrar usuario"
            )}
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-[#4d6a80]">
          ¿Ya tienes una cuenta?{" "}
          <a
            href="#/login"
            id="register-to-login-link"
            className="text-[#0b4f7a] font-semibold underline underline-offset-4 hover:text-[#083a5a]"
          >
            Inicia sesión aquí
          </a>
        </div>
      </form>
    </section>
  );
}
