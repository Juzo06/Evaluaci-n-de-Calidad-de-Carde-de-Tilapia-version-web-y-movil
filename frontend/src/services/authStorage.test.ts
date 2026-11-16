import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getRoleCode,
  getSession,
  getToken,
  getUserEmail,
  getUserFullName,
  getUserId,
  isAuthenticated,
  removeLocalToken,
  saveSession,
} from "./authStorage";

describe("authStorage", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    });
  });

  it("almacena y recupera la sesion completa del usuario", () => {
    saveSession({
      accessToken: "jwt-token-123",
      roleCode: "PISCICULTOR",
      email: "ana.gomez@unillanos.edu.co",
      id: 14,
      fullName: "Ana Gómez",
    });

    expect(isAuthenticated()).toBe(true);
    expect(getToken()).toBe("jwt-token-123");
    expect(getRoleCode()).toBe("PISCICULTOR");
    expect(getUserEmail()).toBe("ana.gomez@unillanos.edu.co");
    expect(getUserId()).toBe(14);
    expect(getUserFullName()).toBe("Ana Gómez");
    expect(getSession()).toEqual({
      accessToken: "jwt-token-123",
      roleCode: "PISCICULTOR",
      email: "ana.gomez@unillanos.edu.co",
      id: 14,
      fullName: "Ana Gómez",
    });
  });

  it("limpia todas las claves al ejecutar removeLocalToken", () => {
    saveSession({
      accessToken: "jwt-token-123",
      roleCode: "ADMINISTRADOR",
      email: "admin@unillanos.edu.co",
      id: 1,
    });

    removeLocalToken();

    expect(isAuthenticated()).toBe(false);
    expect(getToken()).toBeNull();
    expect(getRoleCode()).toBeNull();
    expect(getUserId()).toBeNull();
    expect(getSession()).toBeNull();
  });
});
