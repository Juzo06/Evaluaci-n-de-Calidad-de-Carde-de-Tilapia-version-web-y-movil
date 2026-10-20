import type { RegisterUserFormField, RegisterUserFormValues, RegisterUserRequestDTO } from "../types/auth";

export type AuthFormErrors = Partial<Record<RegisterUserFormField, string>>;

const NAME_PATTERN = /^(?!\s+$)[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]{2,50}$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_PATTERN = /^3\d{9}$/;

/**
 * Validates registration form values according to DC-HU1 and cases PL-1.01 to PL-1.26.
 */
export function validateAuthForm(values: RegisterUserFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};

  // 1. Nombres (2-50 letras y espacios, no solo espacios)
  const firstName = values.firstName.trim();
  if (!firstName) {
    errors.firstName = "El nombre es obligatorio";
  } else if (!NAME_PATTERN.test(values.firstName)) {
    errors.firstName = "El nombre debe tener entre 2 y 50 letras y espacios";
  }

  // 2. Apellidos (2-50 letras y espacios, no solo espacios)
  const lastName = values.lastName.trim();
  if (!lastName) {
    errors.lastName = "El apellido es obligatorio";
  } else if (!NAME_PATTERN.test(values.lastName)) {
    errors.lastName = "El apellido debe tener entre 2 y 50 letras y espacios";
  }

  // 3. Correo (6-100 caracteres con formato válido tras trim())
  const trimmedEmail = values.email.trim();
  if (!trimmedEmail) {
    errors.email = "El correo es obligatorio";
  } else if (trimmedEmail.length < 6 || trimmedEmail.length > 100) {
    errors.email = "El correo debe tener entre 6 y 100 caracteres";
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "El formato de correo no es válido";
  }

  // 4. Teléfono (10 dígitos numéricos que inicien en 3)
  const trimmedPhone = values.phone.trim();
  if (!trimmedPhone) {
    errors.phone = "El teléfono es obligatorio";
  } else if (!PHONE_PATTERN.test(trimmedPhone)) {
    errors.phone = "El teléfono debe tener 10 dígitos numéricos e iniciar en 3";
  }

  // 5. Contraseña (8-20 caracteres, sin ser solo espacios, mostrando 'mínimo 8 caracteres' o 'máximo 20 caracteres')
  if (!values.password) {
    errors.password = "La contraseña es obligatoria";
  } else if (values.password.trim().length === 0) {
    errors.password = "La contraseña no puede consistir solo de espacios";
  } else if (values.password.length < 8) {
    errors.password = "La contraseña debe tener mínimo 8 caracteres";
  } else if (values.password.length > 20) {
    errors.password = "La contraseña debe tener máximo 20 caracteres";
  }

  // 6. Confirmación de contraseña (PL-1.06: rechazar con "las contraseñas no coinciden" si está vacía o difiere)
  if (!values.confirmPassword || values.confirmPassword !== values.password) {
    errors.confirmPassword = "las contraseñas no coinciden";
  }

  return errors;
}

/**
 * Builds the request body for POST /api/users.
 */
export function toRegisterUserRequest(values: RegisterUserFormValues): RegisterUserRequestDTO {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    password: values.password,
  };
}
