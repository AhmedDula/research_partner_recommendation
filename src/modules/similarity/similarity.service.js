const { normalizeResearch } = require("../../utils/normalizeResearch");
const { validateSimilarityFiles, validateAiResponse } = require("./similarity.validation");
const { requestSimilarity, isMock } = require("../../integrations/ai/ai.api");

function buildPayload(researchRows, challengeRows) {
  const researchPapers = researchRows.map((raw, index) => {
    const paper = normalizeResearch(raw, "csv");
    return {
      id: `R${index + 1}`,
      title: paper.title,
      abstract: paper.abstract || null,
      keywords: paper.keywords,
      year: paper.year || null,
      authors: paper.authors,
    };
  });

  const challenges = challengeRows.map((raw, index) => ({
    id: `C${index + 1}`,
    title: raw.title.trim(),
    domain: raw.domain ? raw.domain.trim() : null,
    description: raw.description.trim(),
    requiredSkills: (raw.required_skills || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean),
  }));

  return { researchPapers, challenges };
}

async function runSimilarity(files) {
  const { researchRows, challengeRows } = validateSimilarityFiles(files);
  const payload = buildPayload(researchRows, challengeRows);

  const raw = await requestSimilarity(payload);
  const { matches, dropped } = validateAiResponse(raw, payload);

  return {
    source: isMock() ? "mock" : "ai",
    counts: {
      researchPapers: payload.researchPapers.length,
      challenges: payload.challenges.length,
    },
    matches,
    dropped,
  };
}

module.exports = { runSimilarity };