"use client";

import { useState } from "react";

export default function PlayHebrew({ text }) {
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (!text) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "he-IL";
    utter.rate = 0.95;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary ml-2 play-hebrew-btn"
      onClick={speak}
      aria-label="Play verse audio"
    >
      {speaking ? "⏹" : "▶"}
    </button>
  );
}
