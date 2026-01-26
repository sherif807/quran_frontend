"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import TranslationToggle from "./TranslationToggle";

export default function Header({
  allSuras = {},
  selectedSuraNumber,
  tanakhMenu = {},
  selectedBook,
  selectedChapter,
  showTranslationToggle = false,
  quranView = "classic",
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

  const currentBook =
    pathname && pathname.startsWith("/tanakh") ? "Bible" : "Quran";

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
      router.push(`/tanakh/${book}%20${firstChapter}`);
    }
  };

  const handleChapterChange = (e) => {
    const chapter = e.target.value;
    setSelectedTanakhChapter(chapter);
    if (selectedTanakhBook && chapter) {
      router.push(`/tanakh/${selectedTanakhBook}%20${chapter}`);
    }
  };

  return (
    <nav className="navbar navbar-expand-md navbar-light bg-light mb-3 sticky-top shadow-sm">
      <div className="d-flex w-100 align-items-center justify-content-between position-relative header-top">
        <div className="navbar-brand mb-0 pb-0">
          <Link href="/1" className="text-dark text-decoration-none">
            Quranalive
          </Link>
        </div>

        <div className="header-switch-center">
          <div className="theme-switch-wrapper d-flex align-items-center">
            <label className="theme-switch" htmlFor="theme-switch-checkbox">
              <input
                type="checkbox"
                id="theme-switch-checkbox"
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <div className="slider round" />
            </label>
          </div>
        </div>

        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
      </div>

      <div
        className="collapse navbar-collapse justify-content-between flex-row-reverse align-items-start"
        id="navbarContent"
        dir="rtl"
      >
        <div className="d-flex flex-column flex-md-row w-100">
          {suraList.length > 0 && (
            <div className="header-dropdown w-100 mb-3 mb-md-0" style={{ maxWidth: "260px" }}>
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
                </button>
                <div
                  className="dropdown-menu w-100"
                  aria-labelledby="suraDropdown"
                  style={{ maxHeight: "260px", overflowY: "auto" }}
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
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <div className="btn-group btn-group-sm w-100" role="group" aria-label="Quran view">
                  <Link
                    className={`btn ${
                      quranView === "classic" ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    href={`/${selectedSuraNumber || 1}`}
                  >
                    عرض عادي
                  </Link>
                  <Link
                    className={`btn ${
                      quranView === "verse" ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    href={`/verses/${selectedSuraNumber || 1}`}
                  >
                    عرض الآيات
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="ml-md-3 mt-3 mt-md-0">
            <div className="btn-group" role="group" aria-label="Select source">
              <Link
                className={`btn btn-sm ${
                  currentBook === "Quran" ? "btn-primary" : "btn-outline-secondary"
                }`}
                href={quranView === "verse" ? "/verses/1" : "/1"}
              >
                Quran
              </Link>
              <Link
                className={`btn btn-sm ${
                  currentBook === "Bible" ? "btn-primary" : "btn-outline-secondary"
                }`}
                href="/tanakh/GEN%201"
              >
                Bible
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-3 mt-md-0">
          <Link className="btn btn-sm btn-outline-secondary w-100" href="/settings">
            Settings
          </Link>
        </div>

        {pathname && pathname.startsWith("/tanakh") && (
          <div className="w-100 mt-3 p-3 bg-white rounded shadow-sm">
            {showTranslationToggle && (
              <div className="form-group d-flex align-items-center justify-content-between mb-3">
                <span className="small text-muted mb-0">Show translations</span>
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
        )}
      </div>
    </nav>
  );
}
