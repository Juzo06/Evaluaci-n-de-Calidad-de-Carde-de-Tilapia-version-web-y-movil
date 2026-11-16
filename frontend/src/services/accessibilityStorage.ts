import { Preferences } from "@capacitor/preferences";

export type FontSizeScale = "normal" | "large" | "xlarge";

export interface AccessibilityPreferences {
  fontSize: FontSizeScale;
  highContrast: boolean;
  grayscale: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  fontSize: "normal",
  highContrast: false,
  grayscale: false,
  underlineLinks: false,
  reduceMotion: false,
};

export const ACCESSIBILITY_STORAGE_KEY = "secct.accessibility.preferences";

function isFontSizeScale(value: unknown): value is FontSizeScale {
  return value === "normal" || value === "large" || value === "xlarge";
}

function normalizePreferences(raw: string | null): AccessibilityPreferences | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences>;
    return {
      fontSize: isFontSizeScale(parsed.fontSize)
        ? parsed.fontSize
        : DEFAULT_ACCESSIBILITY_PREFERENCES.fontSize,
      highContrast: Boolean(parsed.highContrast),
      grayscale: Boolean(parsed.grayscale),
      underlineLinks: Boolean(parsed.underlineLinks),
      reduceMotion: Boolean(parsed.reduceMotion),
    };
  } catch {
    return null;
  }
}

export function loadAccessibilityPreferences(): AccessibilityPreferences {
  try {
    const raw = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    return normalizePreferences(raw) ?? { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
  } catch {
    return { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
  }
}

export function saveAccessibilityPreferences(prefs: AccessibilityPreferences): void {
  const serialized = JSON.stringify(prefs);
  try {
    window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, serialized);
  } catch {
    // Ignorar fallos de almacenamiento web en entornos restringidos.
  }
  try {
    void Preferences.set({ key: ACCESSIBILITY_STORAGE_KEY, value: serialized }).catch(() => {});
  } catch {
    // Ignorar fallos del plugin nativo fuera de entorno compatible.
  }
}

export async function syncAccessibilityPreferencesFromNative(): Promise<AccessibilityPreferences> {
  try {
    const { value } = await Preferences.get({ key: ACCESSIBILITY_STORAGE_KEY });
    const nativePrefs = normalizePreferences(value);
    if (nativePrefs) {
      try {
        window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(nativePrefs));
      } catch {
        // Ignorar fallos de localStorage.
      }
      applyAccessibilityPreferences(nativePrefs);
      return nativePrefs;
    }
  } catch {
    // Usar fallback localStorage cuando @capacitor/preferences no esté disponible.
  }
  const localPrefs = loadAccessibilityPreferences();
  applyAccessibilityPreferences(localPrefs);
  return localPrefs;
}

export async function clearAccessibilityPreferences(): Promise<void> {
  try {
    window.localStorage.removeItem(ACCESSIBILITY_STORAGE_KEY);
  } catch {
    // Ignorar fallos de localStorage.
  }
  try {
    await Preferences.remove({ key: ACCESSIBILITY_STORAGE_KEY });
  } catch {
    // Ignorar fallos de plugin nativo.
  }
  applyAccessibilityPreferences(DEFAULT_ACCESSIBILITY_PREFERENCES);
}

export function applyAccessibilityPreferences(prefs: AccessibilityPreferences): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.classList.toggle("a11y-font-lg", prefs.fontSize === "large");
  root.classList.toggle("a11y-font-xl", prefs.fontSize === "xlarge");
  root.classList.toggle("a11y-high-contrast", prefs.highContrast);
  root.classList.toggle("a11y-grayscale", prefs.grayscale);
  root.classList.toggle("a11y-underline-links", prefs.underlineLinks);
  root.classList.toggle("a11y-reduce-motion", prefs.reduceMotion);
}
