// Response helper + re-export of ApiError
const ApiError = require("./ApiError");

function sendSuccess(res, statusCode, data, message = "OK") {
  return res.status(statusCode).json({ success: true, message,data });
}

module.exports = { ApiError, sendSuccess };