import { Capacitor } from "@capacitor/core";

const MOBILE_MODE_STORAGE_KEY = "secct_mobile_mode";

/**
 * Returns true when running inside a native Capacitor container (Android/iOS)
 * or when explicit mobile-mode flag/env is active for testing the mobile subset.
 */
export function isMobileApp(): boolean {
  try {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
  } catch {
    // Fallback outside browser/native runtime
  }
  if (import.meta.env?.VITE_MOBILE_APP === "true") {
    return true;
  }
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(MOBILE_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}
