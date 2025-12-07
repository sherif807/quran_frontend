"use client";

import { useEffect, useState } from "react";

const defaultSettings = {
  rate: 0.95,
  pitch: 1,
  voice: "",
};

function loadSettings() {
  if (typeof window === "undefined") return defaultSettings;
  const rate = parseFloat(window.localStorage.getItem("speech-rate")) || defaultSettings.rate;
  const pitch = parseFloat(window.localStorage.getItem("speech-pitch")) || defaultSettings.pitch;
  const voice = window.localStorage.getItem("speech-voice") || defaultSettings.voice;
  return { rate, pitch, voice };
}

export function getSpeechSettings() {
  return loadSettings();
}

export default function SpeechSettings() {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const updateVoices = () => {
      const list = window.speechSynthesis.getVoices() || [];
      const hebrewVoices = list.filter((v) => v.lang && v.lang.toLowerCase().startsWith("he"));
      setVoices(hebrewVoices);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`speech-${key}`, String(value));
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary speech-settings-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Speech settings"
      >
        <i className="bi bi-gear" />
      </button>
      {open && (
        <div className="speech-settings-panel">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong className="small mb-0">Hebrew TTS</strong>
            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={() => setOpen(false)}
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>
          <div className="form-group mb-2">
            <label className="small mb-1">Speed</label>
            <input
              type="range"
              min="0.6"
              max="1.4"
              step="0.05"
              value={settings.rate}
              onChange={(e) => updateSetting("rate", parseFloat(e.target.value))}
              className="w-100"
            />
          </div>
          <div className="form-group mb-2">
            <label className="small mb-1">Pitch</label>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={settings.pitch}
              onChange={(e) => updateSetting("pitch", parseFloat(e.target.value))}
              className="w-100"
            />
          </div>
          <div className="form-group mb-0">
            <label className="small mb-1">Voice</label>
            <select
              className="form-control form-control-sm"
              value={settings.voice}
              onChange={(e) => updateSetting("voice", e.target.value)}
            >
              <option value="">Default Hebrew</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
}
