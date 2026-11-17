const similarityService = require("./similarity.service");
const { sendSuccess } = require("../../utils/apiResponse");

async function run(req, res, next) {
  try {
    const result = await similarityService.runSimilarity(req.files);
    return sendSuccess(res, 200, result, "Similarity run finished");
  } catch (error) {
    return next(error);
  }
}

module.exports = { run };