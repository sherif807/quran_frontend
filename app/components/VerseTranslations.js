"use client";

import { useMemo, useState } from "react";

export default function VerseTranslations({ translations = [] }) {
  const [open, setOpen] = useState(false);

  const sortedTranslations = useMemo(() => {
    return [...translations].sort((a, b) => {
      const dirA = (a.direction || "").toLowerCase();
      const dirB = (b.direction || "").toLowerCase();
      if (dirA === dirB) return 0;
      if (dirA === "ltr") return -1;
      if (dirB === "ltr") return 1;
      return 0;
    });
  }, [translations]);

  if (!translations || translations.length === 0) return null;

  return (
    <span className="ml-1">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary play-hebrew-btn translation-toggle-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle translation"
      >
        <i className="bi bi-translate" />
      </button>
      <div
        className={`translation-container mt-2 ${
          open ? "per-verse-open" : ""
        }`}
      >
        {sortedTranslations.map((t, idx) => (
          <div
            key={idx}
            className="translation mb-2 per-verse-open-item"
            style={{
              direction: t.direction || "ltr",
              textAlign: t.direction === "rtl" ? "right" : "left",
            }}
            dangerouslySetInnerHTML={{ __html: t.translationText }}
          />
        ))}
      </div>
    </span>
  );
}
