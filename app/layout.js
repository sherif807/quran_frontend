import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import localFont from "next/font/local";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Noto_Serif_Hebrew } from "next/font/google";
import Script from "next/script";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.quranalive.com";
const SITE_NAME = "QuranAlive";
const SITE_DESCRIPTION =
  "QuranAlive lets you read Quran in Arabic, Tanakh in Hebrew, and Gospel in Greek, then click any word for root or lemma lookup, interlinear study, translation matching, and listening tools across English, Arabic, Hebrew, and Greek.";

const scheherazade = localFont({
  src: "../public/fonts/Scheherazade-Regular.woff",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-scheherazade",
});

const scheherazadeBold = localFont({
  src: "../public/fonts/Scheherazade-Bold.woff",
  weight: "700",
  style: "normal",
  display: "swap",
  variable: "--font-scheherazade-bold",
});

const notoHebrew = Noto_Serif_Hebrew({
  weight: ["400", "700"],
  style: ["normal"],
  subsets: ["hebrew"],
  display: "swap",
  variable: "--font-hebrew",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} | Quran, Tanakh, and Gospel`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Quran",
    "Tanakh",
    "Gospel",
    "Bible",
    "word root",
    "lemma search",
    "interlinear",
    "translation matching",
    "scripture study",
    "original language scripture",
    "Arabic Quran text",
    "Hebrew Tanakh text",
    "Greek Gospel text",
    "click word search",
    "Arabic",
    "Hebrew",
    "Greek",
    "English",
    "القرآن",
    "التوراة",
    "الإنجيل",
    "תנ״ך",
    "בשורה",
    "εὐαγγέλιο",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} | Quran, Tanakh, and Gospel`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    alternateLocale: ["ar_AR", "he_IL", "el_GR"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Quran, Tanakh, and Gospel`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-WGKCH9GJTW";
  return (
    <html
      lang="en"
      dir="rtl"
      className={`${scheherazade.variable} ${scheherazadeBold.variable} ${notoHebrew.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              inLanguage: ["en", "ar", "he", "el"],
              about: ["Quran", "Tanakh", "Gospel", "word root", "lemma"],
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/search-text?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <link
          rel="preload"
          href="/fonts/Scheherazade-Regular.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Scheherazade-Bold.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/hebrew/TorahSofer.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-light">
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vn98f32q8a");
          `}
        </Script>
        <div className="container py-3">{children}</div>
      </body>
    </html>
  );
}
