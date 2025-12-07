import Header from "../../../components/Header";
import TranslationToggle from "../../../components/TranslationToggle";
import TanakhRootVersesClient from "../../../components/TanakhRootVersesClient";

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
      <TanakhRootVersesClient verseArray={data.verseArray} />
    </div>
  );
}
