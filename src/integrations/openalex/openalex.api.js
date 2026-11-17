const axios = require("axios");
const { env } = require("../../config/env.js");

const openAlexClient = axios.create({
  baseURL: "https://api.openalex.org",
  timeout: 10000,
  headers: { Accept: "application/json" },
});

openAlexClient.interceptors.request.use((config) => {
  if (env.openAlex.apiKey) {
    config.params = { ...config.params, api_key: env.openAlex.apiKey };
  }
  return config;
});

module.exports = { openAlexClient };