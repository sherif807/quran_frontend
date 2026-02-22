import Header from "../../../components/Header";
import NtVerseList from "../../../components/NtVerseList";
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

async function fetchLemma(lemma, { offset = 0, limit = 50 } = {}) {
  const query = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  const translationIds = getTranslationIds();
  if (translationIds) {
    query.set("translations", translationIds);
  }
  const res = await fetch(
    `${API_BASE}/nt/word-root/${encodeURIComponent(lemma)}?${query.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(`Failed to load lemma ${lemma}`);
  }
  return res.json();
}

export async function generateMetadata({ params }) {
  const lemma = decodeURIComponent(params.lemma);
  try {
    const data = await fetchLemma(lemma, { offset: 0, limit: 1 });
    return { title: `${data.title} - ${lemma}` };
  } catch (e) {
    return { title: `Lemma ${lemma}` };
  }
}

export default async function NtLemmaPage({ params, searchParams }) {
  const lemma = decodeURIComponent(params.lemma);
  const offset = toPositiveInt(searchParams?.offset, 0);
  const parsedLimit = toPositiveInt(searchParams?.limit, 50);
  const limit = Math.min(Math.max(parsedLimit || 50, 1), 1000);
  const data = await fetchLemma(lemma, { offset, limit });
  const prevOffset = Math.max(0, data.offset - data.limit);
  const showingStart = data.totalMatches ? data.offset + 1 : 0;
  const showingEnd = data.offset + data.returned;

  return (
    <div className="container py-3">
      <Header
        allSuras={{}}
        tanakhMenu={data.menu || {}}
        showTranslationToggle
        section="nt"
      />
      <h3 className="mb-4" style={{ direction: "ltr" }}>
        {data.title}
      </h3>
      {Object.entries(data.verseArray || {}).map(([book, chapters]) =>
        Object.entries(chapters).map(([chapter, verses]) =>
          Object.entries(verses).map(([verseNum, verseProps]) => (
            <div
              key={`${book}-${chapter}-${verseNum}`}
              className="mb-3 card tanakh-verse-card"
              id={`verse-${book}-${chapter}-${verseNum}`}
            >
              <a
                href={`/nt/${book}%20${chapter}#verse-${verseNum}`}
                className="card-header d-block text-decoration-none text-dark"
                style={{ direction: "ltr" }}
              >
                {book} {chapter} : {verseNum}
              </a>
              <div className="card-body">
                <NtVerseList
                  verseArray={{ [verseNum]: verseProps }}
                />
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
              href={`/nt/word-root/${encodeURIComponent(lemma)}?offset=${prevOffset}&limit=${data.limit}`}
            >
              Previous
            </a>
          ) : null}
          {data.hasMore ? (
            <a
              className="btn btn-primary btn-sm"
              href={`/nt/word-root/${encodeURIComponent(lemma)}?offset=${data.offset + data.returned}&limit=${data.limit}`}
            >
              Next
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
