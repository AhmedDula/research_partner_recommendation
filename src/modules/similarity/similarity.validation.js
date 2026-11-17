const { ApiError } = require("../../utils/apiResponse");
const { parseCsv } = require("../../utils/csvParser");

const REQUIRED_COLUMNS = {
  research: ["title"],
  challenge: ["title", "description"],
};

function parseAndCheck(file, kind) {
  if (!file) {
    throw ApiError.badRequest(`${kind} file is required (field "${kind}")`);
  }

  let rows;
  try {
    rows = parseCsv(file.buffer);
  } catch (error) {
    throw ApiError.badRequest(`${kind} file: ${error.message}`);
  }

  const headers = Object.keys(rows[0]);
  const missing = REQUIRED_COLUMNS[kind].filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw ApiError.badRequest(`${kind} file is missing columns: ${missing.join(", ")}`);
  }

  rows.forEach((row, index) => {
    for (const col of REQUIRED_COLUMNS[kind]) {
      if (!row[col] || !row[col].trim()) {
        throw ApiError.badRequest(`${kind} file row ${index + 2}: "${col}" is empty`);
      }
    }
  });

  return rows;
}

function validateSimilarityFiles(files) {
  return {
    researchRows: parseAndCheck(files?.research?.[0], "research"),
    challengeRows: parseAndCheck(files?.challenge?.[0], "challenge"),
  };
}

function validateAiResponse(raw, payload) {
  if (!raw || !Array.isArray(raw.matches)) {
    throw new ApiError(502, "AI service returned an invalid response");
  }

  const researchIds = new Set(payload.researchPapers.map((r) => r.id));
  const challengeIds = new Set(payload.challenges.map((c) => c.id));

  const matches = [];
  let dropped = 0;

  for (const m of raw.matches) {
    const ok =
      challengeIds.has(m.challengeId) &&
      researchIds.has(m.researchId) &&
      typeof m.score === "number" &&
      m.score >= 0 &&
      m.score <= 1;

    if (ok) {
      matches.push({ challengeId: m.challengeId, researchId: m.researchId, score: m.score });
    } else {
      dropped++;
    }
  }

  return { matches, dropped };
}

module.exports = { validateSimilarityFiles, validateAiResponse };