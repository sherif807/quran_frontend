"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMemo, useEffect, useRef, useState } from "react";
import TranslationToggle from "./TranslationToggle";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

const BOOK_LABELS = {
  GEN: "Genesis",
  EXO: "Exodus",
  LEV: "Leviticus",
  NUM: "Numbers",
  DEU: "Deuteronomy",
  JOS: "Joshua",
  JDG: "Judges",
  RUT: "Ruth",
  "1SA": "1 Samuel",
  "2SA": "2 Samuel",
  "1KI": "1 Kings",
  "2KI": "2 Kings",
  "1CH": "1 Chronicles",
  "2CH": "2 Chronicles",
  EZR: "Ezra",
  NEH: "Nehemiah",
  EST: "Esther",
  JOB: "Job",
  PSA: "Psalms",
  PRO: "Proverbs",
  ECC: "Ecclesiastes",
  SNG: "Song of Songs",
  ISA: "Isaiah",
  JER: "Jeremiah",
  LAM: "Lamentations",
  EZK: "Ezekiel",
  DAN: "Daniel",
  HOS: "Hosea",
  JOL: "Joel",
  AMO: "Amos",
  OBA: "Obadiah",
  JON: "Jonah",
  MIC: "Micah",
  NAM: "Nahum",
  HAB: "Habakkuk",
  ZEP: "Zephaniah",
  HAG: "Haggai",
  ZEC: "Zechariah",
  MAL: "Malachi",
  MT: "Matthew",
  MK: "Mark",
  LK: "Luke",
  JN: "John",
  AC: "Acts",
  RO: "Romans",
  "1CO": "1 Corinthians",
  "2CO": "2 Corinthians",
  GA: "Galatians",
  EPH: "Ephesians",
  PHP: "Philippians",
  COL: "Colossians",
  "1TH": "1 Thessalonians",
  "2TH": "2 Thessalonians",
  "1TI": "1 Timothy",
  "2TI": "2 Timothy",
  TIT: "Titus",
  PHM: "Philemon",
  HEB: "Hebrews",
  JAS: "James",
  "1PE": "1 Peter",
  "2PE": "2 Peter",
  "1JN": "1 John",
  "2JN": "2 John",
  "3JN": "3 John",
  JUD: "Jude",
  RE: "Revelation",
};

const getBookLabel = (code) => BOOK_LABELS[code] || code;

const readCookie = (key) => {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
};

const getReadableTranslationName = (translation, code) => {
  const rawName = String(translation?.name || "").trim();
  if (rawName) {
    const openParen = rawName.indexOf(" (");
    return openParen > 0 ? rawName.slice(0, openParen).trim() : rawName;
  }
  return "";
};

const buildSearchSuggestionHref = (item) => {
  if (!item) return "#";
  if (item.corpus === "quran") {
    return `/${item.suraId}#verse-${item.verse}`;
  }
  if (item.corpus === "tanakh") {
    return `/tanakh/${item.book}%20${item.chapter}#verse-${item.verse}`;
  }
  if (item.corpus === "nt") {
    return `/nt/${item.book}%20${item.chapter}#verse-${item.verse}`;
  }
  return "#";
};

const formatSearchSuggestionLabel = (item) => {
  if (!item) return "";
  if (item.corpus === "quran") {
    return `${item.suraId}:${item.verse}`;
  }
  return `${item.book} ${item.chapter}:${item.verse}`;
};

const getSuggestionTextClass = (item) => {
  if (!item) return "";
  if (item.corpus === "quran" || item.corpus === "tanakh") {
    return "header-search-suggestion-text rtl";
  }
  return "header-search-suggestion-text";
};

