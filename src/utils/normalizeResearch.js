const crypto = require("crypto");

function toList(value, separator = ";") {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(separator)
      : [];
  return items.map((item) => String(item).trim()).filter(Boolean);
}

function cleanText(value) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

function normalizeYear(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return undefined;
  return year;
}

function normalizeDoi(value) {
  const doi = cleanText(value);
  return doi ? doi.toLowerCase() : undefined;
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function computeContentHash({ title, year, authors }) {
  const normalizedTitle = normalizeText(title || "");
  const normalizedAuthors = (authors || [])
    .map((a) => normalizeText(a))
    .sort()
    .join("|");

  const payload = `${normalizedTitle}::${year || ""}::${normalizedAuthors}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function normalizeResearch(raw, source = "csv") {
  const title = cleanText(raw.title) || "";
  const authors = toList(raw.authors);
  const year = normalizeYear(raw.year);

  return {
    source,
    title,
    authors,
    year,
    venue: cleanText(raw.venue),
    doi: normalizeDoi(raw.doi),
    abstract: cleanText(raw.abstract),
    keywords: toList(raw.keywords).map((k) => k.toLowerCase()),
    contentHash: computeContentHash({ title, year, authors }),
  };
}

module.exports = { normalizeResearch, computeContentHash };