"use client";

import { useRouter } from "next/navigation";

const LAST_PAGE_KEY = "last-page";

export default function BackButton({ fallbackHref = "/" }) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined") {
      const last = window.localStorage.getItem(LAST_PAGE_KEY);
      if (last && last !== "/settings") {
        router.push(last);
        return;
      }
      if (window.history.length > 1) {
        router.back();
        return;
      }
    }
    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary"
      onClick={goBack}
    >
      Back
    </button>
  );
}