const stripArabic = (value) =>
  String(value || "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0640]/g, "")
    .replace(/[\u0671\u0622\u0623\u0625]/g, "\u0627")
    .replace(/[\u0649]/g, "\u064A")
    .replace(/[\u0629]/g, "\u0647")
    .replace(/[\u0624\u0626\u0621]/g, "\u0621");

const normalizeHebrew = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[־"]/g, " ")
    .replace(/[׳״]/g, "");

const normalizeLatin = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase();

const normalizeGreek = (value) => normalizeLatin(value).replace(/\u03c2/g, "\u03c3");

const getSuggestionQueryTokens = (query) => {
  const trimmed = String(query || "").replace(/^\s+/, "").trimEnd();
  if (!trimmed) return [];
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return stripArabic(trimmed)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }
  if (/[\u0590-\u05FF]/.test(trimmed)) {
    return normalizeHebrew(trimmed)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }
  if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(trimmed)) {
    return normalizeGreek(trimmed)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }
  return normalizeLatin(trimmed)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
};

const getDisplayWordNormalizer = (word) => {
  if (/[\u0600-\u06FF]/.test(word)) {
    return stripArabic;
  }
  if (/[\u0590-\u05FF]/.test(word)) {
    return normalizeHebrew;
  }
  if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(word)) {
    return normalizeGreek;
  }
  return normalizeLatin;
};

