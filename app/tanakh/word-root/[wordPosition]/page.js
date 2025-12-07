import Header from "../../../components/Header";
import TranslationToggle from "../../../components/TranslationToggle";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

async function fetchRoot(wordPosition) {
  const res = await fetch(
    `${API_BASE}/tanakh/word-root/${encodeURIComponent(wordPosition)}`,
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
    const data = await fetchRoot(wordPosition);
    return { title: `${data.title} - ${wordPosition}` };
  } catch (e) {
    return { title: `Root ${wordPosition}` };
  }
}

export default async function TanakhRootPage({ params }) {
  const wordPosition = decodeURIComponent(params.wordPosition);
  const data = await fetchRoot(wordPosition);

  return (
    <div className="container py-3">
      <Header
        allSuras={{}}
        tanakhMenu={data.menu || {}}
      />
      <div className="translation-toggle">
        <TranslationToggle />
      </div>
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
                <div className="translation-container mt-2">
                  {(verseProps.translations || []).map((t, idx) => (
                    <div
                      key={idx}
                      className="translation mb-2"
                      style={{
                        direction: t.direction || "ltr",
                        textAlign: t.direction === "rtl" ? "right" : "left",
                      }}
                      dangerouslySetInnerHTML={{ __html: t.translationText }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))
        )
      )}
    </div>
  );
}
