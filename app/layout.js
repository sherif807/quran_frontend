import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import localFont from "next/font/local";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Noto_Serif_Hebrew } from "next/font/google";
import Script from "next/script";

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
  title: "Quran Viewer",
  description: "Next.js frontend mirroring the existing Twig theme",
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
        <div className="container py-3">{children}</div>
      </body>
    </html>
  );
}
