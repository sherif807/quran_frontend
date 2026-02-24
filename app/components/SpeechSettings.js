"use client";

import { useEffect, useState } from "react";

const DEFAULT_STORAGE_KEY = "hebrew_tts_settings";

const defaultSettings = {
  language: "he-IL",
  rate: 1.0,
  pitch: 0.0,
};

function readSettings(storageKey) {
  if (typeof window === "undefined") return { ...defaultSettings };
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch (err) {
    return { ...defaultSettings };
  }
}

function persistSettings(storageKey, settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(settings));
}

export default function SpeechSettings({
  inline = false,
  storageKey = DEFAULT_STORAGE_KEY,
  title = "Speech settings",
  defaultLanguage = "he-IL",
  defaultPreviewText = "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
}) {
  const [open, setOpen] = useState(inline);
  const [settings, setSettings] = useState({
    ...defaultSettings,
    language: defaultLanguage,
  });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewText, setPreviewText] = useState(defaultPreviewText);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(storageKey);
    if (!raw) {
      setSettings({ ...defaultSettings, language: defaultLanguage });
    } else {
      const stored = readSettings(storageKey);
      setSettings({
        ...stored,
        language: stored.language || defaultLanguage,
      });
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    persistSettings(storageKey, settings);
  }, [settings, loaded, storageKey]);

  const preview = async () => {
    if (!previewText) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      setPreviewing(true);
      const utter = new SpeechSynthesisUtterance(previewText);
      utter.lang = defaultLanguage;
      utter.rate = Number(settings.rate) || 1.0;
      utter.pitch = Number(settings.pitch) || 0.0;
      utter.onend = () => setPreviewing(false);
      utter.onerror = () => setPreviewing(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (err) {
      setPreviewing(false);
      console.error("Preview failed", err);
    }
  };

  return (
    <>
      {open && (
        <div
          className={
            inline
              ? "speech-settings-inline"
              : "speech-settings-panel card shadow-sm"
          }
          dir="ltr"
        >
          <div className={inline ? "p-3" : "card-body p-3"}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <strong>{title}</strong>
              {!inline && (
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => setOpen(false)}
                >
                  ×
                </button>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="small text-muted mb-1">
                Rate: {settings.rate.toFixed(2)}
              </label>
              <input
                type="range"
                className="custom-range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={settings.rate}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    rate: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="form-group mb-0">
              <label className="small text-muted mb-1">
                Pitch: {settings.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                className="custom-range"
                min="-4"
                max="4"
                step="0.5"
                value={settings.pitch}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    pitch: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="form-group mt-3 mb-0">
              <label className="small text-muted mb-1">Preview text</label>
              <input
                className="form-control form-control-sm"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Hebrew text to preview"
                dir={defaultLanguage.startsWith("he") ? "rtl" : "ltr"}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary mt-2"
                onClick={preview}
                disabled={previewing}
              >
                {previewing ? "Playing..." : "Preview"}
              </button>
            </div>

            <div className="form-group mt-3 mb-0 d-flex">
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => {
                  persistSettings(storageKey, settings);
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1200);
                }}
              >
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
