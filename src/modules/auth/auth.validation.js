const Joi = require("joi");



const register = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email:Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(128).required(),
  // Only these roles can self-register. admin must be created manually.
  role: Joi.string().valid("researcher", "industryPartner").default("researcher"),
});

const login = Joi.object({
  email:Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

const refresh = Joi.object({
  refreshToken: Joi.string().optional(),
});

module.exports = { register, login, refresh };