"use client";

import { useMemo } from "react";

const hasHtml = (text = "") => /<[^>]+>/.test(text);

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const stripArabic = (value) =>
  String(value || "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0640]/g, "")
    .replace(/[\u0671\u0622\u0623\u0625]/g, "\u0627")
    .replace(/[\u0649]/g, "\u064A")
    .replace(/[\u0629]/g, "\u0647")
    .replace(/[\u0624\u0626\u0621]/g, "\u0621")
    .replace(/\s+/g, " ")
    .trim();

const buildArabicRegex = (query) => {
  const cleaned = stripArabic(query).replace(/\s+/g, "");
  if (!cleaned) return null;
  const chars = Array.from(cleaned).map((ch) => {
    if (ch === "\u0627") return "[\u0627\u0671\u0622\u0623\u0625]";
    return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  const sep = "[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640\\s]*";
  return new RegExp(chars.join(sep), "gi");
};

const highlightTranslationText = (text, query, corpus) => {
  if (!text || !query) return text;
  if (hasHtml(text)) return text;

  const source = String(text);
  const regex =
    corpus === "quran" && /[\u0600-\u06FF]/.test(query)
      ? buildArabicRegex(query)
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  if (!regex) return escapeHtml(source);

  let lastIndex = 0;
  let result = "";
  let match;
  while ((match = regex.exec(source))) {
    const start = match.index;
    const end = start + match[0].length;
    result += escapeHtml(source.slice(lastIndex, start));
    result += `<span class="text-info">${escapeHtml(source.slice(start, end))}</span>`;
    lastIndex = end;
    if (!regex.global) break;
  }
  result += escapeHtml(source.slice(lastIndex));
  return result;
};

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
  highlightQuery = "",
  highlightCorpus = "",
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
    <div className="ml-1 translation-container mt-2">
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
            dangerouslySetInnerHTML={{
              __html: highlightTranslationText(
                t.translationText,
                highlightQuery,
                highlightCorpus
              ),
            }}
          />
        )
      ))}
    </div>
  );
}
