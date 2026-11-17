// Validate req.body against a Joi schema
const ApiError = require("../utils/ApiError");

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return next(
      ApiError.badRequest(error.details.map((d) => d.message).join("; ")),
    );
  }

  req.body = value;
  return next();
};

module.exports = validate;