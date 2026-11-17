const researchService = require("./research.service");
const { ApiError, sendSuccess } = require("../../utils/apiResponse");

async function importCsv(req, res, next) {
  try {
    if (!req.file) {
      throw ApiError.badRequest('CSV file is required in field "file"');
    }

    const report = await researchService.importResearchCsv(
      req.file.buffer,
      req.file.originalname,
    );
    return sendSuccess(res, 201, report, "CSV import finished");
  } catch (error) {
    return next(error);
  }
}

async function createManual(req, res, next) {
  try {
    const paper = await researchService.createManualResearch(req.body || {});
    return sendSuccess(res, 201, paper, "Research paper created");
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const result = await researchService.listResearch(req.query);
    return sendSuccess(res, 200, result, "Research papers fetched");
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const paper = await researchService.getResearchById(req.params.id);
    return sendSuccess(res, 200, paper, "Research paper fetched");
  } catch (error) {
    return next(error);
  }
}
const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

async function importOpenAlex(req, res, next) {
  try {
    const orcid = String(req.body?.orcid || "").trim();
    if (!ORCID_PATTERN.test(orcid)) {
      throw ApiError.badRequest("orcid must look like 0000-0002-1825-0097");
    }

    const report = await researchService.importFromOpenAlex(orcid);
    return sendSuccess(res, 201, report, "OpenAlex import finished");
  } catch (error) {
    return next(error);
  }
}

module.exports = { importCsv, createManual, list, getById, importOpenAlex };