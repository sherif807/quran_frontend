"use client";

import { useMemo } from "react";

const hasHtml = (text = "") => /<[^>]+>/.test(text);

function renderAlignedTranslation(text, alignments, toneBySequence) {
  if (!text || !Array.isArray(alignments) || !alignments.length) {
    return text;
  }
  const spans = alignments
    .filter(
      (a) =>
        Number.isFinite(a?.spanStart) &&
        Number.isFinite(a?.spanEnd) &&
        a.spanEnd > a.spanStart
    )
    .sort((a, b) => a.spanStart - b.spanStart);
  if (!spans.length) return text;

  const nodes = [];
  let cursor = 0;
  const seenRanges = new Set();
  spans.forEach((span, idx) => {
    const rawStart = Math.max(0, Math.min(text.length, span.spanStart));
    const rawEnd = Math.max(rawStart, Math.min(text.length, span.spanEnd));
    if (rawEnd <= cursor) return;
    const start = Math.max(cursor, rawStart);
    const end = Math.max(start, rawEnd);
    const rangeKey = `${start}:${end}`;
    if (seenRanges.has(rangeKey)) return;
    seenRanges.add(rangeKey);
    const candidate = text.slice(start, end);
    if (span.spanText && span.spanText.trim()) {
      const expected = span.spanText.trim();
      const actual = candidate.trim();
      if (actual && !expected.includes(actual) && !actual.includes(expected)) {
        return;
      }
    }
    if (start > cursor) {
      nodes.push(
        <span key={`p-${idx}-${cursor}`}>{text.slice(cursor, start)}</span>
      );
    }
    const tone =
      toneBySequence?.[span.hebrewTokenIndex] !== undefined
        ? toneBySequence[span.hebrewTokenIndex]
        : idx % 10;
    nodes.push(
      <span key={`h-${idx}-${start}`} className={`alignment-link alignment-link-${tone}`}>
        {text.slice(start, end)}
      </span>
    );
    cursor = end;
  });
  if (cursor < text.length) {
    nodes.push(<span key={`tail-${cursor}`}>{text.slice(cursor)}</span>);
  }
  return nodes;
}

export default function VerseTranslations({
  translations = [],
  alignmentMode = false,
  alignmentToneBySequence = {},
}) {

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
        alignmentMode && Array.isArray(t.alignments) && t.alignments.length && !hasHtml(t.translationText) ? (
          <span
            key={idx}
            className="translation mb-2"
            style={{
              direction: t.direction || "ltr",
              textAlign: t.direction === "rtl" ? "right" : "left",
            }}
          >
            {renderAlignedTranslation(t.translationText, t.alignments, alignmentToneBySequence)}
          </span>
        ) : (
          <span
            key={idx}
            className="translation mb-2"
            style={{
              direction: t.direction || "ltr",
              textAlign: t.direction === "rtl" ? "right" : "left",
            }}
            dangerouslySetInnerHTML={{ __html: t.translationText }}
          />
        )
      ))}
    </span>
  );
}
