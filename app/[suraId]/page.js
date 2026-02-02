const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

export const revalidate = 0;

async function fetchSuraData(suraId, translationParam) {
  const translationQuery = translationParam
    ? `&translation=${encodeURIComponent(translationParam)}`
    : "";
  const res = await fetch(
    `${API_BASE}/quran/${suraId}?mode=light${translationQuery}`,
    {
    // Cache on the Next.js side to reduce repeated API calls for read-only data.
    // Avoid storing oversized responses (>2MB) by skipping Next cache here.
    cache: "no-store",
    }
  );
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

function Verse({ verse, selectedSuraNumber, translations = [] }) {
  return (
    <span
      className="toHover mb-3"
      id={`verse-${verse.verseNumber}`}
      data-verse-ref={`${selectedSuraNumber}:${verse.verseNumber}`}
    >
      {verse.words.map((word, idx) => {
        const wordText =
          word.wordText ||
          (word.conversion &&
            word.conversion.lettersArray &&
            word.conversion.lettersArray.map((letter) => letter.unicode).join("")) ||
          (word.conversion && word.conversion.arabicScript) ||
          word.displayText;

        if (!wordText) {
          return null;
        }
        const wordPosition = `${selectedSuraNumber}:${verse.verseNumber}:${word.position}`;
        return (
          <span key={`${word.position}-${idx}`} className="word-wrapper">
            <a
              className="wordRoot"
              data-word-position={wordPosition}
              href={`/word-root/${wordPosition}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="house">{wordText}</span>
            </a>{" "}
          </span>
        );
      })}
      <span className="badge badge-dark" style={{ fontSize: "0.4em" }}>
        {verse.verseNumber}
      </span>
      <span className="d-block mt-2">
        <VerseTranslations translations={translations} />
      </span>
    </span>
  );
}

export default async function SuraPage({ params }) {
  const suraId = params.suraId || "1";
  const { cookies } = await import("next/headers");
  const translationCookie = cookies().get("quran_translations")?.value || "";
  const data = await fetchSuraData(suraId, translationCookie);
  const { allSuras, selectedSura, versesArray, translationsByVerse } = data;

  const hasPrev = selectedSura.number > 1;
  const hasNext = selectedSura.number < 114;

  const nextSura = allSuras[selectedSura.number + 1];
  const prevSura = allSuras[selectedSura.number - 1];

  return (
    <>
      <Header
        allSuras={allSuras}
        selectedSuraNumber={selectedSura.number}
        showTranslationToggle
        section="quran"
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
        <p className="card-text quran-verse">
          {versesArray.map((verse) => (
            <Verse
              key={verse.id}
              verse={verse}
              selectedSuraNumber={selectedSura.number}
              translations={translationsByVerse?.[verse.verseNumber] || []}
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
      <QuranProgress totalVerses={versesArray.length} />
    </>
  );
}
import Header from "../components/Header";
import VerseTranslations from "../components/VerseTranslations";
import QuranProgress from "../components/QuranProgress";
