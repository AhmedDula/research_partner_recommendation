const mongoose = require("mongoose");

const importReportSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true },
    totalRows: { type: Number, default: 0 },
    inserted: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    rowErrors: [
      {
        row: { type: Number },
        message: { type: String },
        _id: false,
      },
    ],
  },
  { timestamps: true, collection: "import_reports" },
);

module.exports = mongoose.model("ImportReport", importReportSchema);