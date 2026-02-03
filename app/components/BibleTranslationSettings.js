"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

const STORAGE_KEY = "bible_translations";
const COOKIE_KEY = "bible_translations";

const readCookie = () => {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_KEY}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
};

const persistSelection = (ids) => {
  if (typeof window === "undefined") return;
  const value = ids.join(",");
  window.localStorage.setItem(STORAGE_KEY, value);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(
    value
  )}; path=/; max-age=31536000`;
};

export default function BibleTranslationSettings() {
  const [translations, setTranslations] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initialSelectionRef = useRef([]);

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" &&
        window.localStorage.getItem(STORAGE_KEY)) ||
      readCookie();
    const initial = stored
      ? stored
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    initialSelectionRef.current = initial;
    setSelected(initial);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/bible/translations`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        const list = data.translations || [];
        setTranslations(list);
        if (initialSelectionRef.current.length === 0) {
          const allIds = list.map((t) => String(t.id));
          setSelected(allIds);
          persistSelection(allIds);
        }
      })
      .catch(() => setError("Could not load Bible translations."))
      .finally(() => setLoading(false));
  }, []);

  const options = useMemo(() => {
    return translations.map((t) => ({
      id: String(t.id),
      name: t.name || t.abbreviation || `#${t.id}`,
      abbreviation: t.abbreviation,
      languageCode: t.languageCode,
      snippet: t.snippet || "",
      direction: t.direction || "ltr",
    }));
  }, [translations]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id];
      setSaved(false);
      return next;
    });
  };

  const save = () => {
    persistSelection(selected);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("bible_translations_dirty", "1");
    }
    setSaved(true);
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong>Bible translations</strong>
          <span className="small text-muted">{selected.length} selected</span>
        </div>
        {loading && <div className="small text-muted">Loading...</div>}
        {error && <div className="small text-danger">{error}</div>}
        {!loading && !error && (
          <>
            <div className="translation-grid">
              {options.map((opt) => (
                <label
                  key={opt.id}
                  className="translation-card"
                >
                  <div className="d-flex align-items-start">
                    <input
                      type="checkbox"
                      className="mr-2 mt-1"
                      checked={selected.includes(opt.id)}
                      onChange={() => toggle(opt.id)}
                    />
                    <div>
                      <div className="translation-title">
                        {opt.name}
                        {opt.abbreviation ? (
                          <span className="text-muted">
                            {" "}
                            ({opt.abbreviation})
                          </span>
                        ) : null}
                        {opt.languageCode ? (
                          <span className="text-muted">
                            {" "}
                            · {opt.languageCode}
                          </span>
                        ) : null}
                      </div>
                      {opt.snippet ? (
                        <div className="translation-snippet">{opt.snippet}</div>
                      ) : null}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-2 d-flex align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={save}
                disabled={selected.length === 0}
              >
                Save
              </button>
              {saved && <span className="small text-muted ml-2">Saved</span>}
            </div>
          </>
        )}
        <small className="text-muted d-block mt-2">
          Refresh Tanakh/NT pages after changing selections.
        </small>
      </div>
    </div>
  );
}
