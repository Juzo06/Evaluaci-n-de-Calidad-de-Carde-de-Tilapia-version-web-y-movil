import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import {
  AccessibilityPreferences,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  FontSizeScale,
  applyAccessibilityPreferences,
  loadAccessibilityPreferences,
  saveAccessibilityPreferences,
  syncAccessibilityPreferencesFromNative,
} from "../services/accessibilityStorage";

const FONT_SIZE_OPTIONS: Array<{ value: FontSizeScale; labelKey: string }> = [
  { value: "normal", labelKey: "a11y.fontSize.normal" },
  { value: "large", labelKey: "a11y.fontSize.large" },
  { value: "xlarge", labelKey: "a11y.fontSize.xlarge" },
];

type BooleanPreferenceKey = Exclude<keyof AccessibilityPreferences, "fontSize">;

const TOGGLE_OPTIONS: Array<{
  key: BooleanPreferenceKey;
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    key: "highContrast",
    labelKey: "a11y.highContrast.label",
    descriptionKey: "a11y.highContrast.description",
  },
  {
    key: "grayscale",
    labelKey: "a11y.grayscale.label",
    descriptionKey: "a11y.grayscale.description",
  },
  {
    key: "underlineLinks",
    labelKey: "a11y.underlineLinks.label",
    descriptionKey: "a11y.underlineLinks.description",
  },
  {
    key: "reduceMotion",
    labelKey: "a11y.reduceMotion.label",
    descriptionKey: "a11y.reduceMotion.description",
  },
];

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() =>
    loadAccessibilityPreferences()
  );
  const { locale, setLocale, t } = useI18n();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    applyAccessibilityPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    let cancelled = false;
    void syncAccessibilityPreferencesFromNative().then((synced) => {
      if (!cancelled) {
        setPreferences(synced);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function setFontSize(fontSize: FontSizeScale) {
    setPreferences((prev) => {
      const next = { ...prev, fontSize };
      saveAccessibilityPreferences(next);
      return next;
    });
  }

  function togglePreference(key: BooleanPreferenceKey) {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveAccessibilityPreferences(next);
      return next;
    });
  }

  function handleReset() {
    const next = { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
    saveAccessibilityPreferences(next);
    setPreferences(next);
  }

  return (
    <aside
      id="a11y-widget-root"
      aria-label={t("a11y.toolsAria")}
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 font-['Inter',sans-serif]"
    >
      {isOpen && (
        <div
          id="a11y-widget-panel"
          role="region"
          aria-label={t("a11y.panelAria")}
          className="w-[21rem] sm:w-[25rem] min-w-[20rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#c8dce8] bg-white p-4 text-[#003465] shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between border-b border-[#e2edf5] pb-2">
            <h2 className="m-0 text-sm font-bold text-[#003465]">{t("a11y.title")}</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t("a11y.closePanelAria")}
              className="rounded-md px-2 py-1 text-xs font-semibold text-[#003465] hover:bg-[#e8f1f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003465]"
            >
              {t("a11y.close")}
            </button>
          </div>

          <fieldset className="mb-4 border-0 p-0">
            <legend className="mb-2 text-xs font-semibold text-[#003465]">
              {t("a11y.fontSizeLegend")}
            </legend>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("a11y.textScaleAria")}>
              {FONT_SIZE_OPTIONS.map((option) => {
                const selected = preferences.fontSize === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFontSize(option.value)}
                    aria-pressed={selected}
                    className={`flex-1 min-w-fit rounded-lg border px-2.5 py-1.5 text-center text-[11px] sm:text-xs font-semibold leading-tight whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003465] ${
                      selected
                        ? "border-[#094b72] bg-[#094b72] text-white"
                        : "border-[#9bc0d9] bg-[#f8fbfd] text-[#003465] hover:bg-[#eaf3f9]"
                    }`}
                  >
                    {t(option.labelKey)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <ul className="m-0 mb-3 flex list-none flex-col gap-2 p-0">
            {TOGGLE_OPTIONS.map((item) => {
              const checked = preferences[item.key];
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    onClick={() => togglePreference(item.key)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003465] ${
                      checked
                        ? "border-[#094b72] bg-[#eef6fb]"
                        : "border-[#d8e6f0] bg-white hover:bg-[#f8fbfd]"
                    }`}
                  >
                    <span>
                      <span className="block text-xs font-semibold text-[#003465]">
                        {t(item.labelKey)}
                      </span>
                      <span className="block text-[11px] text-[#355570]">
                        {t(item.descriptionKey)}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
                        checked ? "justify-end bg-[#094b72]" : "justify-start bg-[#8ea6b8]"
                      }`}
                    >
                      <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <fieldset className="mb-3 border-0 p-0">
            <legend className="mb-1.5 text-xs font-semibold text-[#003465]">
              {t("a11y.languageLegend")}
            </legend>
            <div className="grid grid-cols-2 gap-1.5" role="group" aria-label={t("app.languageLabel")}>
              <button
                type="button"
                id="a11y-lang-es"
                onClick={() => setLocale("es")}
                aria-pressed={locale === "es"}
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003465] ${
                  locale === "es"
                    ? "border-[#094b72] bg-[#094b72] text-white"
                    : "border-[#9bc0d9] bg-[#f8fbfd] text-[#003465] hover:bg-[#eaf3f9]"
                }`}
              >
                ES · {t("app.languageEs")}
              </button>
              <button
                type="button"
                id="a11y-lang-en"
                onClick={() => setLocale("en")}
                aria-pressed={locale === "en"}
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003465] ${
                  locale === "en"
                    ? "border-[#094b72] bg-[#094b72] text-white"
                    : "border-[#9bc0d9] bg-[#f8fbfd] text-[#003465] hover:bg-[#eaf3f9]"
                }`}
              >
                EN · {t("app.languageEn")}
              </button>
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-xl border border-[#9bc0d9] bg-white px-3 py-2 text-xs font-semibold text-[#003465] hover:bg-[#eef6fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003465]"
          >
            {t("a11y.reset")}
          </button>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="a11y-widget-panel"
        aria-label={isOpen ? t("a11y.closeTriggerAria") : t("a11y.openTriggerAria")}
        className="flex items-center gap-2 rounded-full border-2 border-white bg-[#094b72] px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-[#073a59] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003465]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle cx="12" cy="4.5" r="2" fill="currentColor" />
          <path
            d="M4 8.5h16M12 8.5v5.5m0 0-3.5 6m3.5-6 3.5 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{t("a11y.title")}</span>
      </button>
    </aside>
  );
}
