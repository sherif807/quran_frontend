"use client";

import { useMemo } from "react";

export default function VerseTranslations({ translations = [] }) {

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
    <span className="ml-1 translation-container mt-2">
      {sortedTranslations.map((t, idx) => (
        <span
          key={idx}
          className="translation mb-2"
          style={{
            direction: t.direction || "ltr",
            textAlign: t.direction === "rtl" ? "right" : "left",
          }}
          dangerouslySetInnerHTML={{ __html: t.translationText }}
        />
      ))}
    </span>
  );
}
