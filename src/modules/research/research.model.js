const mongoose = require("mongoose");

const researchPaperSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["csv", "manual", "openalex"],
      required: true,
    },
    externalId: { type: String, trim: true },
    doi: { type: String, trim: true, lowercase: true },
    contentHash: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    authors: [{ type: String, trim: true }],
    year: { type: Number, min: 1900, max: 2100 },
    venue: { type: String, trim: true },
    abstract: { type: String, trim: true },
    keywords: [{ type: String, trim: true, lowercase: true }],
    importId: { type: mongoose.Schema.Types.ObjectId, ref: "ImportReport" },
  },
  { timestamps: true, collection: "research_papers" },
);

researchPaperSchema.index(
  { source: 1, externalId: 1 },
  {
    unique: true,
    partialFilterExpression: { externalId: { $exists: true } },
  },
);

researchPaperSchema.index(
  { doi: 1 },
  {
    unique: true,
    partialFilterExpression: { doi: { $exists: true } },
  },
);

researchPaperSchema.index(
  { contentHash: 1 },
  {
    unique: true,
    partialFilterExpression: { contentHash: { $exists: true } },
  },
);

researchPaperSchema.index({ year: -1 });
researchPaperSchema.index({ keywords: 1 });
researchPaperSchema.index({ title: "text", abstract: "text" });

module.exports = mongoose.model("ResearchPaper", researchPaperSchema);