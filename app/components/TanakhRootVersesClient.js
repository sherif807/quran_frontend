"use client";

import { useState } from "react";
import PlayHebrew from "./PlayHebrew";
import VerseTranslations from "./VerseTranslations";

export default function TanakhRootVersesClient({ verseArray = {} }) {
  const [speakingRef, setSpeakingRef] = useState(null);

  return (
    <>
      {Object.entries(verseArray || {}).map(([book, chapters]) =>
        Object.entries(chapters).map(([chapter, verses]) =>
          Object.entries(verses).map(([verseNum, verseProps]) => (
            <div
              key={`${book}-${chapter}-${verseNum}`}
              className="mb-3 card rtl tanakh-verse-card"
              id={`verse-${book}-${chapter}-${verseNum}`}
            >
              <a
                href={`/tanakh/${book}%20${chapter}#verse-${verseNum}`}
                className="card-header d-block text-decoration-none text-dark"
              >
                {book} {chapter} : {verseNum}
              </a>
              <div className="card-body">
                <div
                  className={`hebrew-verse ${
                    speakingRef === `${book}-${chapter}-${verseNum}`
                      ? "speaking"
                      : ""
                  }`}
                >
                  <span className="verse-number">{verseNum}</span>{" "}
                  {verseProps.words.map((word, idx) => (
                    <a
                      key={`${word.ref}-${idx}`}
                      className={`hebrew-text wordRootTanakh ${
                        word.highlight ? "text-info" : ""
                      }`}
                      data-word-position={word.ref}
                      href={`/tanakh/word-root/${encodeURIComponent(word.ref)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {word.displayText}{" "}
                    </a>
                  ))}
                  <span className="hebrew-text sof-pasuq">:</span>
                </div>
                <div className="d-flex align-items-center mt-1">
                  <PlayHebrew
                    text={verseProps.words.map((w) => w.displayText).join(" ")}
                    onStart={() =>
                      setSpeakingRef(`${book}-${chapter}-${verseNum}`)
                    }
                    onEnd={() => setSpeakingRef(null)}
                  />
                  <VerseTranslations translations={verseProps.translations} />
                </div>
              </div>
            </div>
          ))
        )
      )}
    </>
  );
}
