const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const { env } = require("./config/env.js");

const errorHandler = require("./middlewares/errorHandler");
const { ApiError } = require("./utils/apiResponse");

const app = express();
app.use(cookieParser())
app.use(helmet());
app.use(hpp());
app.use(cors({ origin: env.client.url, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

if (env.app.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});
// api
app.use("/api/v1/auth", require('./modules/auth/auth.routes'));
app.use("/api/v1/research", require("./modules/research/research.routes"));
app.use(
  "/api/v1/similarity",
  require("./modules/similarity/similarity.routes"),
);

app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

app.use(errorHandler);

module.exports = app;
