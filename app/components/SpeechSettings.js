"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

const STORAGE_KEY = "hebrew_tts_settings";

const defaultSettings = {
  provider: "browser",
  voice: "",
  language: "he-IL",
  rate: 1.0,
  pitch: 0.0,
};

function readSettings() {
  if (typeof window === "undefined") return { ...defaultSettings };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch (err) {
    return { ...defaultSettings };
  }
}

function persistSettings(settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export default function SpeechSettings({ inline = false }) {
  const [open, setOpen] = useState(inline);
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [previewText, setPreviewText] = useState(
    "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ"
  );
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    setSettings(readSettings());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    persistSettings(settings);
  }, [settings, loaded]);

  const loadVoices = async () => {
    setLoadingVoices(true);
    setVoiceError("");
    try {
      const res = await fetch(
        `${API_BASE}/tts/voices?language=${encodeURIComponent(
          settings.language || "he-IL"
        )}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to load voices");
      const data = await res.json();
      setVoices(data.voices || []);
    } catch (err) {
      console.error("Voice list load failed", err);
      setVoices([]);
      setVoiceError("Could not load voices. Is the backend running?");
    } finally {
      setLoadingVoices(false);
    }
  };

  const voiceOptions = useMemo(() => {
    return voices
      .map((voice) => ({
        name: voice.name,
        label: `${voice.name} (${voice.ssmlGender || "UNSPECIFIED"})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [voices]);


  useEffect(() => {
    if (settings.provider !== "google") return;
    if (voices.length > 0) return;
    loadVoices();
  }, [settings.provider, settings.language]);

  const preview = async () => {
    if (!previewText) return;
    if (settings.provider === "browser") {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const utter = new SpeechSynthesisUtterance(previewText);
      utter.lang = settings.language || "he-IL";
      utter.rate = Number(settings.rate) || 1.0;
      utter.pitch = Number(settings.pitch) || 0.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
      return;
    }

    try {
      setPreviewing(true);
      const res = await fetch(`${API_BASE}/tts/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: previewText,
          voice: settings.voice || "",
          language: settings.language || "he-IL",
          rate: Number(settings.rate) || 1.0,
          pitch: Number(settings.pitch) || 0.0,
        }),
      });
      if (!res.ok) throw new Error("Preview failed");
      const data = await res.json();
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
      audio.play();
    } catch (err) {
      console.error("Preview failed", err);
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <>
      {!inline && (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary speech-settings-toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Speech settings"
          title="Speech settings"
        >
          <i className="bi bi-gear" />
        </button>
      )}

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
              <strong>Speech settings</strong>
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
              <label className="small text-muted mb-1">Voice provider</label>
              <select
                className="form-control form-control-sm"
                value={settings.provider}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    provider: e.target.value,
                  }))
                }
              >
                <option value="browser">Browser</option>
                <option value="google">Google</option>
              </select>
              <small className="text-muted d-block mt-1">
                Browser uses your device voice. Google gives higher quality Hebrew voices.
              </small>
            </div>

            {settings.provider === "google" && (
              <>
                <div className="form-group mb-2">
                  <label className="small text-muted mb-1">Language</label>
                  <select
                    className="form-control form-control-sm"
                    value={settings.language}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        language: e.target.value,
                      }))
                    }
                  >
                    <option value="he-IL">Hebrew (Israel) - he-IL</option>
                  </select>
                </div>

                <div className="form-group mb-2">
                  <label className="small text-muted mb-1">Google voice</label>
                  <div className="d-flex">
                    <select
                      className="form-control form-control-sm"
                      value={settings.voice}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          voice: e.target.value,
                        }))
                      }
                    >
                      <option value="">Default voice</option>
                      {voiceOptions.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {loadingVoices && (
                    <small className="text-muted d-block mt-1">
                      Loading voices...
                    </small>
                  )}
                  {voiceError && (
                    <small className="text-danger d-block mt-1">
                      {voiceError}
                    </small>
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
              </>
            )}

            <div className="form-group mt-3 mb-0">
              <label className="small text-muted mb-1">Preview text</label>
              <input
                className="form-control form-control-sm"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Hebrew text to preview"
                dir="rtl"
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
                  persistSettings(settings);
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1200);
                }}
              >
                {saved ? "Saved" : "Save"}
              </button>
              <Link
                className="btn btn-sm btn-outline-secondary ml-2"
                href="/tanakh/GEN%201"
              >
                Save &amp; Back
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
