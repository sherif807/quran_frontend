import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import localFont from "next/font/local";

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

const torahSofer = localFont({
  src: [
    { path: "../public/fonts/hebrew/TorahSofer.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/hebrew/TorahSofer.woff", weight: "400", style: "normal" },
    { path: "../public/fonts/hebrew/TorahSofer.ttf", weight: "400", style: "normal" },
  ],
  display: "swap",
  variable: "--font-hebrew",
});

export const metadata = {
  title: "Quran Viewer",
  description: "Next.js frontend mirroring the existing Twig theme",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      dir="rtl"
      className={`${scheherazade.variable} ${scheherazadeBold.variable} ${torahSofer.variable}`}
    >
      <head />
      <body className="bg-light">
        <div className="container py-3">{children}</div>
      </body>
    </html>
  );
}
