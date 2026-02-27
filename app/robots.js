const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quranalive.com";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/word-root/",
          "/tanakh/word-root/",
          "/nt/word-root/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
