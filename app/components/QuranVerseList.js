"use client";

import { useState } from "react";

function VerseCard({ verse, selectedSuraNumber, showMetrics }) {
  return (
    <div
      className={`card rtl tanakh-verse-card mb-3 ${
        showMetrics ? "show-quran-metrics" : ""
      }`}
    >
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>
          {selectedSuraNumber} : {verse.verseNumber}
        </span>
        <span className="small text-muted">{verse.count} حرف</span>
      </div>
      <div className="card-body" style={{ backgroundColor: "#f7f2d1" }}>
        <div className="quran-verse toHover" id={`verse-${verse.verseNumber}`}>
          <span className="badge badge-pill badge-dark verseLetterCount">
            {verse.count}
          </span>
          <span className="badge badge-dark gematriaWordVerseAddition">
            {verse.gematriaWordVerseAddition}
          </span>
          {verse.words.map((word, idx) => {
            if (!word.conversion || !word.conversion.lettersArray.length) {
              return null;
            }
            const wordPosition = `${selectedSuraNumber}:${verse.verseNumber}:${word.position}`;
            const arabicWord = word.conversion.lettersArray
              .map((letter) => letter.unicode)
              .join("");
            return (
              <span key={`${word.position}-${idx}`} className="word-wrapper">
                <a
                  className="wordRoot"
                  data-word-position={wordPosition}
                  href={`/word-root/${wordPosition}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="house">{arabicWord}</span>
                </a>{" "}
              </span>
            );
          })}
          <span className="badge badge-dark" style={{ fontSize: "0.4em" }}>
            {verse.verseNumber}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function QuranVerseList({ versesArray = [], selectedSura }) {
  const [showMetrics, setShowMetrics] = useState(false);

  return (
    <div>
      <div className="d-flex justify-content-center mb-3">
        <div className="btn-group btn-group-sm" role="group">
          <button
            type="button"
            className={`btn ${showMetrics ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setShowMetrics((v) => !v)}
          >
            {showMetrics ? "إخفاء الأرقام" : "إظهار الأرقام"}
          </button>
        </div>
      </div>
      {versesArray.map((v) => (
        <VerseCard
          key={v.id || `${selectedSura.number}-${v.verseNumber}`}
          verse={v}
          selectedSuraNumber={selectedSura.number}
          showMetrics={showMetrics}
        />
      ))}
    </div>
  );
}
