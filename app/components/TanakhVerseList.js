"use client";

import { useEffect, useMemo, useState } from "react";
import PlayHebrew from "./PlayHebrew";
import CopyHebrew from "./CopyHebrew";
import VerseTranslations from "./VerseTranslations";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

function StrongModal({ open, onClose, word, location }) {
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState("");
  const [gesenius, setGesenius] = useState([]);

  useEffect(() => {
    if (!open || !word?.strongId) return;
    setLoading(true);
    setEntry(null);
    setError("");

    fetch(`${API_BASE}/strongs/${encodeURIComponent(word.strongId)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setEntry(data.entry || null))
      .catch(() => setError("Could not load Strong's definition."))
      .finally(() => setLoading(false));
  }, [open, word?.strongId]);

  useEffect(() => {
    if (!open || !location?.book || !location?.chapter || !location?.verse) return;
      const params = new URLSearchParams({
      book: location.book,
      chapter: String(location.chapter),
      verse: String(location.verse),
      word: word?.displayText || "",
      lemma: word?.uLemma || "",
      uWord: word?.uWord || "",
      tWord: word?.tWord || "",
      tLemma: word?.tLemma || "",
    });
    fetch(`${API_BASE}/gesenius/lookup?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        const list = data.matches || [];
        setGesenius(list);
      })
      .catch(() => setGesenius([]));
  }, [open, location?.book, location?.chapter, location?.verse, word?.displayText]);

  if (!open) return null;

  return (
    <div className="strongs-modal-backdrop" onClick={onClose}>
      <div
        className="strongs-modal card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Strong&apos;s</strong>
            <button className="btn btn-sm btn-light" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="mb-2">
            <span className="badge badge-secondary mr-2">
              {word?.strongId || "N/A"}
            </span>
            <span className="small text-muted">{word?.displayText || ""}</span>
          </div>

          {loading && <p className="mb-2">Loading...</p>}
          {error && <p className="text-danger mb-2">{error}</p>}

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
              {entry.strongsDef && (
                <p className="mb-2">{entry.strongsDef}</p>
              )}
              {entry.kjvDef && (
                <p className="mb-2">
                  <span className="text-muted">KJV:</span> {entry.kjvDef}
                </p>
              )}
              {entry.derivation && (
                <p className="mb-2">
                  <span className="text-muted">Derivation:</span>{" "}
                  {entry.derivation}
                </p>
              )}
            </>
          )}

          {gesenius.length > 0 && (
            <div className="mt-3">
              <div className="small text-muted mb-1">Gesenius</div>
              {gesenius.slice(0, 3).map((g) => (
                <div key={g.id} className="mb-2">
                  <div className="small text-muted">
                    {g.verbForm || g.stem || g.person || g.gender || g.number
                      ? [g.verbForm, g.stem, g.person, g.gender, g.number]
                          .filter(Boolean)
                          .join(" · ")
                      : "—"}
                  </div>
                  {g.gloss && <div className="small">{g.gloss}</div>}
                  {g.lex && <div className="small text-muted">{g.lex}</div>}

                  {g.eng && (g.eng.eng_TAMsimp || g.eng.eng_TAM) && (
                    <div className="small mt-1">
                      <span className="text-muted">English tense:</span>{" "}
                      {g.eng.eng_TAMsimp || g.eng.eng_TAM}
                    </div>
                  )}

                  {g.lxx && g.lxx.lxx && (
                    <div className="small mt-1">
                      <span className="text-muted">LXX:</span> {g.lxx.lxx}
                      {g.lxx.lxx_tense ? ` · ${g.lxx.lxx_tense}` : ""}
                      {g.lxx.lxx_voice ? ` · ${g.lxx.lxx_voice}` : ""}
                      {g.lxx.lxx_mood ? ` · ${g.lxx.lxx_mood}` : ""}
                    </div>
                  )}

                  {g.clrela && (g.clrela.mother_type || g.clrela.daught_type) && (
                    <div className="small mt-1">
                      <span className="text-muted">Clause:</span>{" "}
                      {g.clrela.mother_type || "?"} →
                      {` ${g.clrela.daught_type || "?"}`}
                      {g.clrela.daught_rela ? ` (${g.clrela.daught_rela})` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}


          <div className="mt-3">
            <a
              className="btn btn-sm btn-outline-secondary"
              href={`/tanakh/word-root/${encodeURIComponent(word?.ref || "")}`}
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

export default function TanakhVerseList({ verseArray = {}, selectedBook, selectedChapter }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const verseEntries = useMemo(() => Object.entries(verseArray || {}), [verseArray]);

  const openModal = (word, verseNumber) => {
    setSelectedWord(word);
    setSelectedLocation({
      book: selectedBook,
      chapter: selectedChapter,
      verse: verseNumber,
    });
    setModalOpen(true);
  };

  return (
    <>
      {verseEntries.map(([verseNumber, verseProps]) => (
        <div
          key={verseNumber}
          className="verse-container mb-2"
          style={{ direction: "rtl" }}
          id={`verse-${verseNumber}`}
          data-verse-ref={`${selectedBook} ${selectedChapter}:${verseNumber}`}
        >
          <span id={`verse-${verseNumber}`} className="hebrew-verse">
            <span className="verse-number">{verseNumber}</span>{" "}
            {verseProps.words.map((word, idx) => (
              <a
                key={`${word.ref}-${idx}`}
                className="hebrew-text wordRootTanakh"
                data-word-position={word.ref}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openModal(word, verseNumber);
                }}
              >
                {word.displayText}{" "}
              </a>
            ))}
            <span className="hebrew-text sof-pasuq">:</span>
          </span>
          <div className="d-flex align-items-start mt-2">
            <PlayHebrew text={verseProps.words.map((w) => w.displayText).join(" ")} />
            <CopyHebrew text={verseProps.words.map((w) => w.displayText).join(" ")} />
            <VerseTranslations translations={verseProps.translations} />
          </div>
        </div>
      ))}

      <StrongModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        word={selectedWord}
        location={selectedLocation}
      />
    </>
  );
}
