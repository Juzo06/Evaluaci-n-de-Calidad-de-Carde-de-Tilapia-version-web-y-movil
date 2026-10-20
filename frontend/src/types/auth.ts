/**
 * DTO sent to POST /api/users according to DC-HU1.
 */
export interface RegisterUserRequestDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

/**
 * DTO received from POST /api/users according to DC-HU1 (PU-08).
 */
export interface RegisterUserResponseDTO {
  id: number;
  email: string;
}

/**
 * Form values for user registration including password confirmation.
 */
export interface RegisterUserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export type RegisterUserFormField = keyof RegisterUserFormValues;