const renderHighlightedSuggestionText = (text, query) => {
  const source = String(text || "");
  const tokens = getSuggestionQueryTokens(query);
  if (!source || !tokens.length) return source;

  const parts = source.split(/(\s+)/);
  const trimmedQuery = String(query || "").replace(/^\s+/, "").trimEnd();
  const normalizedQuery = trimmedQuery
    ? getDisplayWordNormalizer(trimmedQuery)(trimmedQuery)
    : "";
  const matchWordIndexes = [];
  let phraseStartIndex = -1;
  let phraseEndIndex = -1;

  parts.forEach((part, index) => {
    if (!part.trim()) return;
    const normalizeWord = getDisplayWordNormalizer(part);
    const normalizedPart = normalizeWord(part);
    const isMatch = tokens.some((token) => {
      if (!token) return false;
      return (
        normalizedPart.includes(token) ||
        token.includes(normalizedPart) ||
        normalizedPart.startsWith(token) ||
        token.startsWith(normalizedPart)
      );
    });
    if (isMatch) {
      matchWordIndexes.push(index);
    }
  });

  if (normalizedQuery) {
    const visibleWords = [];
    parts.forEach((part, index) => {
      if (!part.trim()) return;
      visibleWords.push({
        index,
        normalized: getDisplayWordNormalizer(part)(part),
      });
    });

    for (let start = 0; start < visibleWords.length; start += 1) {
      let combined = "";
      for (let end = start; end < visibleWords.length; end += 1) {
        combined = combined
          ? `${combined} ${visibleWords[end].normalized}`
          : visibleWords[end].normalized;
        if (combined.includes(normalizedQuery)) {
          phraseStartIndex = visibleWords[start].index;
          phraseEndIndex = visibleWords[end].index;
          break;
        }
      }
      if (phraseStartIndex !== -1) break;
    }
  }

  const wordIndexes =
    phraseStartIndex !== -1
      ? matchWordIndexes.filter(
          (index) => index >= phraseStartIndex && index <= phraseEndIndex
        )
      : matchWordIndexes;

  if (!wordIndexes.length) return source;

  const firstMatchIndex = wordIndexes[0];
  const lastMatchIndex = wordIndexes[wordIndexes.length - 1];
  const visibleWordPadding = 4;

  let firstWordSeen = 0;
  let lastWordSeen = -1;
  let startIndex = 0;
  let endIndex = parts.length - 1;

  parts.forEach((part, index) => {
    if (!part.trim()) return;
    if (index <= firstMatchIndex) {
      firstWordSeen += 1;
    }
    if (index <= lastMatchIndex) {
      lastWordSeen += 1;
    }
  });

  let currentWord = 0;
  for (let index = 0; index < parts.length; index += 1) {
    if (!parts[index].trim()) continue;
    currentWord += 1;
    if (currentWord >= Math.max(1, firstWordSeen - visibleWordPadding)) {
      startIndex = Math.max(0, index - 1);
      break;
    }
  }

  currentWord = 0;
  for (let index = 0; index < parts.length; index += 1) {
    if (!parts[index].trim()) continue;
    currentWord += 1;
    if (currentWord >= lastWordSeen + visibleWordPadding) {
      endIndex = Math.min(parts.length - 1, index + 1);
      break;
    }
  }

  const visibleParts = parts.slice(startIndex, endIndex + 1);

  return [
    startIndex > 0 ? <span key="prefix">… </span> : null,
    ...visibleParts.map((part, index) => {
      if (!part.trim()) return part;
      const normalizeWord = getDisplayWordNormalizer(part);
      const normalizedPart = normalizeWord(part);
      const isMatch = tokens.some((token) => {
        if (!token) return false;
        return (
          normalizedPart.includes(token) ||
          token.includes(normalizedPart) ||
          normalizedPart.startsWith(token) ||
          token.startsWith(normalizedPart)
        );
      });
      return isMatch ? (
        <span
          key={`${part}-${startIndex + index}`}
          className="header-search-suggestion-hit"
        >
          {part}
        </span>
      ) : (
        part
      );
    }),
    endIndex < parts.length - 1 ? <span key="suffix"> …</span> : null,
  ];
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
  const settingsSection = isTanakh ? "tanakh" : isNt ? "nt" : "quran";
  const settingsHref = `/settings?section=${settingsSection}`;
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dirty = window.sessionStorage.getItem("quran_translations_dirty");
    if (dirty) {
      window.sessionStorage.removeItem("quran_translations_dirty");
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
  const currentSearchContext = useMemo(() => {
    if (isTanakh || isNt) {
      return {
        book: selectedTanakhBook || selectedBook || "",
        chapter: selectedTanakhChapter || selectedChapter || "",
      };
    }
    return {
      sura: selectedSuraNumber || "",
    };
  }, [
    isNt,
    isTanakh,
    selectedBook,
    selectedChapter,
    selectedSuraNumber,
    selectedTanakhBook,
    selectedTanakhChapter,
  ]);

  const [translationName, setTranslationName] = useState("");
  const [suraNameTranslations, setSuraNameTranslations] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const lastSuggestionKeyRef = useRef("");
  const searchInputWrapRef = useRef(null);
  const searchSuggestionsRef = useRef(null);
  const searchBlurTimerRef = useRef(null);
  const [suggestionsOverlayStyle, setSuggestionsOverlayStyle] = useState(null);
  const [suggestionsBackdropStyle, setSuggestionsBackdropStyle] = useState(null);
  const [mobileSearchPinned, setMobileSearchPinned] = useState(false);
  const [mobileSearchPinnedHeight, setMobileSearchPinnedHeight] = useState(0);

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
      setSuraNameTranslations({});
      return;
    }

    Promise.all([
      fetch(`${API_BASE}/quran/sura-names?lang=${encodeURIComponent(firstCode)}`, {
        cache: "no-store",
      }),
      fetch(`${API_BASE}/quran/translations`, { cache: "no-store" }),
    ])
      .then(async ([namesRes, translationsRes]) => {
        const namesData = namesRes.ok ? await namesRes.json() : { names: {} };
        const translationsData = translationsRes.ok
          ? await translationsRes.json()
          : { translations: [] };
        const match = (translationsData.translations || []).find(
          (t) => t.languageCode === firstCode
        );
        setSuraNameTranslations(namesData.names || {});
        setTranslationName(getReadableTranslationName(match, firstCode));
      })
      .catch(() => {
        setSuraNameTranslations({});
        setTranslationName(getReadableTranslationName(null, firstCode));
      });
  }, [pathname]);

  useEffect(() => {
    if (!pathname || pathname === "/settings") return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem("last-page", pathname);
  }, [pathname]);

  useEffect(() => {
    const normalizedQuery = String(searchQuery || "").replace(/^\s+/, "");
    const trimmed = normalizedQuery.trim();
    const scope = isTanakh ? "tanakh" : isNt ? "nt" : "quran";
    if (trimmed.length < 2) {
      setSearchSuggestions([]);
      setSuggestionsLoading(false);
      lastSuggestionKeyRef.current = "";
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const bibleTranslations = (
          window.localStorage.getItem("bible_translations") ||
          readCookie("bible_translations")
        )
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        const quranTranslationLang = (
          window.localStorage.getItem("quran_translations") ||
          readCookie("quran_translations")
        )
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)[0] || "";
        const params = new URLSearchParams({
          q: normalizedQuery,
          scope,
          limit: "10",
        });
        if ((scope === "tanakh" || scope === "nt") && bibleTranslations.length) {
          params.set("translations", bibleTranslations.join(","));
        }
        if (scope === "quran" && quranTranslationLang) {
          params.set("lang", quranTranslationLang);
        }
        if (scope === "tanakh" || scope === "nt") {
          if (currentSearchContext.book) {
            params.set("currentBook", currentSearchContext.book);
          }
          if (currentSearchContext.chapter) {
            params.set("currentChapter", String(currentSearchContext.chapter));
          }
        } else if (currentSearchContext.sura) {
          params.set("currentSura", String(currentSearchContext.sura));
        }
        const requestKey = params.toString();
        if (lastSuggestionKeyRef.current === requestKey) {
          return;
        }
        lastSuggestionKeyRef.current = requestKey;
        setSuggestionsLoading(true);
        const res = await fetch(`${API_BASE}/search/text/suggest?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          setSearchSuggestions([]);
          if (res.status === 429) {
            setSuggestionsLoading(false);
          }
          return;
        }
        const data = await res.json();
        setSearchSuggestions(Array.isArray(data.results) ? data.results : []);
      } catch (err) {
        if (err?.name !== "AbortError") {
          setSearchSuggestions([]);
        }
      } finally {
        setSuggestionsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [currentSearchContext, isNt, isTanakh, searchQuery]);

  useEffect(() => {
    setSearchSuggestions([]);
    setSuggestionsLoading(false);
    lastSuggestionKeyRef.current = "";
    setMobileSearchPinned(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (searchBlurTimerRef.current) {
        window.clearTimeout(searchBlurTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      !mobileSearchPinned ||
      typeof window === "undefined" ||
      window.innerWidth > 991.98
    ) {
      return undefined;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlScrollBehavior = html.style.scrollBehavior;
    const previousBodyScrollBehavior = body.style.scrollBehavior;

    html.classList.add("mobile-search-active");
    body.classList.add("mobile-search-active");
    html.style.scrollBehavior = "auto";
    body.style.scrollBehavior = "auto";

    const ensureSearchAtTop = () => {
      const anchor =
        searchInputWrapRef.current?.closest(".navbar") || searchInputWrapRef.current;
      if (anchor && typeof anchor.scrollIntoView === "function") {
        anchor.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "auto",
        });
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    ensureSearchAtTop();
    const timer = window.setTimeout(ensureSearchAtTop, 60);
    const timer2 = window.setTimeout(ensureSearchAtTop, 180);
    const raf1 = window.requestAnimationFrame(ensureSearchAtTop);
    const raf2 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(ensureSearchAtTop);
    });
    window.visualViewport?.addEventListener("resize", ensureSearchAtTop);
    window.visualViewport?.addEventListener("scroll", ensureSearchAtTop);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(timer2);
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.visualViewport?.removeEventListener("resize", ensureSearchAtTop);
      window.visualViewport?.removeEventListener("scroll", ensureSearchAtTop);
      html.classList.remove("mobile-search-active");
      body.classList.remove("mobile-search-active");
      html.style.scrollBehavior = previousHtmlScrollBehavior;
      body.style.scrollBehavior = previousBodyScrollBehavior;
    };
  }, [mobileSearchPinned]);

  useEffect(() => {
    const hasSuggestionsUi =
      suggestionsLoading || searchSuggestions.length > 0;
    if (!hasSuggestionsUi) {
      setSuggestionsOverlayStyle(null);
      setSuggestionsBackdropStyle(null);
      return undefined;
    }

    const updateOverlayPosition = () => {
      if (typeof window === "undefined") return;
      const inputWrap = searchInputWrapRef.current;
      if (!inputWrap) return;
      const rect = inputWrap.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportHeight = viewport?.height || window.innerHeight;
      const viewportOffsetTop = viewport?.offsetTop || 0;
      const isMobileViewport = window.innerWidth <= 991.98;
      const gap = isMobileViewport ? 4 : 6;
      const overlayTop = Math.max(rect.bottom + gap, 0);
      const backdropTop = Math.max(overlayTop + viewportOffsetTop, 0);

      if (isMobileViewport) {
        const availableBelow = Math.max(viewportHeight - rect.bottom - gap - 8, 140);
        setSuggestionsOverlayStyle({
          top: rect.height + gap,
          left: 0,
          width: "100%",
          height: Math.min(availableBelow, 320),
        });
        setSuggestionsBackdropStyle({
          top: backdropTop,
          height: Math.max(viewportHeight - rect.bottom - gap, 140),
        });
        return;
      }

      setSuggestionsOverlayStyle({
        top: overlayTop,
        left: rect.left,
        width: rect.width,
        height: Math.max(window.innerHeight - overlayTop - 12, 180),
      });
      setSuggestionsBackdropStyle({
        top: overlayTop,
        height: Math.max(window.innerHeight - overlayTop, 180),
      });
    };

    updateOverlayPosition();
    window.addEventListener("resize", updateOverlayPosition);
    window.addEventListener("scroll", updateOverlayPosition, true);
    window.visualViewport?.addEventListener("resize", updateOverlayPosition);
    window.visualViewport?.addEventListener("scroll", updateOverlayPosition);

    return () => {
      window.removeEventListener("resize", updateOverlayPosition);
      window.removeEventListener("scroll", updateOverlayPosition, true);
      window.visualViewport?.removeEventListener("resize", updateOverlayPosition);
      window.visualViewport?.removeEventListener("scroll", updateOverlayPosition);
    };
  }, [suggestionsLoading, searchSuggestions.length]);

  const handleSearchFocus = () => {
    if (typeof window === "undefined" || window.innerWidth > 991.98) return;
    if (searchBlurTimerRef.current) {
      window.clearTimeout(searchBlurTimerRef.current);
      searchBlurTimerRef.current = null;
    }
    const inputWrap = searchInputWrapRef.current;
    if (inputWrap) {
      setMobileSearchPinnedHeight(
        Math.max(inputWrap.getBoundingClientRect().height, 54)
      );
    }
    setMobileSearchPinned(true);
  };

  const handleSearchBlur = () => {
    if (typeof window === "undefined" || window.innerWidth > 991.98) return;
    if (searchBlurTimerRef.current) {
      window.clearTimeout(searchBlurTimerRef.current);
    }
    searchBlurTimerRef.current = window.setTimeout(() => {
      const activeElement = document.activeElement;
      const inputWrap = searchInputWrapRef.current;
      const suggestions = searchSuggestionsRef.current;
      const isStillInside =
        !!activeElement &&
        ((inputWrap && inputWrap.contains(activeElement)) ||
          (suggestions && suggestions.contains(activeElement)));
      if (!isStillInside) {
        setMobileSearchPinned(false);
      }
      searchBlurTimerRef.current = null;
    }, 120);
  };

  useEffect(() => {
    const hasSuggestionsUi =
      suggestionsLoading || searchSuggestions.length > 0;
    if (!hasSuggestionsUi || typeof document === "undefined") {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const inputWrap = searchInputWrapRef.current;
      const suggestions = searchSuggestionsRef.current;
      const target = event.target;
      if (
        (inputWrap && inputWrap.contains(target)) ||
        (suggestions && suggestions.contains(target))
      ) {
        return;
      }
      setSearchSuggestions([]);
      setSuggestionsLoading(false);
      setMobileSearchPinned(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [suggestionsLoading, searchSuggestions.length]);

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
    setSearchSuggestions([]);
    setMobileSearchPinned(false);
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

  const handleSuggestionClick = (item) => {
    const href = buildSearchSuggestionHref(item);
    setSearchSuggestions([]);
    setSearchQuery("");
    setMobileSearchPinned(false);
    if (typeof document !== "undefined") {
      const collapse = document.getElementById("navbarContent");
      if (collapse && collapse.classList.contains("show")) {
        collapse.classList.remove("show");
      }
      const toggler = document.querySelector(".navbar-toggler");
      if (toggler) {
        toggler.setAttribute("aria-expanded", "false");
      }
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nav-open", "0");
    }
    if (typeof window !== "undefined") {
      window.location.assign(href);
      return;
    }
    router.push(href);
  };

  const handleFullResultsClick = () => {
    const normalizedQuery = String(searchQuery || "").replace(/^\s+/, "");
    const trimmed = normalizedQuery.trim();
    if (!trimmed) return;
    const scope = isTanakh ? "tanakh" : isNt ? "nt" : "quran";
    setSearchSuggestions([]);
    setMobileSearchPinned(false);
    if (typeof document !== "undefined") {
      const collapse = document.getElementById("navbarContent");
      if (collapse && collapse.classList.contains("show")) {
        collapse.classList.remove("show");
      }
      const toggler = document.querySelector(".navbar-toggler");
      if (toggler) {
        toggler.setAttribute("aria-expanded", "false");
      }
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nav-open", "0");
    }
    const params = new URLSearchParams({
      q: trimmed,
      scope,
    });
    if (typeof window !== "undefined") {
      const bibleTranslations = (
        window.localStorage.getItem("bible_translations") ||
        readCookie("bible_translations")
      )
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const quranTranslations = (
        window.localStorage.getItem("quran_translations") ||
        readCookie("quran_translations")
      )
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if ((scope === "tanakh" || scope === "nt") && bibleTranslations.length) {
        params.set("translations", bibleTranslations.join(","));
      }
      if (scope === "quran" && quranTranslations.length) {
        params.set("lang", quranTranslations[0]);
      }
    }
    if (scope === "tanakh" || scope === "nt") {
      if (currentSearchContext.book) params.set("currentBook", currentSearchContext.book);
      if (currentSearchContext.chapter) {
        params.set("currentChapter", String(currentSearchContext.chapter));
      }
    } else if (currentSearchContext.sura) {
      params.set("currentSura", String(currentSearchContext.sura));
    }
    router.push(`/search-suggest?${params.toString()}`);
  };

  const bookOptions = useMemo(() => Object.keys(tanakhMenu), [tanakhMenu]);
  const selectedBookLabel = useMemo(
    () => (selectedTanakhBook ? getBookLabel(selectedTanakhBook) : ""),
    [selectedTanakhBook]
  );
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

  const renderSearchForm = () => (
    <form className="header-search" onSubmit={runTextSearch}>
      {mobileSearchPinned && (
        <div
          className="header-search-input-spacer"
          aria-hidden="true"
          style={{ height: `${mobileSearchPinnedHeight || 56}px` }}
        />
      )}
      <div
        className={`header-search-input-wrap${
          mobileSearchPinned ? " mobile-search-pinned" : ""
        }`}
        ref={searchInputWrapRef}
      >
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
        />
        {(suggestionsLoading || searchSuggestions.length > 0) && (
          <>
            <div
              className="header-search-backdrop"
              style={suggestionsBackdropStyle || undefined}
            />
            <div
              ref={searchSuggestionsRef}
              className="header-search-suggestions"
              style={suggestionsOverlayStyle || undefined}
            >
            <div className="header-search-suggestions-list">
              {searchSuggestions.map((item) => (
                <button
                  key={`${item.corpus}:${item.ref}:${item.languageCode || ""}`}
                  type="button"
                  className="header-search-suggestion"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <span className="header-search-suggestion-ref">
                    {formatSearchSuggestionLabel(item)}
                  </span>
                  <span className="header-search-suggestion-body">
                    <span className={getSuggestionTextClass(item)}>
                      {renderHighlightedSuggestionText(item.text, searchQuery)}
                    </span>
                  </span>
                </button>
              ))}
              {suggestionsLoading && !searchSuggestions.length && (
                <div className="header-search-suggestion-empty">Searching…</div>
              )}
            </div>
            {searchQuery.trim().length >= 2 && (
              <button
                type="button"
                className="header-search-full-results"
                onClick={handleFullResultsClick}
              >
                Show full results
              </button>
            )}
            </div>
          </>
        )}
      </div>
    </form>
  );

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
        </div>
      </div>

      <div className="header-row header-row-bottom d-none d-lg-flex w-100">
        {(isTanakh || isNt) ? (
          <div className="header-bible-panel-desktop w-100">
            {showTranslationToggle && (
              <div className="header-bible-panel-actions">
                <TranslationToggle />
                <Link
                  className="header-settings-link"
                  href={settingsHref}
                >
                  Settings
                </Link>
              </div>
            )}
            <div className="header-bible-panel-controls">
              <div className="header-bible-selectors">
                <div className="dropdown w-100 header-dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle w-100 text-left"
                    type="button"
                    id="bookDropdownPanel"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    {selectedBookLabel || "Select a book"}
                  </button>
                  <div
                    className="dropdown-menu w-100"
                    aria-labelledby="bookDropdownPanel"
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
                        {getBookLabel(book)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="dropdown w-100 header-dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle w-100 text-left"
                    type="button"
                    id="chapterDropdownPanel"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                    disabled={!selectedTanakhBook}
                  >
                    {selectedTanakhChapter || "Select a chapter"}
                  </button>
                  <div
                    className="dropdown-menu w-100"
                    aria-labelledby="chapterDropdownPanel"
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
              {renderSearchForm()}
            </div>
          </div>
        ) : (
          <>
          {renderSearchForm()}
          {showTranslationToggle && (
            <div className="header-translation-inline d-flex align-items-center">
              <TranslationToggle />
              <Link
                className="header-settings-link ml-2"
                href={settingsHref}
              >
                Settings
              </Link>
            </div>
          )}
          </>
        )}
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
                <TranslationToggle />
                <Link
                  className="header-settings-link"
                  href={settingsHref}
                >
                  Settings
                </Link>
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
                  {selectedBookLabel || "Select a book"}
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
                      {getBookLabel(book)}
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
            <div className="form-group mb-0">
              {renderSearchForm()}
            </div>
          </div>
        ) : showTranslationToggle ? (
          <div className="w-100 mt-3 p-3 bg-white rounded shadow-sm d-md-none">
            <div className="form-group d-flex align-items-center justify-content-between mb-0">
              <Link
                className="header-settings-link"
                href={settingsHref}
              >
                Settings
              </Link>
              <TranslationToggle />
            </div>
          </div>
        ) : null}

        {!(isTanakh || isNt) && (
          <div className="d-lg-none mt-3 mb-3">
            {renderSearchForm()}
          </div>
        )}
      </div>
    </nav>
  );
}
