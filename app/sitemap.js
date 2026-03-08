const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.quranalive.com";

const buildUrl = (path) =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export default function sitemap() {
  const now = new Date();

  const staticPages = [
    {
      url: buildUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: buildUrl("/search"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: buildUrl("/search-text"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: buildUrl("/settings"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: buildUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: buildUrl("/tanakh/GEN%201"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: buildUrl("/nt/MT%201"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const quranSuraPages = Array.from({ length: 114 }, (_, i) => ({
    url: buildUrl(`/${i + 1}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...quranSuraPages];
}
