const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

async function fetchRoot(wordPosition) {
  const res = await fetch(`${API_BASE}/quran/word-root/${wordPosition}`, {
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
    const data = await fetchRoot(wordPosition);
    return {
      title: `${data.title} - ${wordPosition}`,
    };
  } catch (e) {
    return { title: `Root ${wordPosition}` };
  }
}

export default async function WordRootPage({ params }) {
  const { wordPosition } = params;
  const data = await fetchRoot(wordPosition);

  return (
    <div className="container py-3">
      <Header allSuras={data.allSuras} />
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
              return (
                <span key={word.position} className="word-wrapper">
                  <span
                    className={`wordRoot ${highlighted ? "text-info" : ""}`}
                  >
                    {arabicWord}
                  </span>{" "}
                </span>
              );
            })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
import Header from "../../components/Header";
