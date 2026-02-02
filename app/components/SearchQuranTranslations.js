"use client";

import { useEffect, useMemo, useState } from "react";
import VerseTranslations from "./VerseTranslations";

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

export default function SearchQuranTranslations({ results = [] }) {
  const [translationsByRef, setTranslationsByRef] = useState({});

  const refs = useMemo(() => {
    return results
      .filter((r) => r.corpus === "quran")
      .map((r) => `${r.suraId}:${r.verseNumber}`);
  }, [results]);

  useEffect(() => {
    if (!refs.length) return;

    const langsRaw =
      (typeof window !== "undefined" &&
        window.localStorage.getItem("quran_translations")) ||
      readCookie("quran_translations") ||
      "en";
    const langs = langsRaw
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!langs.length) return;

    const params = new URLSearchParams({
      refs: refs.join(","),
      langs: langs.join(","),
    });

    fetch(`${API_BASE}/quran/translations/by-refs?${params.toString()}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setTranslationsByRef(data.translations || {}))
      .catch(() => setTranslationsByRef({}));
  }, [refs]);

  if (!refs.length) return null;

  return (
    <>
      {results.map((result) => {
        if (result.corpus !== "quran") return null;
        const key = `${result.suraId}:${result.verseNumber}`;
        const translations = translationsByRef[key] || [];
        if (!translations.length) return null;
        return (
          <div key={`t-${key}`} className="translation-container mt-2">
            <VerseTranslations translations={translations} />
          </div>
        );
      })}
    </>
  );
}
