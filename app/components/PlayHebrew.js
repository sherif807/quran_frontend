"use client";

import { useRef, useState } from "react";

const DEFAULT_STORAGE_KEY = "hebrew_tts_settings";

const readSettings = (storageKey, fallbackLanguage) => {
  if (typeof window === "undefined") {
    return {
      language: fallbackLanguage || "he-IL",
      rate: 1.0,
      pitch: 0.0,
    };
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {
        language: fallbackLanguage || "he-IL",
        rate: 1.0,
        pitch: 0.0,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      language: fallbackLanguage || "he-IL",
      rate: 1.0,
      pitch: 0.0,
      ...parsed,
    };
  } catch (err) {
    return {
      language: fallbackLanguage || "he-IL",
      rate: 1.0,
      pitch: 0.0,
    };
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
    const settings = readSettings(storageKey, defaultLanguage);
    const rate = Number(settings.rate) || 0.85;
    const pitch = Number(settings.pitch) || 0.95;
    const voices = window.speechSynthesis.getVoices() || [];
    const chosenVoice =
      voices.find((v) =>
        v.lang && v.lang.toLowerCase().startsWith(defaultLanguage.slice(0, 2))
      ) ||
      null;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = defaultLanguage;
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

    stopAudio();
    speakBrowser();
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
