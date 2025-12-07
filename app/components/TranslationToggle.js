"use client";

import { useEffect, useState } from "react";

export default function TranslationToggle({ className = "" }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("show-translations");
    const initial = stored === null ? false : stored !== "0";
    setEnabled(initial);
    document.documentElement.classList.toggle("hide-translations", !initial);
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("hide-translations", !next);
      window.localStorage.setItem("show-translations", next ? "1" : "0");
    }
  };

  return (
    <label
      className={`theme-switch mb-0 ${className}`}
      htmlFor="translation-switch-checkbox-floating"
      title="Show translations"
    >
      <input
        type="checkbox"
        id="translation-switch-checkbox-floating"
        checked={enabled}
        onChange={toggle}
      />
      <div className="slider round" />
    </label>
  );
}
