import Header from "../../../components/Header";
import PlayHebrew from "../../../components/PlayHebrew";
import CopyHebrew from "../../../components/CopyHebrew";
import VerseTranslations from "../../../components/VerseTranslations";
import SpeechSettings from "../../../components/SpeechSettings";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.floor(num));
}

const getTranslationIds = () => {
  const value = cookies().get("bible_translations")?.value || "";
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(",");
};

async function fetchRoot(wordPosition, { offset = 0, limit = 50 } = {}) {
  const query = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  const translationIds = getTranslationIds();
  if (translationIds) {
    query.set("translations", translationIds);
  }
  const res = await fetch(
    `${API_BASE}/tanakh/word-root/${encodeURIComponent(wordPosition)}?${query.toString()}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to load root for ${wordPosition}`);
  }
  return res.json();
}

export async function generateMetadata({ params }) {
  const wordPosition = decodeURIComponent(params.wordPosition);
  try {
    const data = await fetchRoot(wordPosition, { offset: 0, limit: 1 });
    return { title: `${data.title} - ${wordPosition}` };
  } catch (e) {
    return { title: `Root ${wordPosition}` };
  }
}

export default async function TanakhRootPage({ params, searchParams }) {
  const wordPosition = decodeURIComponent(params.wordPosition);
  const offset = toPositiveInt(searchParams?.offset, 0);
  const parsedLimit = toPositiveInt(searchParams?.limit, 50);
  const limit = Math.min(Math.max(parsedLimit || 50, 1), 1000);
  const data = await fetchRoot(wordPosition, { offset, limit });
  const prevOffset = Math.max(0, data.offset - data.limit);
  const showingStart = data.totalMatches ? data.offset + 1 : 0;
  const showingEnd = data.offset + data.returned;

  return (
    <div className="container py-3">
      <Header
        allSuras={{}}
        tanakhMenu={data.menu || {}}
        showTranslationToggle
        section="tanakh"
      />
      <h3 className="mb-4">{data.title}</h3>
      {Object.entries(data.verseArray || {}).map(([book, chapters]) =>
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
                <div className="hebrew-verse">
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
                <div className="d-flex align-items-start mt-2">
                  <PlayHebrew
                    text={verseProps.words.map((w) => w.displayText).join(" ")}
                  />
                  <CopyHebrew
                    text={verseProps.words.map((w) => w.displayText).join(" ")}
                  />
                  <VerseTranslations translations={verseProps.translations} />
                </div>
              </div>
            </div>
          ))
        )
      )}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-4">
        <div className="text-muted">
          {`Showing ${showingStart}-${showingEnd} of ${data.totalMatches}`}
        </div>
        <div className="d-flex gap-2">
          {data.offset > 0 ? (
            <a
              className="btn btn-outline-secondary btn-sm"
              href={`/tanakh/word-root/${encodeURIComponent(wordPosition)}?offset=${prevOffset}&limit=${data.limit}`}
            >
              Previous
            </a>
          ) : null}
          {data.hasMore ? (
            <a
              className="btn btn-primary btn-sm"
              href={`/tanakh/word-root/${encodeURIComponent(wordPosition)}?offset=${data.offset + data.returned}&limit=${data.limit}`}
            >
              Next
            </a>
          ) : null}
        </div>
      </div>
      <SpeechSettings />
    </div>
  );
}
