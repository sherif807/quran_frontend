import Header from "../../components/Header";
import NtVerseList from "../../components/NtVerseList";
import NtProgress from "../../components/NtProgress";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

export const revalidate = 0;

async function fetchNt(ref) {
  const res = await fetch(`${API_BASE}/nt/${encodeURIComponent(ref)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load NT ref ${ref}`);
  }
  return res.json();
}

export async function generateMetadata({ params }) {
  const ref = decodeURIComponent(params.ref || "MT 1");
  try {
    const data = await fetchNt(ref);
    return { title: data.title || ref };
  } catch (e) {
    return { title: ref };
  }
}

export default async function NtPage({ params }) {
  const ref = decodeURIComponent(params.ref || "MT 1");
  const data = await fetchNt(ref);

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
        showTranslationToggle
      />

      <nav aria-label="NT navigation">
        <ul className="pagination justify-content-center mt-2">
          {hasPrevChapter ? (
            <li className="page-item">
              <a
                className="page-link"
                href={`/nt/${selectedBook}%20${selectedChapter - 1}`}
              >
                {"<"} {selectedBook} {selectedChapter - 1}
              </a>
            </li>
          ) : previousBookKey ? (
            <li className="page-item">
              <a
                className="page-link"
                href={`/nt/${previousBookKey}%20${previousBookChapterCount}`}
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
                href={`/nt/${selectedBook}%20${selectedChapter + 1}`}
              >
                {selectedBook} {selectedChapter + 1} {">"}
              </a>
            </li>
          ) : nextBookKey ? (
            <li className="page-item">
              <a className="page-link" href={`/nt/${nextBookKey}%201`}>
                {nextBookKey} 1 {">"}
              </a>
            </li>
          ) : null}
        </ul>
      </nav>

      <div className="card bg-light tanakh-verse-card">
        <div
          className="card-header"
          style={{ direction: "ltr", textAlign: "left" }}
        >
          {Object.keys(verseArray || {}).length} verses
        </div>
        <div className="card-body" style={{ backgroundColor: "#f7f2d1" }}>
          <NtVerseList
            verseArray={verseArray}
            selectedBook={selectedBook}
            selectedChapter={selectedChapter}
          />
        </div>
      </div>

      <NtProgress totalVerses={Object.keys(verseArray || {}).length} />
    </>
  );
}
