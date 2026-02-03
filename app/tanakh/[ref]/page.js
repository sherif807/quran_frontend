import Header from "../../components/Header";
import { cookies } from "next/headers";
import CopyChapterHebrew from "../../components/CopyChapterHebrew";
import TanakhProgress from "../../components/TanakhProgress";
import SpeechSettings from "../../components/SpeechSettings";
import TanakhVerseList from "../../components/TanakhVerseList";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

export const revalidate = 0;

const getTranslationParam = () => {
  const value = cookies().get("bible_translations")?.value || "";
  const cleaned = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(",");
  return cleaned ? `?translations=${encodeURIComponent(cleaned)}` : "";
};

async function fetchTanakh(ref) {
  const query = getTranslationParam();
  const res = await fetch(`${API_BASE}/tanakh/${encodeURIComponent(ref)}${query}`, {
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

  const chapterHebrewText = Object.entries(verseArray || {})
    .map(([_, verseProps]) => {
      const verseWords = (verseProps.words || []).map((w) => w.displayText || "").join(" ");
      return verseWords.trim();
    })
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <Header
        allSuras={{}}
        tanakhMenu={menu}
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        showTranslationToggle
        section="tanakh"
      />

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
          <TanakhVerseList
            verseArray={verseArray}
            selectedBook={selectedBook}
            selectedChapter={selectedChapter}
          />
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

      <div className="text-right mt-3 mb-3">
        <CopyChapterHebrew text={chapterHebrewText} />
      </div>

      <TanakhProgress totalVerses={Object.keys(verseArray || {}).length} />
      <SpeechSettings />
    </>
  );
}
