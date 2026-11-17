const { openAlexClient } = require("./openalex.api");
const { ApiError } = require("../../utils/apiResponse");

const PAGE_SIZE = 100;
const MAX_PAGES = 10; 

function mapProviderError(error) {
  if (error.response?.status === 429) {
    return new ApiError(429, "OpenAlex rate limit reached, try again later");
  }
  return new ApiError(503, "OpenAlex is unavailable right now");
}

function shortId(url) {
  return url ? url.split("/").pop() : undefined;
}

function stripDoiPrefix(doi) {
  return doi ? doi.replace(/^https?:\/\/doi\.org\//i, "") : undefined;
}

function rebuildAbstract(invertedIndex) {
  if (!invertedIndex) return undefined;
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) {
      words[position] = word;
    }
  }
  return words.filter(Boolean).join(" ") || undefined;
}

async function getAuthorByOrcid(orcid) {
  try {
    const { data } = await openAlexClient.get(`/authors/orcid:${orcid}`);
    return data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw ApiError.notFound("No OpenAlex author found for this ORCID");
    }
    throw mapProviderError(error);
  }
}

async function fetchWorksByAuthor(authorId) {
  const works = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    let data;
    try {
      ({ data } = await openAlexClient.get("/works", {
        params: {
          filter: `author.id:${authorId}`,
          per_page: PAGE_SIZE,
          page,
        },
      }));
    } catch (error) {
      throw mapProviderError(error);
    }

    works.push(...data.results);
    if (data.results.length < PAGE_SIZE) break;
  }

  return works;
}

function toResearchRecord(work) {
  return {
    externalId: shortId(work.id),
    doi: stripDoiPrefix(work.doi),
    title: work.title || work.display_name,
    authors: (work.authorships || [])
      .map((a) => a.author?.display_name)
      .filter(Boolean),
    year: work.publication_year,
    venue: work.primary_location?.source?.display_name,
    abstract: rebuildAbstract(work.abstract_inverted_index),
    keywords: (work.topics || []).slice(0, 5).map((t) => t.display_name),
  };
}

module.exports = {
  getAuthorByOrcid,
  fetchWorksByAuthor,
  toResearchRecord,
};