"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

const STORAGE_KEY = "quran_translations";
const COOKIE_KEY = "quran_translations";

const readCookie = () => {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_KEY}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
};

const persistSelection = (codes) => {
  if (typeof window === "undefined") return;
  const value = codes.join(",");
  window.localStorage.setItem(STORAGE_KEY, value);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(
    value
  )}; path=/; max-age=31536000`;
};

export default function QuranTranslationSettings() {
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
      ? stored.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    initialSelectionRef.current = initial;
    setSelected(initial);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/quran/translations`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        const list = data.translations || [];
        setTranslations(list);
        if (initialSelectionRef.current.length === 0) {
          const hasEn = list.find((t) => t.languageCode === "en");
          if (hasEn) {
            setSelected(["en"]);
            persistSelection(["en"]);
          }
        }
      })
      .catch(() => setError("Could not load Quran translations."))
      .finally(() => setLoading(false));
  }, []);

  const options = useMemo(() => {
    return translations.map((t) => ({
      code: t.languageCode,
      name: t.name || t.languageCode.toUpperCase(),
      direction: t.direction || "ltr",
    }));
  }, [translations]);

  const toggle = (code) => {
    setSelected((prev) => {
      const next = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code];
      setSaved(false);
      return next;
    });
  };

  const save = () => {
    persistSelection(selected);
    setSaved(true);
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong>Quran translations</strong>
          <span className="small text-muted">
            {selected.length} selected
          </span>
        </div>
        {loading && <div className="small text-muted">Loading...</div>}
        {error && <div className="small text-danger">{error}</div>}
        {!loading && !error && (
          <>
            <div className="d-flex flex-wrap">
              {options.map((opt) => (
                <label
                  key={opt.code}
                  className="mr-3 mb-2 d-flex align-items-center"
                  style={{ minWidth: "180px" }}
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selected.includes(opt.code)}
                    onChange={() => toggle(opt.code)}
                  />
                  <span>
                    {opt.name}{" "}
                    <span className="text-muted">({opt.code})</span>
                  </span>
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
              {saved && (
                <span className="small text-muted ml-2">Saved</span>
              )}
            </div>
          </>
        )}
        <small className="text-muted d-block mt-2">
          Refresh the Quran page after changing selections.
        </small>
      </div>
    </div>
  );
}
