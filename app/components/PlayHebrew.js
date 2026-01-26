"use client";

import { useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

const DEFAULT_STORAGE_KEY = "hebrew_tts_settings";

const readSettings = (storageKey) => {
  if (typeof window === "undefined") {
    return {
      provider: "browser",
      voice: "",
      language: "he-IL",
      rate: 1.0,
      pitch: 0.0,
    };
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { provider: "browser", voice: "", language: "he-IL", rate: 1.0, pitch: 0.0 };
    const parsed = JSON.parse(raw);
    return {
      provider: "browser",
      voice: "",
      language: "he-IL",
      rate: 1.0,
      pitch: 0.0,
      ...parsed,
    };
  } catch (err) {
    return { provider: "browser", voice: "", language: "he-IL", rate: 1.0, pitch: 0.0 };
  }
};

export default function PlayHebrew({
  text,
  storageKey = DEFAULT_STORAGE_KEY,
  defaultLanguage = "he-IL",
}) {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const speakBrowser = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const settings = readSettings(storageKey);
    const rate = Number(settings.rate) || 0.85;
    const pitch = Number(settings.pitch) || 0.95;
    const voices = window.speechSynthesis.getVoices() || [];
    const chosenVoice =
      voices.find((v) =>
        v.lang && v.lang.toLowerCase().startsWith(defaultLanguage.slice(0, 2))
      ) ||
      null;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = settings.language || defaultLanguage;
    utter.rate = rate;
    utter.pitch = pitch;
    if (chosenVoice) {
      utter.voice = chosenVoice;
    }
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const speakGoogle = async () => {
    const settings = readSettings(storageKey);
    const payload = {
      text,
      voice: settings.voice || "",
      language: settings.language || defaultLanguage,
      rate: Number(settings.rate) || 1.0,
      pitch: Number(settings.pitch) || 0.0,
    };

    try {
      setSpeaking(true);
      const res = await fetch(`${API_BASE}/tts/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Google TTS failed");
      const data = await res.json();
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setSpeaking(false);
        audioRef.current = null;
      };
      audio.play();
    } catch (err) {
      console.error("Google TTS error", err);
      setSpeaking(false);
      speakBrowser();
    }
  };

  const speak = () => {
    if (!text) return;

    if (speaking) {
      if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
      }
      stopAudio();
      setSpeaking(false);
      return;
    }

    const settings = readSettings(storageKey);
    if (String(settings.provider || "browser") === "google") {
      speakGoogle();
    } else {
      stopAudio();
      speakBrowser();
    }
  };

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary ml-2 play-hebrew-btn"
      onClick={speak}
      aria-label="Play verse audio"
    >
      {speaking ? (
        <i className="bi bi-pause-fill" />
      ) : (
        <i className="bi bi-play-fill" />
      )}
    </button>
  );
}
