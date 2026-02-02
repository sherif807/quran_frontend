"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

const parseRef = (ref) => {
  const [sura, verse] = String(ref || "").split(":");
  const suraId = Number(sura);
  const verseNumber = Number(verse);
  if (!suraId || !verseNumber) return null;
  return { suraId, verseNumber };
};

export default function QuranSearchPage() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("ar");
  const [source, setSource] = useState("quran_ar_no_tashkeel");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError("Enter a search query.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        q: trimmed,
        corpus: "quran",
        lang,
        source,
        limit: "20",
      });
      const res = await fetch(`${API_BASE}/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Search failed.");
      }
      setResults(data.results || []);
    } catch (err) {
      setError(err?.message || "Search failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-3">
      <h3 className="mb-3">Quran Semantic Search</h3>
      <form onSubmit={runSearch} className="mb-3">
        <div className="form-group mb-2">
          <label className="small text-muted mb-1">Query</label>
          <input
            type="text"
            className="form-control"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالمعنى أو بالإنجليزية"
          />
        </div>
        <div className="form-row">
          <div className="form-group col-md-4">
            <label className="small text-muted mb-1">Language</label>
            <select
              className="form-control"
              value={lang}
              onChange={(e) => {
                const nextLang = e.target.value;
                setLang(nextLang);
                setSource(
                  nextLang === "ar"
                    ? "quran_ar_no_tashkeel"
                    : "quran_translation_1"
                );
              }}
            >
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="form-group col-md-8">
            <label className="small text-muted mb-1">Source</label>
            <select
              className="form-control"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="quran_ar_no_tashkeel">Arabic (no tashkeel)</option>
              <option value="quran_translation_1">
                Sahih International (English)
              </option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="alert alert-warning">{error}</div>}

      <div>
        {results.map((result) => {
          const ref = parseRef(result.ref);
          const href = ref ? `/${ref.suraId}#verse-${ref.verseNumber}` : "#";
          return (
            <div key={result.id} className="card mb-2">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <a href={href} className="text-decoration-none">
                    {result.ref}
                  </a>
                  <span className="text-muted small">
                    {Number(result.score).toFixed(3)}
                  </span>
                </div>
                <div
                  className="rtl quran-verse"
                  style={{ direction: "rtl", textAlign: "right" }}
                >
                  {result.arabicText || (
                    <span className="text-muted">[Arabic verse missing]</span>
                  )}
                </div>
                {result.text && (
                  <div className="text-muted mt-2" style={{ direction: "ltr" }}>
                    {result.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
