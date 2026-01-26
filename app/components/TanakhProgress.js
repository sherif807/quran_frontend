"use client";

import { useEffect, useMemo, useState } from "react";

export default function TanakhProgress({ totalVerses = 0 }) {
  const [currentVerse, setCurrentVerse] = useState(1);
  const [visible, setVisible] = useState(false);

  const totalLabel = useMemo(() => Number(totalVerses) || 0, [totalVerses]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const verseNodes = Array.from(
      document.querySelectorAll("[data-verse-ref]")
    );

    const pickCurrent = () => {
      if (!verseNodes.length) return;

      let best = null;
      let bestTop = Number.POSITIVE_INFINITY;

      for (const node of verseNodes) {
        const rect = node.getBoundingClientRect();
        const top = rect.top;
        if (top >= 0 && top < bestTop) {
          best = node;
          bestTop = top;
        }
      }

      if (!best) {
        best = verseNodes[verseNodes.length - 1];
      }

      const ref = best.getAttribute("data-verse-ref") || "";
      const parts = ref.split(":");
      const versePart = parts.length > 1 ? parts[1] : "";
      const verseNumber = Number(versePart);
      if (!Number.isNaN(verseNumber) && verseNumber > 0) {
        setCurrentVerse(verseNumber);
      }
    };

    let rafId = null;
    let hideTimer = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (window.scrollY > 20) {
          setVisible(true);
          if (hideTimer) window.clearTimeout(hideTimer);
          hideTimer = window.setTimeout(() => {
            setVisible(false);
          }, 700);
        } else {
          setVisible(false);
        }
        pickCurrent();
      });
    };

    pickCurrent();
    setVisible(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  if (!totalLabel) return null;

  return (
    <div className={`tanakh-progress ${visible ? "is-visible" : ""}`}>
      {currentVerse}/{totalLabel} verses
    </div>
  );
}
