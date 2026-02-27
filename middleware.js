import { NextResponse } from "next/server";

const WORD_ROOT_PATHS = [
  "/word-root/",
  "/tanakh/word-root/",
  "/nt/word-root/",
];

const BOT_UA_PATTERN =
  /(bot|crawler|spider|scrapy|python-requests|httpclient|okhttp|curl|wget|headless|phantom|selenium|playwright|puppeteer)/i;

const isWordRootPath = (pathname) =>
  WORD_ROOT_PATHS.some((prefix) => pathname.startsWith(prefix));

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const userAgent = req.headers.get("user-agent") || "";

  if (!isWordRootPath(pathname)) {
    return NextResponse.next();
  }

  if (BOT_UA_PATTERN.test(userAgent)) {
    return new NextResponse("Too many automated requests.", {
      status: 429,
      headers: {
        "Retry-After": "120",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/word-root/:path*", "/tanakh/word-root/:path*", "/nt/word-root/:path*"],
};
