"use client";

import { useState } from "react";

export default function CopyChapterHebrew({ text = "" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-primary btn-sm copy-chapter-btn"
      onClick={copy}
      aria-label="Copy entire chapter (Hebrew)"
      title={copied ? "Copied!" : "Copy chapter"}
    >
      <i className={`bi ${copied ? "bi-clipboard-check" : "bi-clipboard"}`} />
    </button>
  );
}
