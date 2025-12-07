"use client";

import { useState } from "react";
import PlayHebrew from "./PlayHebrew";
import VerseTranslations from "./VerseTranslations";

export default function TanakhVersesClient({ verseArray = {}, selectedBook, selectedChapter }) {
  const [speakingRef, setSpeakingRef] = useState(null);

  return (
    <>
      {Object.entries(verseArray || {}).map(([verseNumber, verseProps]) => (
        <div
          key={verseNumber}
          className="verse-container mb-2"
          style={{ direction: "rtl" }}
          id={`verse-${verseNumber}`}
          data-verse-ref={`${selectedBook} ${selectedChapter}:${verseNumber}`}
        >
          <span
            id={`verse-${verseNumber}`}
            className={`hebrew-verse ${speakingRef === verseNumber ? "speaking" : ""}`}
          >
            <span className="verse-number">{verseNumber}</span>{" "}
            {verseProps.words.map((word, idx) => (
              <a
                key={`${word.ref}-${idx}`}
                className="hebrew-text wordRootTanakh"
                data-word-position={word.ref}
                href={`/tanakh/word-root/${encodeURIComponent(word.ref)}`}
                target="_blank"
                rel="noreferrer"
              >
                {word.displayText}{" "}
              </a>
            ))}
            <span className="hebrew-text sof-pasuq">:</span>
          </span>
          <div className="d-flex align-items-center mt-1">
            <PlayHebrew
              text={verseProps.words.map((w) => w.displayText).join(" ")}
              onStart={() => setSpeakingRef(verseNumber)}
              onEnd={() => setSpeakingRef(null)}
            />
            <VerseTranslations translations={verseProps.translations} />
          </div>
        </div>
      ))}
    </>
  );
}
