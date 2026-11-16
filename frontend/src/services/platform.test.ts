import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { isNativePlatformMock } = vi.hoisted(() => ({
  isNativePlatformMock: vi.fn(() => false),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
  },
}));

import { isMobileApp } from "./platform";

function stubLocalStorage(store: Map<string, string>) {
  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  vi.stubGlobal("window", { localStorage: mockLocalStorage });
  vi.stubGlobal("localStorage", mockLocalStorage);
}

describe("platform", () => {
  const webStore = new Map<string, string>();

  beforeEach(() => {
    webStore.clear();
    isNativePlatformMock.mockReset();
    isNativePlatformMock.mockReturnValue(false);
    stubLocalStorage(webStore);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna false por defecto en entorno web", () => {
    expect(isMobileApp()).toBe(false);
  });

  it("retorna true cuando secct_mobile_mode está activo en localStorage", () => {
    webStore.set("secct_mobile_mode", "true");
    expect(isMobileApp()).toBe(true);
  });

  it("retorna true cuando Capacitor.isNativePlatform() retorna true", () => {
    isNativePlatformMock.mockReturnValue(true);
    expect(isMobileApp()).toBe(true);
  });
});
