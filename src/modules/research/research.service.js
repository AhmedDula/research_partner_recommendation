const mongoose = require("mongoose");
const ResearchPaper = require("./research.model");
const ImportReport = require("./importReport.model");
const { parseCsv } = require("../../utils/csvParser");
const { normalizeResearch } = require("../../utils/normalizeResearch");
const { validateResearch } = require("./research.validation");
const { ApiError } = require("../../utils/apiResponse");
const openAlex = require("../../integrations/openalex/openalex.service");

const DUPLICATE_MESSAGE = "Duplicate record (DOI or contentHash already exists)";

function prepareRecord(raw, source) {
  return validateResearch(normalizeResearch(raw, source));
}

async function saveRows(rows, source, report, rowOffset) {
  const counters = { inserted: 0, skipped: 0, failed: 0 };
  const rowErrors = [];

  for (let index = 0; index < rows.length; index++) {
    const rowNumber = index + rowOffset;
    const result = prepareRecord(rows[index], source);

    if (!result.valid) {
      counters.failed++;
      rowErrors.push({ row: rowNumber, message: result.errors.join("; ") });
      continue;
    }

    try {
      await ResearchPaper.create({ ...result.value, importId: report._id });
      counters.inserted++;
    } catch (error) {
      if (error.code === 11000) {
        counters.skipped++;
        rowErrors.push({ row: rowNumber, message: DUPLICATE_MESSAGE });
      } else {
        counters.failed++;
        rowErrors.push({ row: rowNumber, message: error.message });
      }
    }
  }

  report.inserted = counters.inserted;
  report.skipped = counters.skipped;
  report.failed = counters.failed;
  report.rowErrors = rowErrors;
  await report.save();

  return report;
}

async function importResearchCsv(buffer, fileName) {
  let rows;
  try {
    rows = parseCsv(buffer);
  } catch (error) {
    throw ApiError.badRequest(`Invalid CSV: ${error.message}`);
  }

  const report = await ImportReport.create({ fileName, totalRows: rows.length });
  return saveRows(rows, "csv", report, 2);
}

async function importFromOpenAlex(orcid) {
  const author = await openAlex.getAuthorByOrcid(orcid);
    const works = await openAlex.fetchWorksByAuthor(author.id.split("/").pop());
  const rows = works.map(openAlex.toResearchRecord);

  const report = await ImportReport.create({
    fileName: `openalex:${orcid}`,
    totalRows: rows.length,
  });
  return saveRows(rows, "openalex", report, 1);
}

async function createManualResearch(body) {
  const result = prepareRecord(body, "manual");

  if (!result.valid) {
    throw ApiError.badRequest(result.errors.join("; "));
  }

  try {
    return await ResearchPaper.create(result.value);
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict(DUPLICATE_MESSAGE);
    }
    throw error;
  }
}

async function listResearch({ page = 1, limit = 10, year, keyword } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));

  const filter = {};
  if (year !== undefined) {
    filter.year = Number(year);
    if (!Number.isInteger(filter.year)) {
      throw ApiError.badRequest("year must be an integer");
    }
  }
  if (keyword) {
    filter.keywords = String(keyword).toLowerCase();
  }

  const [items, total] = await Promise.all([
    ResearchPaper.find(filter)
      .sort({ year: -1, _id: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    ResearchPaper.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

async function getResearchById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest("Invalid research id");
  }

  const paper = await ResearchPaper.findById(id).lean();
  if (!paper) {
    throw ApiError.notFound("Research paper not found");
  }

  return paper;
}

module.exports = {
  importResearchCsv,
  importFromOpenAlex,
  createManualResearch,
  listResearch,
  getResearchById,
};