"use client";

import { useState } from "react";

export default function PlayHebrew({ text }) {
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (!text) return;

    // If already speaking, stop; otherwise start from beginning.
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const rate = 0.85;
    const pitch = 0.95;
    const voices = window.speechSynthesis.getVoices() || [];
    const chosenVoice =
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("he")) ||
      null;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "he-IL";
    utter.rate = rate;
    utter.pitch = pitch;
    if (chosenVoice) {
      utter.voice = chosenVoice;
    }
    utter.onstart = () => {
      setSpeaking(true);
    };
    utter.onend = () => {
      setSpeaking(false);
    };
    utter.onerror = () => {
      setSpeaking(false);
    };
    window.speechSynthesis.cancel(); // ensure clean start
    window.speechSynthesis.speak(utter);
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
