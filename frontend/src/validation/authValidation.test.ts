import { describe, expect, it } from "vitest";
import {
  toLoginRequest,
  toRegisterUserRequest,
  validateAuthForm,
  validateDeleteAccountForm,
  validateLoginForm,
} from "./authValidation";

describe("authValidation", () => {
  it("valida correctamente un formulario de registro valido y recorta espacios al mapear DTO", () => {
    const values = {
      firstName: "  Carlos  ",
      lastName: "  Pérez ",
      email: "  carlos@unillanos.edu.co ",
      phone: " 3101234567 ",
      password: "Password123",
      confirmPassword: "Password123",
    };

    expect(validateAuthForm(values)).toEqual({});
    expect(toRegisterUserRequest(values)).toEqual({
      firstName: "Carlos",
      lastName: "Pérez",
      email: "carlos@unillanos.edu.co",
      phone: "3101234567",
      password: "Password123",
    });
  });

  it("rechaza campos invalidos y contraseñas que no coinciden en registro", () => {
    const errors = validateAuthForm({
      firstName: "   ",
      lastName: "A",
      email: "bad-email",
      phone: "1234567890",
      password: "short",
      confirmPassword: "different",
    });

    expect(errors.firstName).toBe("El nombre es obligatorio");
    expect(errors.lastName).toBe("El apellido debe tener entre 2 y 50 letras y espacios");
    expect(errors.email).toBe("El formato de correo no es válido");
    expect(errors.phone).toBe("El teléfono debe tener 10 dígitos numéricos e iniciar en 3");
    expect(errors.password).toBe("La contraseña debe tener mínimo 8 caracteres");
    expect(errors.confirmPassword).toBe("las contraseñas no coinciden");
  });

  it("valida login y normaliza correo a minusculas en toLoginRequest", () => {
    expect(
      validateLoginForm({
        email: "Usuario@Unillanos.EDU.CO",
        password: "Password123",
      }),
    ).toEqual({});

    expect(
      toLoginRequest({
        email: "  Usuario@Unillanos.EDU.CO  ",
        password: "Password123",
      }),
    ).toEqual({
      email: "usuario@unillanos.edu.co",
      password: "Password123",
    });

    const loginErrors = validateLoginForm({ email: "a@b", password: "        " });
    expect(loginErrors.email).toBe("El correo debe tener entre 6 y 100 caracteres");
    expect(loginErrors.password).toBe("La contraseña no puede consistir solo de espacios");
  });

  it("valida confirmacion y contraseña al eliminar cuenta (HU-08)", () => {
    expect(
      validateDeleteAccountForm({ password: "", confirmed: false }),
    ).toEqual({
      password: "La contraseña es obligatoria",
      confirmed: "Debes confirmar la eliminación de tu cuenta",
    });

    expect(
      validateDeleteAccountForm({ password: "Password123", confirmed: true }),
    ).toEqual({});
  });
});
