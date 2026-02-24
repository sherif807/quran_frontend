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

const getLanguageLabel = (languageCode) => {
  const code = String(languageCode || "").trim();
  if (!code) return "";
  const base = code.split("-")[0].toLowerCase();
  try {
    const display = new Intl.DisplayNames(["en"], { type: "language" });
    return display.of(base) || display.of(base.slice(0, 2)) || base;
  } catch (error) {
    return base;
  }
};

const getLanguageLabelFromTranslation = (translation) => {
  const name = String(translation.name || "").trim();
  const openParen = name.indexOf(" (");
  if (openParen > 0) {
    return name.slice(0, openParen).trim();
  }

  const fromCode = getLanguageLabel(translation.languageCode);
  if (fromCode && !String(fromCode).includes("-")) {
    return fromCode;
  }

  return fromCode || String(translation.languageCode || "").toUpperCase();
};

const getEditionLabel = (translation) => {
  const code = String(translation.languageCode || "").trim().toLowerCase();
  const name = String(translation.name || "").trim();
  const openParen = name.indexOf(" (");
  if (openParen > 0) {
    return name.slice(openParen + 2, name.endsWith(")") ? -1 : undefined);
  }

  const base = code.split("-")[0];
  const suffix = code.startsWith(`${base}-`)
    ? code.slice(base.length + 1)
    : "";

  if (suffix) {
    return suffix;
  }

  return name || code.toUpperCase();
};

export default function QuranTranslationSettings() {
  const [translations, setTranslations] = useState([]);
  const [selected, setSelected] = useState([]);
  const [activeLanguage, setActiveLanguage] = useState("");
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initialSelectionRef = useRef([]);
  const languageMenuRef = useRef(null);

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

  const groupedOptions = useMemo(() => {
    const options = translations
      .map((t) => {
        const languageLabel = getLanguageLabelFromTranslation(t);
        return {
          code: t.languageCode,
          editionLabel: getEditionLabel(t),
          languageLabel,
        };
      })
      .sort((a, b) => {
        const byLang = a.languageLabel.localeCompare(b.languageLabel, "en", {
          sensitivity: "base",
        });
        if (byLang !== 0) return byLang;
        return a.code.localeCompare(b.code, "en", { sensitivity: "base" });
      });

    const groups = [];
    let current = null;
    options.forEach((opt) => {
      if (!current || current.languageLabel !== opt.languageLabel) {
        current = { languageLabel: opt.languageLabel, items: [] };
        groups.push(current);
      }
      current.items.push(opt);
    });
    return groups;
  }, [translations]);

  useEffect(() => {
    if (!groupedOptions.length) {
      setActiveLanguage("");
      return;
    }

    if (
      activeLanguage &&
      groupedOptions.some((group) => group.languageLabel === activeLanguage)
    ) {
      return;
    }

    const selectedGroup = groupedOptions.find((group) =>
      group.items.some((item) => selected.includes(item.code))
    );
    setActiveLanguage(
      selectedGroup ? selectedGroup.languageLabel : groupedOptions[0].languageLabel
    );
  }, [groupedOptions, activeLanguage, selected]);

  useEffect(() => {
    if (!languageMenuOpen) return;
    const handleClickOutside = (event) => {
      if (!languageMenuRef.current) return;
      if (!languageMenuRef.current.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [languageMenuOpen]);

  const activeGroup = useMemo(() => {
    if (!activeLanguage) return null;
    return groupedOptions.find((group) => group.languageLabel === activeLanguage) || null;
  }, [groupedOptions, activeLanguage]);

  const selectedOptions = useMemo(() => {
    if (!selected.length || !groupedOptions.length) return [];
    const allOptions = groupedOptions.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        languageLabel: group.languageLabel,
      }))
    );
    return selected
      .map((code) => allOptions.find((item) => item.code === code))
      .filter(Boolean);
  }, [selected, groupedOptions]);

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
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("quran_translations_dirty", "1");
    }
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
            <div className="form-group mb-3">
              <label className="small text-muted mb-1">Language</label>
              <div className="dropdown w-100" ref={languageMenuRef}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                  onClick={() => setLanguageMenuOpen((open) => !open)}
                  aria-haspopup="true"
                  aria-expanded={languageMenuOpen}
                >
                  <span>{activeLanguage || "Select a language"}</span>
                  <span className="small text-muted">{languageMenuOpen ? "▲" : "▼"}</span>
                </button>
                {languageMenuOpen && (
                  <div
                    className="dropdown-menu show w-100"
                    style={{ maxHeight: "280px", overflowY: "auto" }}
                  >
                    {groupedOptions.map((group) => (
                      <button
                        key={group.languageLabel}
                        type="button"
                        className={`dropdown-item${
                          group.languageLabel === activeLanguage ? " active" : ""
                        }`}
                        onClick={() => {
                          setActiveLanguage(group.languageLabel);
                          setLanguageMenuOpen(false);
                        }}
                      >
                        {group.languageLabel}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              {activeGroup && (
                <div className="mb-3">
                  <div className="small font-weight-bold text-uppercase text-muted mb-1">
                    {activeGroup.languageLabel}
                  </div>
                  {activeGroup.items.map((opt) => (
                    <label key={opt.code} className="mr-3 mb-2 d-flex align-items-start">
                      <input
                        type="checkbox"
                        className="mr-2 mt-1"
                        checked={selected.includes(opt.code)}
                        onChange={() => toggle(opt.code)}
                      />
                      <span>{opt.editionLabel}</span>
                    </label>
                  ))}
                </div>
              )}
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

            <div className="mt-3 pt-2 border-top">
              <div className="small text-muted mb-1">Selected translations</div>
              {selectedOptions.length ? (
                <div>
                  {selectedOptions.map((opt) => (
                    <div key={opt.code} className="small mb-1">
                      {opt.languageLabel}: {opt.editionLabel}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="small text-muted">None selected</div>
              )}
            </div>
          </>
        )}
        <small className="text-muted d-block mt-2">
          Changes apply when you go back to Quran pages.
        </small>
      </div>
    </div>
  );
}
