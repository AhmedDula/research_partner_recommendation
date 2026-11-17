const multer = require("multer");
const { ApiError } = require("./apiResponse");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["text/csv", "application/vnd.ms-excel", "text/plain"];

function csvFileFilter(req, file, cb) {
  const hasCsvExtension = file.originalname.toLowerCase().endsWith(".csv");
  const hasAllowedMime = ALLOWED_MIME_TYPES.includes(file.mimetype);

  if (!hasCsvExtension || !hasAllowedMime) {
    return cb(ApiError.badRequest("Only .csv files are allowed"));
  }
  cb(null, true);
}

const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 2 },
  fileFilter: csvFileFilter,
});

module.exports = { uploadCsv };