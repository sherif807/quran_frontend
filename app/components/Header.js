"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";

export default function Header({ allSuras = {}, selectedSuraNumber }) {
  const router = useRouter();
  const pathname = usePathname();

  const suraList = useMemo(() => {
    return Object.values(allSuras)
      .sort((a, b) => a.number - b.number)
      .map((s) => ({ number: s.number, name: s.name }));
  }, [allSuras]);

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

  return (
    <nav className="navbar navbar-expand-md navbar-light bg-light mb-3 sticky-top shadow-sm">
      <div className="d-flex w-100 align-items-center justify-content-between position-relative header-top">
        <div className="navbar-brand mb-0 pb-0">
          <Link href="/1" className="text-dark text-decoration-none">
            Quranalive
          </Link>
        </div>

        <div className="header-switch-center">
          <div className="theme-switch-wrapper">
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
        className="collapse navbar-collapse justify-content-between flex-row-reverse align-items-center"
        id="navbarContent"
        dir="rtl"
      >
        {suraList.length > 0 && (
          <ul className="navbar-nav">
            <li className="nav-item" style={{ minWidth: "200px" }}>
              <select
                className="form-control custom-select"
                value={selectedSuraNumber || ""}
                onChange={handleSuraChange}
              >
                {suraList.map((sura) => (
                  <option key={sura.number} value={sura.number}>
                    {sura.name} - {sura.number}
                  </option>
                ))}
              </select>
            </li>
          </ul>
        )}

        <ul className="navbar-nav">
          <li className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle"
              href="#"
              id="booksDropdown"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              {currentBook}
            </a>
            <div className="dropdown-menu" aria-labelledby="booksDropdown">
              <Link className="dropdown-item" href="/1">
                Quran
              </Link>
              <span className="dropdown-item disabled">Bible</span>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
}
