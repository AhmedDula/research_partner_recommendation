const mongoose = require("mongoose");
const { env } = require("./env.js");

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(env.db.mongoUri, {
        dbName: "research_partner_recommendation",
      });
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(
        `MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`,
      );
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      console.log(`Retrying in ${RETRY_INTERVAL_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Mongoose will try to reconnect.");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected.");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed.");
  process.exit(0);
});

module.exports = { connectDB };