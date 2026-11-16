import { beforeEach, describe, expect, it, vi } from "vitest";

const nativeStore = new Map<string, string>();
const webStore = new Map<string, string>();

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: nativeStore.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      nativeStore.set(key, value);
    }),
    remove: vi.fn(async ({ key }: { key: string }) => {
      nativeStore.delete(key);
    }),
  },
}));

import {
  ACCESSIBILITY_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  applyAccessibilityPreferences,
  clearAccessibilityPreferences,
  loadAccessibilityPreferences,
  saveAccessibilityPreferences,
  syncAccessibilityPreferencesFromNative,
} from "./accessibilityStorage";

function setupBrowserMocks() {
  const activeClasses = new Set<string>();
  const mockLocalStorage = {
    getItem: (key: string) => webStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      webStore.set(key, value);
    },
    removeItem: (key: string) => {
      webStore.delete(key);
    },
    clear: () => webStore.clear(),
  };

  vi.stubGlobal("window", { localStorage: mockLocalStorage });
  vi.stubGlobal("localStorage", mockLocalStorage);
  vi.stubGlobal("document", {
    documentElement: {
      classList: {
        toggle: (token: string, force?: boolean) => {
          if (force) {
            activeClasses.add(token);
          } else {
            activeClasses.delete(token);
          }
          return activeClasses.has(token);
        },
        contains: (token: string) => activeClasses.has(token),
      },
    },
  });
  return activeClasses;
}

describe("accessibilityStorage", () => {
  beforeEach(() => {
    nativeStore.clear();
    webStore.clear();
  });

  it("guarda y carga preferencias sincronizadas en localStorage y @capacitor/preferences", async () => {
    setupBrowserMocks();
    const customPrefs = {
      fontSize: "xlarge" as const,
      highContrast: true,
      grayscale: true,
      underlineLinks: false,
      reduceMotion: true,
    };

    saveAccessibilityPreferences(customPrefs);
    await Promise.resolve();

    expect(loadAccessibilityPreferences()).toEqual(customPrefs);
    expect(nativeStore.get(ACCESSIBILITY_STORAGE_KEY)).toBe(JSON.stringify(customPrefs));

    webStore.clear();
    const synced = await syncAccessibilityPreferencesFromNative();
    expect(synced).toEqual(customPrefs);
    expect(loadAccessibilityPreferences()).toEqual(customPrefs);
  });

  it("aplica las clases CSS globales al DOM y limpia preferencias al restablecer", async () => {
    const activeClasses = setupBrowserMocks();

    applyAccessibilityPreferences({
      fontSize: "large",
      highContrast: true,
      grayscale: false,
      underlineLinks: true,
      reduceMotion: true,
    });

    expect(activeClasses.has("a11y-font-lg")).toBe(true);
    expect(activeClasses.has("a11y-font-xl")).toBe(false);
    expect(activeClasses.has("a11y-high-contrast")).toBe(true);
    expect(activeClasses.has("a11y-underline-links")).toBe(true);
    expect(activeClasses.has("a11y-reduce-motion")).toBe(true);

    await clearAccessibilityPreferences();
    expect(loadAccessibilityPreferences()).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(activeClasses.size).toBe(0);
  });
});
