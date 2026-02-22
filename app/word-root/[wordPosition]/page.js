const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.floor(num));
}

async function fetchRoot(wordPosition, { offset = 0, limit = 50 } = {}) {
  const query = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  const res = await fetch(`${API_BASE}/quran/word-root/${wordPosition}?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load root for ${wordPosition}`);
  }
  return res.json();
}

export async function generateMetadata({ params }) {
  const { wordPosition } = params;
  try {
    const data = await fetchRoot(wordPosition, { offset: 0, limit: 1 });
    return {
      title: `${data.title} - ${wordPosition}`,
    };
  } catch (e) {
    return { title: `Root ${wordPosition}` };
  }
}

export default async function WordRootPage({ params, searchParams }) {
  const { wordPosition } = params;
  const offset = toPositiveInt(searchParams?.offset, 0);
  const parsedLimit = toPositiveInt(searchParams?.limit, 50);
  const limit = Math.min(Math.max(parsedLimit || 50, 1), 1000);
  const data = await fetchRoot(wordPosition, { offset, limit });
  const prevOffset = Math.max(0, data.offset - data.limit);
  const showingStart = data.totalMatches ? data.offset + 1 : 0;
  const showingEnd = data.offset + data.returned;

  return (
    <div className="container py-3">
      <Header allSuras={data.allSuras} section="quran" />
      <h3 className="mb-4">{data.title}</h3>
      {data.versesArray.map((verse) => {
        const suraMeta = data.allSuras[verse.suraNumber];
        return (
          <div
            key={`${verse.suraNumber}-${verse.verseNumber}`}
            className="mb-3 card rtl"
          >
            <a
              href={`/${verse.suraNumber}#verse-${verse.verseNumber}`}
              className="card-header d-block text-decoration-none text-dark"
            >
              {suraMeta
                ? `${suraMeta.name} ${verse.verseNumber}`
                : verse.verseNumber}
            </a>
            <div className="card-body toHover" style={{ backgroundColor: "#f7f2d1" }}>
            {verse.words.map((word) => {
              if (!word.conversion || !word.conversion.lettersArray.length) {
                return null;
              }
              const arabicWord = word.conversion.lettersArray
                .map((letter) => letter.unicode)
                .join("");
              const highlighted =
                word.highlightWordNumber &&
                word.highlightWordNumber === word.position;
              const nextWordPosition = `${verse.suraNumber}:${verse.verseNumber}:${word.position}`;
              return (
                <span key={word.position} className="word-wrapper">
                  <a
                    className={`wordRoot ${highlighted ? "text-info" : ""}`}
                    href={`/word-root/${nextWordPosition}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {arabicWord}
                  </a>{" "}
                </span>
              );
            })}
            </div>
          </div>
        );
      })}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-4">
        <div className="text-muted">
          {`Showing ${showingStart}-${showingEnd} of ${data.totalMatches}`}
        </div>
        <div className="d-flex gap-2">
          {data.offset > 0 ? (
            <a
              className="btn btn-outline-secondary btn-sm"
              href={`/word-root/${wordPosition}?offset=${prevOffset}&limit=${data.limit}`}
            >
              Previous
            </a>
          ) : null}
          {data.hasMore ? (
            <a
              className="btn btn-primary btn-sm"
              href={`/word-root/${wordPosition}?offset=${data.offset + data.returned}&limit=${data.limit}`}
            >
              Next
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
import Header from "../../components/Header";
