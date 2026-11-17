const { ApiError } = require("../utils/apiResponse");

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = "Internal server error";

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "MulterError") {
    statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 5MB)" : err.message;
  } else if (err.status === 400 || err.status === 413) {
    statusCode = err.status;
    message = err.expose ? err.message : "Bad request";
  } else if (err.name === "CastError" || err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }

  if (statusCode === 500) {
    console.error(err);
  }

  return res.status(statusCode).json({ success: false, message });
}

module.exports = errorHandler;