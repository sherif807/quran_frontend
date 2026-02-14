"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import TranslationToggle from "./TranslationToggle";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

const readCookie = (key) => {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
};

export default function Header({
  allSuras = {},
  selectedSuraNumber,
  tanakhMenu = {},
  selectedBook,
  selectedChapter,
  showTranslationToggle = false,
  section,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const suraList = useMemo(() => {
    return Object.values(allSuras)
      .sort((a, b) => a.number - b.number)
      .map((s) => ({ number: s.number, name: s.name }));
  }, [allSuras]);

  const selectedSuraLabel = useMemo(() => {
    const match = suraList.find((s) => String(s.number) === String(selectedSuraNumber));
    return match ? `${match.name} - ${match.number}` : "Select a sura";
  }, [suraList, selectedSuraNumber]);

  const resolvedSection = section || "";
  const currentBook = resolvedSection
    ? resolvedSection === "tanakh"
      ? "Bible"
      : resolvedSection === "nt"
      ? "NT"
      : "Quran"
    : pathname && pathname.startsWith("/tanakh")
    ? "Bible"
    : pathname && pathname.startsWith("/nt")
    ? "NT"
    : "Quran";
  const isNt = resolvedSection
    ? resolvedSection === "nt"
    : pathname && pathname.startsWith("/nt");
  const isTanakh = resolvedSection
    ? resolvedSection === "tanakh"
    : pathname && pathname.startsWith("/tanakh");
  const readerBasePath = isNt ? "/nt" : "/tanakh";

  const handleSuraChange = (e) => {
    const value = e.target.value;
    if (value) {
      router.push(`/${value}`);
    }
  };

  useEffect(() => {
    // Load bootstrap JS (for collapse) on client.
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("dark-mode") === "1";
    setDarkMode(stored);
    document.documentElement.classList.toggle("dark-mode", stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dirty = window.sessionStorage.getItem("bible_translations_dirty");
    if (dirty) {
      window.sessionStorage.removeItem("bible_translations_dirty");
      router.refresh();
    }
  }, [router]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark-mode", next);
      window.localStorage.setItem("dark-mode", next ? "1" : "0");
    }
  };

  const [selectedTanakhBook, setSelectedTanakhBook] = useState(
    selectedBook || ""
  );
  const [selectedTanakhChapter, setSelectedTanakhChapter] = useState(
    selectedChapter || ""
  );

  const [translationName, setTranslationName] = useState("");
  const [suraNameTranslations, setSuraNameTranslations] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [alignmentMode, setAlignmentMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw =
      window.localStorage.getItem("quran_translations") ||
      readCookie("quran_translations");
    const firstCode = raw
      ? raw.split(",").map((t) => t.trim()).filter(Boolean)[0]
      : "";
    if (!firstCode) {
      setTranslationName("");
      return;
    }

    fetch(`${API_BASE}/quran/sura-names?lang=${encodeURIComponent(firstCode)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setSuraNameTranslations(data.names || {});
        setTranslationName(firstCode.toUpperCase());
      })
      .catch(() => {
        setSuraNameTranslations({});
        setTranslationName(firstCode.toUpperCase());
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAlignmentMode(window.localStorage.getItem("tanakh_alignment_mode") === "1");
  }, []);

  useEffect(() => {
    if (!pathname || pathname === "/settings") return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem("last-page", pathname);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldOpen = window.localStorage.getItem("nav-open") === "1";
    if (!shouldOpen) return;
    const collapse = document.getElementById("navbarContent");
    if (collapse && !collapse.classList.contains("show")) {
      collapse.classList.add("show");
      const toggler = document.querySelector(".navbar-toggler");
      if (toggler) {
        toggler.setAttribute("aria-expanded", "true");
      }
    }
  }, []);

  const setNavOpen = (open) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("nav-open", open ? "1" : "0");
  };

  const handleTogglerClick = () => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      const collapse = document.getElementById("navbarContent");
      const isOpen = !!collapse && collapse.classList.contains("show");
      setNavOpen(isOpen);
    }, 0);
  };

  const runTextSearch = async (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const scope = isTanakh ? "tanakh" : isNt ? "nt" : "quran";
    setSearchLoading(true);
    router.push(`/search-text?q=${encodeURIComponent(trimmed)}&scope=${scope}`);
    if (typeof document !== "undefined") {
      const collapse = document.getElementById("navbarContent");
      if (collapse && collapse.classList.contains("show")) {
        collapse.classList.remove("show");
        const toggler = document.querySelector(".navbar-toggler");
        if (toggler) {
          toggler.setAttribute("aria-expanded", "false");
        }
      }
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nav-open", "0");
    }
    setSearchLoading(false);
  };

  const toggleAlignmentMode = () => {
    if (typeof window === "undefined") return;
    const next = !alignmentMode;
    setAlignmentMode(next);
    window.localStorage.setItem("tanakh_alignment_mode", next ? "1" : "0");
    window.dispatchEvent(new Event("tanakh-alignment-mode-change"));
  };

  // translation toggle moved to floating control on Tanakh pages

  const bookOptions = useMemo(() => Object.keys(tanakhMenu), [tanakhMenu]);
  const chapterOptions = useMemo(() => {
    if (!selectedTanakhBook || !tanakhMenu[selectedTanakhBook]) return [];
    return tanakhMenu[selectedTanakhBook];
  }, [selectedTanakhBook, tanakhMenu]);

  const handleBookChange = (e) => {
    const book = e.target.value;
    setSelectedTanakhBook(book);
    const firstChapter =
      tanakhMenu[book] && tanakhMenu[book].length ? tanakhMenu[book][0] : "";
    setSelectedTanakhChapter(firstChapter);
    if (book && firstChapter) {
      router.push(`${readerBasePath}/${book}%20${firstChapter}`);
    }
  };

  const handleChapterChange = (e) => {
    const chapter = e.target.value;
    setSelectedTanakhChapter(chapter);
    if (selectedTanakhBook && chapter) {
      router.push(`${readerBasePath}/${selectedTanakhBook}%20${chapter}`);
    }
  };

  return (
    <nav className="navbar navbar-expand-md navbar-light bg-light mb-3 sticky-top shadow-sm">
      <div className="d-flex w-100 header-top">
        <button
          className="navbar-toggler d-lg-none"
          type="button"
          data-toggle="collapse"
          data-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          onClick={handleTogglerClick}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="header-row header-row-top w-100">
          <div className="navbar-brand mb-0 pb-0 header-logo d-flex align-items-center">
            <Link href="/1" className="text-dark text-decoration-none mr-2">
              Quranalive
            </Link>
            <button
              type="button"
              className="btn btn-sm theme-toggle-btn"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Disable dark mode" : "Enable dark mode"}
              title={darkMode ? "Disable dark mode" : "Enable dark mode"}
            >
              <i className={`bi ${darkMode ? "bi-moon-fill" : "bi-moon"}`} />
            </button>
          </div>

          <div className="header-scripture-tabs d-none d-lg-flex">
            <div className="btn-group" role="group" aria-label="Select source">
              <Link
                className={`btn btn-sm ${
                  currentBook === "Bible" ? "btn-primary" : "btn-outline-secondary"
                }`}
                href="/tanakh/GEN%201"
                onClick={() => setNavOpen(true)}
              >
                Tanakh
              </Link>
              <Link
                className={`btn btn-sm ${
                  currentBook === "NT" ? "btn-primary" : "btn-outline-secondary"
                }`}
                href="/nt/MT%201"
                onClick={() => setNavOpen(true)}
              >
                Gospel
              </Link>
              <Link
                className={`btn btn-sm ${
                  currentBook === "Quran" ? "btn-primary" : "btn-outline-secondary"
                }`}
                href="/1"
                onClick={() => setNavOpen(true)}
              >
                Quran
              </Link>
            </div>
          </div>

          {suraList.length > 0 && currentBook === "Quran" && (
            <div className="header-sura-inline header-dropdown d-none d-lg-flex">
              <div className="dropdown w-100">
                <button
                  className="btn btn-outline-secondary dropdown-toggle w-100 text-left"
                  type="button"
                  id="suraDropdownInline"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {selectedSuraLabel}
                  {translationName && (
                    <span className="quran-translation-label">
                      {" "}
                      · {suraNameTranslations[selectedSuraNumber] ||
                        translationName}
                    </span>
                  )}
                </button>
                <div
                  className="dropdown-menu w-100"
                  aria-labelledby="suraDropdownInline"
                >
                  {suraList.map((sura) => (
                    <button
                      key={sura.number}
                      className="dropdown-item"
                      type="button"
                      onClick={() =>
                        handleSuraChange({ target: { value: sura.number } })
                      }
                    >
                      {sura.name} - {sura.number}
                      {translationName && suraNameTranslations[sura.number] && (
                        <span className="quran-translation-label">
                          {" "}
                          · {suraNameTranslations[sura.number]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {(currentBook !== "Quran") && (isTanakh || isNt) && (
            <div className="header-sura-inline header-bible-selectors d-none d-lg-flex">
              <div className="dropdown w-100 header-dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle w-100 text-left"
                  type="button"
                  id="bookDropdownInline"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {selectedTanakhBook || "Select a book"}
                </button>
                <div
                  className="dropdown-menu w-100"
                  aria-labelledby="bookDropdownInline"
                  style={{ maxHeight: "240px", overflowY: "auto" }}
                >
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => handleBookChange({ target: { value: "" } })}
                  >
                    Select a book
                  </button>
                  {bookOptions.map((book) => (
                    <button
                      key={book}
                      className="dropdown-item"
                      type="button"
                      onClick={() => handleBookChange({ target: { value: book } })}
                    >
                      {book}
                    </button>
                  ))}
                </div>
              </div>
              <div className="dropdown w-100 header-dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle w-100 text-left"
                  type="button"
                  id="chapterDropdownInline"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                  disabled={!selectedTanakhBook}
                >
                  {selectedTanakhChapter || "Select a chapter"}
                </button>
                <div
                  className="dropdown-menu w-100"
                  aria-labelledby="chapterDropdownInline"
                  style={{ maxHeight: "240px", overflowY: "auto" }}
                >
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() =>
                      handleChapterChange({ target: { value: "" } })
                    }
                    disabled={!selectedTanakhBook}
                  >
                    Select a chapter
                  </button>
                  {chapterOptions.map((ch) => (
                    <button
                      key={ch}
                      className="dropdown-item"
                      type="button"
                      onClick={() =>
                        handleChapterChange({ target: { value: ch } })
                      }
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="header-row header-row-bottom d-none d-lg-flex w-100">
          <form className="header-search" onSubmit={runTextSearch}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="btn btn-sm btn-outline-secondary"
              type="submit"
              disabled={searchLoading}
            >
              {searchLoading ? "..." : "Search"}
            </button>
          </form>
          {showTranslationToggle && (
            <div className="header-translation-inline d-flex align-items-center">
              {isTanakh && (
                <button
                  type="button"
                  className={`btn btn-sm mr-2 ${
                    alignmentMode ? "btn-info" : "btn-outline-secondary"
                  }`}
                  onClick={toggleAlignmentMode}
                  title="Toggle Hebrew/KJV alignment highlights"
                >
                  Link colors
                </button>
              )}
              <TranslationToggle />
              <Link
                className="small text-muted mb-0 ml-2 show-translations-link"
                href="/settings"
              >
                Translations
              </Link>
            </div>
          )}
          <div className="ml-auto">
            <Link className="small text-muted mb-0" href="/contact">
              Contact
            </Link>
          </div>
        </div>

      <div className="collapse navbar-collapse" id="navbarContent" dir="rtl">
        <div className="header-content w-100">
          <div className="header-left">
            <div className="mb-3 mb-md-0 mt-3 mt-md-0 d-lg-none">
              <div className="btn-group w-100" role="group" aria-label="Select source">
                <Link
                  className={`btn btn-sm ${
                    currentBook === "Bible" ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  href="/tanakh/GEN%201"
                  onClick={() => setNavOpen(true)}
                >
                  Tanakh
                </Link>
                <Link
                  className={`btn btn-sm ${
                    currentBook === "NT" ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  href="/nt/MT%201"
                  onClick={() => setNavOpen(true)}
                >
                  Gospel
                </Link>
                <Link
                  className={`btn btn-sm ${
                    currentBook === "Quran" ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  href="/1"
                  onClick={() => setNavOpen(true)}
                >
                  Quran
                </Link>
              </div>
            </div>

            {suraList.length > 0 && currentBook === "Quran" && (
              <div className="header-dropdown w-100 mb-3 mb-md-0 header-sura d-lg-none">
                <div className="dropdown w-100">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle w-100 text-left"
                    type="button"
                    id="suraDropdown"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    {selectedSuraLabel}
                    {translationName && (
                      <span className="quran-translation-label">
                        {" "}
                        · {suraNameTranslations[selectedSuraNumber] ||
                          translationName}
                      </span>
                    )}
                  </button>
                  <div
                    className="dropdown-menu w-100"
                    aria-labelledby="suraDropdown"
                  >
                    {suraList.map((sura) => (
                      <button
                        key={sura.number}
                        className="dropdown-item"
                        type="button"
                        onClick={() =>
                          handleSuraChange({ target: { value: sura.number } })
                        }
                      >
                        {sura.name} - {sura.number}
                        {translationName && suraNameTranslations[sura.number] && (
                          <span className="quran-translation-label">
                            {" "}
                            · {suraNameTranslations[sura.number]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="header-right d-none d-lg-flex" />
        </div>

        {(isTanakh || isNt) ? (
          <div className="w-100 mt-3 p-3 bg-white rounded shadow-sm d-lg-none">
            {showTranslationToggle && (
              <div className="form-group d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center">
                  <Link
                    className="small text-muted mb-0 show-translations-link mr-2"
                    href="/settings"
                  >
                    Translations
                  </Link>
                  {isTanakh && (
                    <button
                      type="button"
                      className={`btn btn-sm mr-2 ${
                        alignmentMode ? "btn-info" : "btn-outline-secondary"
                      }`}
                      onClick={toggleAlignmentMode}
                      title="Toggle Hebrew/KJV alignment highlights"
                    >
                      Link colors
                    </button>
                  )}
                </div>
                <TranslationToggle />
              </div>
            )}
            <div className="form-group">
              <label className="small text-muted mb-1">Books</label>
              <div className="dropdown w-100 header-dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle w-100 text-left"
                  type="button"
                  id="bookDropdown"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {selectedTanakhBook || "Select a book"}
                </button>
                <div
                  className="dropdown-menu w-100"
                  aria-labelledby="bookDropdown"
                  style={{ maxHeight: "240px", overflowY: "auto" }}
                >
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => handleBookChange({ target: { value: "" } })}
                  >
                    Select a book
                  </button>
                  {bookOptions.map((book) => (
                    <button
                      key={book}
                      className="dropdown-item"
                      type="button"
                      onClick={() => handleBookChange({ target: { value: book } })}
                    >
                      {book}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="small text-muted mb-1">Chapters</label>
              <div className="dropdown w-100 header-dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle w-100 text-left"
                  type="button"
                  id="chapterDropdown"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                  disabled={!selectedTanakhBook}
                >
                  {selectedTanakhChapter || "Select a chapter"}
                </button>
                <div
                  className="dropdown-menu w-100"
                  aria-labelledby="chapterDropdown"
                  style={{ maxHeight: "240px", overflowY: "auto" }}
                >
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() =>
                      handleChapterChange({ target: { value: "" } })
                    }
                    disabled={!selectedTanakhBook}
                  >
                    Select a chapter
                  </button>
                  {chapterOptions.map((ch) => (
                    <button
                      key={ch}
                      className="dropdown-item"
                      type="button"
                      onClick={() =>
                        handleChapterChange({ target: { value: ch } })
                      }
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : showTranslationToggle ? (
          <div className="w-100 mt-3 p-3 bg-white rounded shadow-sm d-md-none">
            <div className="form-group d-flex align-items-center justify-content-between mb-0">
              <Link
                className="small text-muted mb-0 show-translations-link"
                href="/settings"
              >
                Translations
              </Link>
              <TranslationToggle />
            </div>
          </div>
        ) : null}

        <div className="d-lg-none mt-3 mb-3">
          <form className="header-search" onSubmit={runTextSearch}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="btn btn-sm btn-outline-secondary"
              type="submit"
              disabled={searchLoading}
            >
              {searchLoading ? "..." : "Search"}
            </button>
          </form>
        </div>
        <div className="d-lg-none mb-3">
          <Link className="small text-muted" href="/contact">
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
