const axios = require("axios");
const { env } = require("../../config/env.js");
const { ApiError } = require("../../utils/apiResponse");

const aiClient = axios.create({
  timeout: env.ai.timeoutMs,
  headers: { "Content-Type": "application/json" },
});

async function requestSimilarity(payload) {
  if (env.ai.mock) {
    return { matches: [] };
  }

  if (!env.ai.url) {
    throw new ApiError(503, "AI service URL is not configured");
  }

  try {
    const { data } = await aiClient.post(env.ai.url, payload);
    return data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new ApiError(504, "AI service timed out");
    }
    if (error.response) {
      throw new ApiError(502, `AI service returned ${error.response.status}`);
    }
    throw new ApiError(503, "AI service is unavailable");
  }
}

module.exports = { requestSimilarity, isMock: () => env.ai.mock };