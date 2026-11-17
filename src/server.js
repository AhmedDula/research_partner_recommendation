const { env } = require("./config/env.js");
const app = require("./app.js");
const { connectDB } = require("./config/db.js");

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

const start = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }

  const server = app.listen(env.app.port, () => {
    console.log(`Server running on port ${env.app.port} [${env.app.nodeEnv}]`);
  });

  process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err.message);
    server.close(() => process.exit(1));
  });
};

start();