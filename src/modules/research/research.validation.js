const Joi = require("joi");

const researchSchema = Joi.object({
  source: Joi.string().valid("csv", "manual", "openalex").required(),
  title: Joi.string().trim().min(3).max(500).required(),
  authors: Joi.array().items(Joi.string().trim()).default([]),
  year: Joi.number().integer().min(1900).max(2100).optional(),
  venue: Joi.string().trim().max(300).optional(),
  doi: Joi.string().trim().lowercase().pattern(/^10\.\d{4,9}\/\S+$/).optional(),
  abstract: Joi.string().trim().max(10000).optional(),
  keywords: Joi.array().items(Joi.string().trim().lowercase()).default([]),
  contentHash: Joi.string().length(64).required(),
}).unknown(false);

function validateResearch(record) {
  const { error, value } = researchSchema.validate(record, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      valid: false,
      errors: error.details.map((d) => d.message),
    };
  }

  return { valid: true, value };
}

module.exports = { validateResearch };