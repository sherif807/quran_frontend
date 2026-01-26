"use client";

import { useEffect, useState } from "react";
import VerseTranslations from "./VerseTranslations";
import PlayGreek from "./PlayGreek";
import CopyGreek from "./CopyGreek";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

function NtModal({ open, onClose, word }) {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !word?.strongId) {
      setEntry(null);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/strongs/${encodeURIComponent(word.strongId)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setEntry(data.entry || null))
      .catch(() => setEntry(null))
      .finally(() => setLoading(false));
  }, [open, word?.strongId]);
  if (!open || !word) return null;

  return (
    <div className="strongs-modal-backdrop" onClick={onClose}>
      <div
        className="strongs-modal card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>NT Word</strong>
            <button className="btn btn-sm btn-light" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="mb-2">
            <div className="strongs-lemma" style={{ direction: "ltr" }}>
              {word.text}
            </div>
            <div className="small text-muted">{word.lemma}</div>
            {word.pos && <div className="small text-muted">POS: {word.pos}</div>}
            {word.parsing && (
              <div className="small text-muted">Parse: {word.parsing}</div>
            )}
          </div>

          {word.strongId && (
            <div className="mb-2">
              <span className="badge badge-secondary mr-2">
                {word.strongId}
              </span>
            </div>
          )}

          {loading && <p className="mb-2">Loading Strong's...</p>}
          {entry && (
            <>
              <div className="mb-2">
                <div className="strongs-lemma">{entry.lemma}</div>
                {entry.xlit && (
                  <div className="small text-muted">{entry.xlit}</div>
                )}
                {entry.pron && (
                  <div className="small text-muted">{entry.pron}</div>
                )}
              </div>
              {entry.strongsDef && <p className="mb-2">{entry.strongsDef}</p>}
              {entry.kjvDef && (
                <p className="mb-2">
                  <span className="text-muted">KJV:</span> {entry.kjvDef}
                </p>
              )}
            </>
          )}

          <div className="mt-3">
            <a
              className="btn btn-sm btn-outline-secondary"
              href={`/nt/word-root/${encodeURIComponent(word.lemma)}`}
              target="_blank"
              rel="noreferrer"
            >
              See all verses
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NtVerseList({ verseArray = {}, selectedBook, selectedChapter }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);

  return (
    <>
      {Object.entries(verseArray || {}).map(([verseNumber, verseProps]) => (
        <div
          key={verseNumber}
          className="verse-container mb-2"
          style={{ direction: "ltr" }}
          id={`verse-${verseNumber}`}
          data-verse-ref={`${selectedBook} ${selectedChapter}:${verseNumber}`}
        >
          <span className="nt-verse" style={{ direction: "ltr" }}>
            <span className="verse-number">{verseNumber}</span>{" "}
            {verseProps.words.map((word, idx) => (
              <a
                key={`${word.id}-${idx}`}
                className={`nt-text wordRootTanakh ${word.highlight ? "text-info" : ""}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedWord(word);
                  setModalOpen(true);
                }}
              >
                {word.text}{" "}
              </a>
            ))}
          </span>
          <div className="d-flex align-items-start mt-2">
            <PlayGreek text={verseProps.words.map((w) => w.text).join(" ")} />
            <CopyGreek text={verseProps.words.map((w) => w.text).join(" ")} />
            <VerseTranslations translations={verseProps.translations || []} />
          </div>
        </div>
      ))}

      <NtModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        word={selectedWord}
      />
    </>
  );
}
