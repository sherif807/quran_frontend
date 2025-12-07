"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMemo, useEffect } from "react";

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

  return (
    <nav
      className="navbar navbar-expand-md navbar-light bg-light mb-3 sticky-top shadow-sm"
      dir="rtl"
    >
      <Link className="navbar-brand" href="/1">
        Quranalive
      </Link>

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

      <div
        className="collapse navbar-collapse justify-content-between flex-row-reverse"
        id="navbarContent"
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
