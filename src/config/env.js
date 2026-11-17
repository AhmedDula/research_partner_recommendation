const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(5000),

  MONGO_URI: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES: Joi.string().default("7d"),

  COOKIE_ACCESS_MAX_AGE: Joi.number().default(15 * 60 * 1000),
  COOKIE_REFRESH_MAX_AGE: Joi.number().default(7 * 24 * 60 * 60 * 1000),

  BCRYPT_SALT_ROUNDS: Joi.number().default(12),
  PEPPER: Joi.string().min(32).required(),

  CLIENT_URL: Joi.string().uri().required(),
  // OpenAlex
  OPENALEX_API_KEY: Joi.string().optional(),
  // AI service
  AI_SERVICE_URL: Joi.string().uri().optional(),
  AI_SERVICE_MOCK: Joi.boolean().default(true),
  AI_SERVICE_TIMEOUT_MS: Joi.number().default(15000),
}).unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) {
  console.error("Invalid environment variables:", error.message);
  process.exit(1);
}

const env = {
  app: {
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
  },
  db: {
    mongoUri: value.MONGO_URI,
  },
  jwt: {
    accessSecret: value.JWT_ACCESS_SECRET,
    refreshSecret: value.JWT_REFRESH_SECRET,
    accessExpires: value.JWT_ACCESS_EXPIRES,
    refreshExpires: value.JWT_REFRESH_EXPIRES,
  },
  cookies: {
    accessMaxAge: value.COOKIE_ACCESS_MAX_AGE,
    refreshMaxAge: value.COOKIE_REFRESH_MAX_AGE,
  },
  security: {
    bcryptSaltRounds: value.BCRYPT_SALT_ROUNDS,
    pepper: value.PEPPER,
  },
  client: {
    url: value.CLIENT_URL,
  },
  openAlex: {
    apiKey: value.OPENALEX_API_KEY,
  },
    ai: {
    url: value.AI_SERVICE_URL,
    mock: value.AI_SERVICE_MOCK,
    timeoutMs: value.AI_SERVICE_TIMEOUT_MS,
  },
};

module.exports = { env };
