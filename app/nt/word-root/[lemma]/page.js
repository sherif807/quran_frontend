import Header from "../../../components/Header";
import NtVerseList from "../../../components/NtVerseList";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

async function fetchLemma(lemma) {
  const res = await fetch(
    `${API_BASE}/nt/word-root/${encodeURIComponent(lemma)}`,
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
    const data = await fetchLemma(lemma);
    return { title: `${data.title} - ${lemma}` };
  } catch (e) {
    return { title: `Lemma ${lemma}` };
  }
}

export default async function NtLemmaPage({ params }) {
  const lemma = decodeURIComponent(params.lemma);
  const data = await fetchLemma(lemma);

  return (
    <div className="container py-3">
      <Header
        allSuras={{}}
        tanakhMenu={data.menu || {}}
        showTranslationToggle
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
    </div>
  );
}
