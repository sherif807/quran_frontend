const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

async function fetchSuraData(suraId) {
  const res = await fetch(`${API_BASE}/quran/${suraId}`, {
    // Cache on the Next.js side to reduce repeated API calls for read-only data.
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Failed to load sura ${suraId}`);
  }
  return res.json();
}

export async function generateMetadata({ params }) {
  const suraId = params.suraId || "1";
  try {
    const data = await fetchSuraData(suraId);
    const { selectedSura } = data;
    return {
      title: `${selectedSura.number} - ${selectedSura.name}`,
    };
  } catch (e) {
    return {
      title: `سورة ${suraId}`,
    };
  }
}

function Verse({ verse, selectedSuraNumber }) {
  return (
    <span
      className="toHover mb-3"
      id={`verse-${verse.verseNumber}`}
      data-verse-count={verse.count}
      title={verse.count}
    >
      <span className="badge badge-pill badge-dark verseLetterCount">
        {verse.count}
      </span>
      <span className="badge badge-dark gematriaWordVerseAddition">
        {verse.gematriaWordVerseAddition}
      </span>
      {verse.words.map((word) => {
        if (!word.conversion || !word.conversion.lettersArray.length) {
          return null;
        }
        const wordPosition = `${selectedSuraNumber}:${verse.verseNumber}:${word.position}`;
        const arabicWord = word.conversion.lettersArray
          .map((letter) => letter.unicode)
          .join("");
        return (
          <span key={word.position} className="word-wrapper">
            <a
              className="wordRoot"
              data-word-position={wordPosition}
              href={`/word-root/${wordPosition}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="house">{arabicWord}</span>
            </a>{" "}
          </span>
        );
      })}
      <span className="badge badge-dark" style={{ fontSize: "0.7rem" }}>
        {verse.verseNumber}
      </span>
    </span>
  );
}

export default async function SuraPage({ params }) {
  const suraId = params.suraId || "1";
  const data = await fetchSuraData(suraId);
  const { allSuras, selectedSura, versesArray } = data;

  const hasPrev = selectedSura.number > 1;
  const hasNext = selectedSura.number < 114;

  const nextSura = allSuras[selectedSura.number + 1];
  const prevSura = allSuras[selectedSura.number - 1];

  return (
    <>
      <Header
        allSuras={allSuras}
        selectedSuraNumber={selectedSura.number}
      />
      <nav aria-label="Page navigation example">
        <ul className="pagination justify-content-center mt-2">
          {hasPrev && (
            <li className="page-item">
              <a className="page-link" href={`/${selectedSura.number - 1}`}>
                {"<"} {prevSura ? prevSura.name : selectedSura.number - 1}
              </a>
            </li>
          )}
          <li className="page-item disabled">
            <a className="page-link" href="#" tabIndex={-1}>
              {selectedSura.name}
            </a>
          </li>
          {hasNext && (
            <li className="page-item">
              <a className="page-link" href={`/${selectedSura.number + 1}`}>
                {nextSura ? nextSura.name : selectedSura.number + 1} {">"}
              </a>
            </li>
          )}
        </ul>
      </nav>

      <div className="card rtl bg-light">
        <div className="card-header">
          {selectedSura.number} سورة {selectedSura.name} - عدد الايات{" "}
          {selectedSura.verseCount} -{" "}
          {selectedSura.revelationPlace === 0 ? "مكية" : "مدنية"}{" "}
          {selectedSura.revelationOrder}
        </div>
        <div
          className="card-body"
          id="quranCard"
          style={{ backgroundColor: "#f7f2d1" }}
        >
          <p className="card-text">
            {versesArray.map((verse) => (
              <Verse
                key={verse.id}
                verse={verse}
                selectedSuraNumber={selectedSura.number}
              />
            ))}
          </p>
        </div>
      </div>

      <nav aria-label="Page navigation example">
        <ul className="pagination justify-content-center mt-3">
          {hasPrev && (
            <li className="page-item">
              <a className="page-link" href={`/${selectedSura.number - 1}`}>
                {"<"} {prevSura ? prevSura.name : selectedSura.number - 1}
              </a>
            </li>
          )}
          <li className="page-item disabled">
            <a className="page-link" href="#" tabIndex={-1}>
              {selectedSura.name}
            </a>
          </li>
          {hasNext && (
            <li className="page-item">
              <a className="page-link" href={`/${selectedSura.number + 1}`}>
                {nextSura ? nextSura.name : selectedSura.number + 1} {">"}
              </a>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
import Header from "../components/Header";
