const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

export const revalidate = 0;

async function fetchSuraData(suraId) {
  const res = await fetch(`${API_BASE}/quran/${suraId}?mode=light`, {
    cache: "no-store",
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
      title: `${selectedSura.number} - ${selectedSura.name} (Verse view)`,
    };
  } catch (e) {
    return {
      title: `سورة ${suraId}`,
    };
  }
}

export default async function QuranVersesPage({ params }) {
  const suraId = params.suraId || "1";
  const data = await fetchSuraData(suraId);
  const { allSuras, selectedSura, versesArray } = data;

  return (
    <>
      <Header
        allSuras={allSuras}
        selectedSuraNumber={selectedSura.number}
        quranView="verse"
      />
      <div className="container py-2">
        <div className="d-flex justify-content-center mb-3">
          <div className="btn-group btn-group-sm" role="group">
            <a className="btn btn-outline-secondary" href={`/${selectedSura.number}`}>
              عرض عادي
            </a>
            <a className="btn btn-primary" href={`/verses/${selectedSura.number}`}>
              عرض الآيات
            </a>
          </div>
        </div>
        <QuranVerseList
          versesArray={versesArray}
          selectedSura={selectedSura}
        />
      </div>
    </>
  );
}
import Header from "../../components/Header";
import QuranVerseList from "../../components/QuranVerseList";
