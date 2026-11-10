// Matching normalizes recitation spelling only; callers always render the
// original Uthmani text. Keep this shared by compact autocomplete and the
// full-results page so a word is highlighted consistently in both places.
export const normalizeQuranArabicForMatch = (value) =>
  String(value || "")
    // Quranic dagger alif is pronounced alif, rather than removable decoration.
    .replace(/[\u0670]/g, "\u0627")
    .replace(/[\u064B-\u065F\u06D6-\u06ED]/g, "")
    .replace(/[\u0640]/g, "")
    .replace(/[\u0671\u0622\u0623\u0625]/g, "\u0627")
    .replace(/[\u0649]/g, "\u064A")
    .replace(/[\u0629]/g, "\u0647")
    .replace(/[\u0624\u0626\u0621]/g, "\u0621")
    .replace(/\s+/g, " ")
    .trim();

const buildArabicTokenRegex = (token) => {
  if (!token) return null;
  const buildPattern = (value) =>
    value
      .split("")
      .map((ch) => {
        if (ch === "ا") return "(?:ا|ء)?";
        if (ch === "ه") return "[هة]";
        if (ch === "ي") return "[يى]";
        if (ch === "ء") return "(?:[ءؤئ]|ا)?";
        return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
  return new RegExp(buildPattern(token));
};

const hasArabicStemMatch = (word, token) => {
  const removeLeadingClitic = (value) => value.replace(/^[وفبكل]/, "");
  const left = removeLeadingClitic(
    normalizeQuranArabicForMatch(word).replace(/\s+/g, ""),
  );
  const right = removeLeadingClitic(
    normalizeQuranArabicForMatch(token).replace(/\s+/g, ""),
  );
  if (left.length < 3 || right.length < 3) return false;

  for (let leftStart = 0; leftStart < left.length; leftStart += 1) {
    for (let rightStart = 0; rightStart < right.length; rightStart += 1) {
      let length = 0;
      while (
        left[leftStart + length] &&
        left[leftStart + length] === right[rightStart + length]
      ) {
        length += 1;
        if (length >= 3) return true;
      }
    }
  }
  return false;
};

export const matchesQuranArabicWord = (word, queryTokens) => {
  const cleanedWord = normalizeQuranArabicForMatch(word).replace(/\s+/g, "");
  if (!cleanedWord) return false;

  return queryTokens.some((rawToken) => {
    const token = normalizeQuranArabicForMatch(rawToken).replace(/\s+/g, "");
    if (!token) return false;
    const regex = buildArabicTokenRegex(token);
    return (
      (regex ? regex.test(cleanedWord) : false) ||
      cleanedWord.includes(token) ||
      (cleanedWord.length >= 3 && token.includes(cleanedWord)) ||
      hasArabicStemMatch(cleanedWord, token)
    );
  });
};
