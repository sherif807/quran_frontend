import Header from "../../components/Header";
import TranslationToggle from "../../components/TranslationToggle";
import PlayHebrew from "../../components/PlayHebrew";
import CopyHebrew from "../../components/CopyHebrew";
import VerseTranslations from "../../components/VerseTranslations";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

export const revalidate = 0;

async function fetchTanakh(ref) {
  const res = await fetch(`${API_BASE}/tanakh/${encodeURIComponent(ref)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load Tanakh ref ${ref}`);
  }
  return res.json();
}

export async function generateMetadata({ params }) {
  const ref = decodeURIComponent(params.ref || "GEN 1");
  try {
    const data = await fetchTanakh(ref);
    return { title: data.title || ref };
  } catch (e) {
    return { title: ref };
  }
}

export default async function TanakhPage({ params }) {
  const ref = decodeURIComponent(params.ref || "GEN 1");
  const data = await fetchTanakh(ref);

  const {
    menu,
    verseArray,
    selectedBook,
    selectedChapter,
    selectedBookChapterCount,
    nextBookKey,
    previousBookKey,
    previousBookChapterCount,
  } = data;

  const hasPrevChapter = selectedChapter > 1;
  const hasNextChapter = selectedChapter < selectedBookChapterCount;

  return (
    <>
      <Header
        allSuras={{}}
        tanakhMenu={menu}
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
      />
      <div className="translation-toggle">
        <TranslationToggle />
      </div>

      <nav aria-label="Tanakh navigation">
        <ul className="pagination justify-content-center mt-2">
          {hasPrevChapter ? (
            <li className="page-item">
              <a
                className="page-link"
                href={`/tanakh/${selectedBook}%20${selectedChapter - 1}`}
              >
                {"<"} {selectedBook} {selectedChapter - 1}
              </a>
            </li>
          ) : previousBookKey ? (
            <li className="page-item">
              <a
                className="page-link"
                href={`/tanakh/${previousBookKey}%20${previousBookChapterCount}`}
              >
                {"<"} {previousBookKey} {previousBookChapterCount}
              </a>
            </li>
          ) : null}

          <li className="page-item disabled">
            <a className="page-link" href="#" tabIndex={-1}>
              {selectedBook} {selectedChapter}
            </a>
          </li>

          {hasNextChapter ? (
            <li className="page-item">
              <a
                className="page-link"
                href={`/tanakh/${selectedBook}%20${selectedChapter + 1}`}
              >
                {selectedBook} {selectedChapter + 1} {">"}
              </a>
            </li>
          ) : nextBookKey ? (
            <li className="page-item">
              <a
                className="page-link"
                href={`/tanakh/${nextBookKey}%201`}
              >
                {nextBookKey} 1 {">"}
              </a>
            </li>
          ) : null}
        </ul>
      </nav>

      <div className="card rtl bg-light tanakh-verse-card">
        <div
          className="card-header"
          style={{ direction: "ltr", textAlign: "right" }}
        >
          {Object.keys(verseArray || {}).length} verses
        </div>
        <div
          className="card-body"
          style={{ backgroundColor: "#f7f2d1" }}
        >
          {Object.entries(verseArray || {}).map(([verseNumber, verseProps]) => (
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
                    href={`/tanakh/word-root/${encodeURIComponent(word.ref)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {word.displayText}{" "}
                  </a>
                ))}
                <span className="hebrew-text sof-pasuq">:</span>
              </span>
              <div className="d-flex align-items-start mt-1">
                <PlayHebrew
                  text={verseProps.words.map((w) => w.displayText).join(" ")}
                />
                <CopyHebrew
                  text={verseProps.words.map((w) => w.displayText).join(" ")}
                />
                <VerseTranslations translations={verseProps.translations} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav aria-label="Tanakh navigation">
        <ul className="pagination justify-content-center mt-3">
          {hasPrevChapter ? (
            <li className="page-item">
              <a
                className="page-link"
                href={`/tanakh/${selectedBook}%20${selectedChapter - 1}`}
              >
                {"<"} {selectedBook} {selectedChapter - 1}
              </a>
            </li>
          ) : previousBookKey ? (
            <li className="page-item">
              <a
                className="page-link"
                href={`/tanakh/${previousBookKey}%20${previousBookChapterCount}`}
              >
                {"<"} {previousBookKey} {previousBookChapterCount}
              </a>
            </li>
          ) : null}

          <li className="page-item disabled">
            <a className="page-link" href="#" tabIndex={-1}>
              {selectedBook} {selectedChapter}
            </a>
          </li>

          {hasNextChapter ? (
            <li className="page-item">
              <a
                className="page-link"
                href={`/tanakh/${selectedBook}%20${selectedChapter + 1}`}
              >
                {selectedBook} {selectedChapter + 1} {">"}
              </a>
            </li>
          ) : nextBookKey ? (
            <li className="page-item">
              <a
                className="page-link"
                href={`/tanakh/${nextBookKey}%201`}
              >
                {nextBookKey} 1 {">"}
              </a>
            </li>
          ) : null}
        </ul>
      </nav>
    </>
  );
}
