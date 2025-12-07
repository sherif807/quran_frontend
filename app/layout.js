import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";

export const metadata = {
  title: "Quran Viewer",
  description: "Next.js frontend mirroring the existing Twig theme",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="rtl">
      <head>
      </head>
      <body className="bg-light">
        <div className="container py-3">{children}</div>
      </body>
    </html>
  );
}
