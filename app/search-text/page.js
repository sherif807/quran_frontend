import Header from "../components/Header";
import SearchQuranTranslations from "../components/SearchQuranTranslations";
import VerseTranslations from "../components/VerseTranslations";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

export const revalidate = 0;

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const stripArabic = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0640]/g, "")
    .replace(/[\u0671\u0622\u0623\u0625]/g, "\u0627")
    .replace(/\s+/g, " ")
    .trim();
};

const buildArabicRegex = (query) => {
  const cleaned = stripArabic(query).replace(/\s+/g, "");
  if (!cleaned) return null;
  const chars = Array.from(cleaned).map((ch) => {
    if (ch === "\u0627") return "[\u0627\u0671\u0622\u0623\u0625]";
    return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  const sep = "[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640\\s]*";
  return new RegExp(chars.join(sep), "g");
};

const isArabic = (value) => /[\u0600-\u06FF]/.test(value || "");
const isHebrew = (value) => /[\u0590-\u05FF]/.test(value || "");
const isGreek = (value) => /[\u0370-\u03FF\u1F00-\u1FFF]/.test(value || "");

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase();

const normalizeGreek = (value) =>
  normalizeText(value).replace(/\u03c2/g, "\u03c3");

const matchesArabicWord = (word, queryTokens) => {
  const cleanedWord = stripArabic(word);
  if (!cleanedWord) return false;
  return queryTokens.some((token) => cleanedWord.includes(token));
};

const matchesToken = (text, tokens) => {
  if (!text) return false;
  const normalized = normalizeText(text);
  return tokens.some((token) => normalized.includes(token));
};

const matchesGreekWord = (wordText, lemma, tokens) => {
  const wordNorm = normalizeGreek(wordText);
  const lemmaNorm = normalizeGreek(lemma);
  return tokens.some((token) => {
    const tokenNorm = normalizeGreek(token);
    if (!tokenNorm) return false;
    if (lemmaNorm && (lemmaNorm.startsWith(tokenNorm) || tokenNorm.startsWith(lemmaNorm))) {
      return true;
    }
    return wordNorm.startsWith(tokenNorm) || tokenNorm.startsWith(wordNorm);
  });
};

const highlight = (text, query, corpus) => {
  if (!text || !query) return escapeHtml(text);
  const source = String(text);
  const regex =
    corpus === "quran" && /[\u0600-\u06FF]/.test(query)
      ? buildArabicRegex(query)
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  if (!regex) return escapeHtml(text);

  let lastIndex = 0;
  let result = "";
  let match;
  while ((match = regex.exec(source))) {
    const start = match.index;
    const end = match.index + match[0].length;
    result += escapeHtml(source.slice(lastIndex, start));
    result += `<span class="text-info">${escapeHtml(
      source.slice(start, end)
    )}</span>`;
    lastIndex = end;
    if (!regex.global) break;
  }
  result += escapeHtml(source.slice(lastIndex));
  return result;
};

async function fetchTextSearch({ query, scope }) {
  if (!query) return { ok: false, results: [] };
  const params = new URLSearchParams({
    q: query,
    scope: scope || "quran",
    limit: "100",
  });
  const res = await fetch(`${API_BASE}/search/text?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Search failed.");
  }
  return res.json();
}

const buildResultHref = (item) => {
  if (item.corpus === "quran") {
    return `/${item.suraId}#verse-${item.verseNumber}`;
  }
  if (item.corpus === "tanakh") {
    return `/tanakh/${item.book}%20${item.chapter}#verse-${item.verse}`;
  }
  if (item.corpus === "nt") {
    return `/nt/${item.book}%20${item.chapter}#verse-${item.verse}`;
  }
  return "#";
};

async function fetchHeaderData(scope) {
  if (scope === "tanakh") {
    const res = await fetch(`${API_BASE}/tanakh/GEN%201`, { cache: "no-store" });
    if (!res.ok) return {};
    const data = await res.json();
    return {
      tanakhMenu: data.menu || {},
      selectedBook: "GEN",
      selectedChapter: 1,
    };
  }
  if (scope === "nt") {
    const res = await fetch(`${API_BASE}/nt/MT%201`, { cache: "no-store" });
    if (!res.ok) return {};
    const data = await res.json();
    return {
      tanakhMenu: data.menu || {},
      selectedBook: "MT",
      selectedChapter: 1,
    };
  }
  const res = await fetch(`${API_BASE}/quran/1?mode=light`, {
    cache: "no-store",
  });
  if (!res.ok) return {};
  const data = await res.json();
  return {
    allSuras: data.allSuras || {},
    selectedSuraNumber: 1,
  };
}

const getTranslationLang = () => {
  const store = cookies().get("quran_translations")?.value || "";
  const first = store
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)[0];
  return first || "";
};

async function fetchSuraNameTranslations(lang) {
  if (!lang) return {};
  const res = await fetch(
    `${API_BASE}/quran/sura-names?lang=${encodeURIComponent(lang)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return {};
  const data = await res.json();
  return data.names || {};
}

export default async function SearchTextPage({ searchParams }) {
  const query = String(searchParams?.q || "").trim();
  const scope = String(searchParams?.scope || "quran").toLowerCase();
  const translationLang = getTranslationLang();
  const suraNameTranslations = await fetchSuraNameTranslations(translationLang);
  const headerData = await fetchHeaderData(scope);

  let data = { ok: false, results: [], script: "" };
  let error = "";
  if (query) {
    try {
      data = await fetchTextSearch({ query, scope });
    } catch (err) {
      error = err?.message || "Search failed.";
    }
  }

  return (
    <div className="container py-3">
      <Header
        section={scope}
        showTranslationToggle
        allSuras={headerData.allSuras || {}}
        selectedSuraNumber={headerData.selectedSuraNumber}
        tanakhMenu={headerData.tanakhMenu || {}}
        selectedBook={headerData.selectedBook}
        selectedChapter={headerData.selectedChapter}
      />
      <div className="mb-3">
        <h4 className="mb-1">Search results</h4>
        <div className="text-muted small">
          {query ? `Query: ${query}` : "Enter a query in the header search."}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {!error && query && data.ok && data.results.length === 0 && (
        <div className="alert alert-warning">No results found.</div>
      )}

      {data.results.map((item, idx) => {
        const isQuran = item.corpus === "quran";
        const cardClass = isQuran
          ? "mb-3 card rtl"
          : "mb-3 card tanakh-verse-card";
        const bodyClass = isQuran ? "card-body quran-verse" : "card-body";
        const bodyStyle = { backgroundColor: "#f7f2d1" };
        const bodyDir = isQuran
          ? { direction: "rtl", textAlign: "right" }
          : { direction: "ltr" };
        const queryIsArabic = isArabic(query);
        const queryIsHebrew = isHebrew(query);
        const queryIsGreek = isGreek(query);
        const queryTokens = queryIsArabic
          ? stripArabic(query).split(/\s+/).filter(Boolean)
          : normalizeText(query).split(/\s+/).filter(Boolean);
        return (
          <div key={`${item.ref}-${idx}`} className={cardClass}>
            <a
              href={buildResultHref(item)}
              className="card-header d-block text-decoration-none"
            >
              {item.corpus === "quran" ? (
                <>
                  {item.suraName || item.ref}{" "}
                  {item.suraId}:{item.verseNumber}
                  {translationLang &&
                    suraNameTranslations[item.suraId] && (
                      <span className="quran-translation-label">
                        {" "}
                        · {suraNameTranslations[item.suraId]}
                      </span>
                    )}
                </>
              ) : (
                <>
                  {item.ref}
                  {item.source ? ` · ${item.source}` : ""}
                </>
              )}
            </a>
            <div className={bodyClass} style={{ ...bodyStyle, ...bodyDir }}>
              {item.corpus === "quran" && Array.isArray(item.words) && (
                <div className="search-quran-text mb-0">
                  {item.words.map((word, widx) => {
                    if (!word.wordText) return null;
                    const isMatch = queryIsArabic
                      ? matchesArabicWord(word.wordText, queryTokens)
                      : matchesToken(word.wordText, queryTokens);
                    return (
                      <span key={`${item.ref}-${widx}`} className="word-wrapper">
                        <a
                          className={`wordRoot ${isMatch ? "text-info" : ""}`}
                          href={`/word-root/${item.suraId}:${item.verseNumber}:${word.position}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {word.wordText}
                        </a>{" "}
                      </span>
                    );
                  })}
                  <span className="badge badge-dark" style={{ fontSize: "0.4em" }}>
                    {item.verseNumber}
                  </span>
                </div>
              )}

              {item.corpus === "tanakh" && Array.isArray(item.words) && (
                <div className="hebrew-verse">
                  {item.words.map((word, widx) => {
                    const isMatch = queryIsHebrew
                      ? matchesToken(word.displayText, queryTokens)
                      : matchesToken(word.displayText, queryTokens);
                    return (
                      <a
                        key={`${item.ref}-${widx}`}
                        className={`hebrew-text wordRootTanakh ${
                          isMatch ? "text-info" : ""
                        }`}
                        href={`/tanakh/word-root/${encodeURIComponent(
                          word.ref
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {word.displayText}{" "}
                      </a>
                    );
                  })}
                </div>
              )}

              {item.corpus === "nt" && Array.isArray(item.words) && (
                <div className="nt-verse" style={{ direction: "ltr" }}>
                  {item.words.map((word, widx) => {
                    const isMatch = queryIsGreek
                      ? matchesGreekWord(word.text, word.lemma, queryTokens)
                      : matchesToken(word.text, queryTokens);
                    return (
                      <a
                        key={`${item.ref}-${widx}`}
                        className={`nt-text wordRootTanakh ${
                          isMatch ? "text-info" : ""
                        }`}
                        href={`/nt/word-root/${encodeURIComponent(
                          word.lemma || ""
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {word.text}{" "}
                      </a>
                    );
                  })}
                </div>
              )}

              {item.translations?.length ? (
                <div className="translation-container mt-2">
                  <VerseTranslations translations={item.translations} />
                </div>
              ) : item.text && item.corpus !== "quran" ? (
                <div
                  className="translation mt-2"
                  dangerouslySetInnerHTML={{
                    __html: highlight(item.text || "", query, item.corpus),
                  }}
                />
              ) : null}
              {item.corpus === "quran" && (
                <SearchQuranTranslations results={[item]} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
