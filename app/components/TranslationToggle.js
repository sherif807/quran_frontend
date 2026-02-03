"use client";

import { useEffect, useState } from "react";

export default function TranslationToggle({
  className = "",
  id = "translation-switch-checkbox-floating",
}) {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("show-translations");
    const initial = stored === null ? false : stored !== "0";
    setEnabled(initial);
    document.documentElement.classList.toggle("hide-translations", !initial);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("hide-translations", !next);
      window.localStorage.setItem("show-translations", next ? "1" : "0");
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <label
      className={`theme-switch mb-0 ${className}`}
      htmlFor={id}
      title="Show translations"
    >
      <input
        type="checkbox"
        id={id}
        checked={enabled}
        onChange={toggle}
      />
      <div className="slider round" />
    </label>
  );
}
