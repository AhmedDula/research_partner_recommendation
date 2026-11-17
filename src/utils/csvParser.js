

const { parse } = require("csv-parse/sync");

function parseCsv(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("CSV file is empty");
  }

  const rows = parse(buffer, {
    columns: true,
    bom: true,
    trim: true,
    skip_empty_lines: true,
  });

  if (rows.length === 0) {
    throw new Error("CSV file has no data rows");
  }

  return rows;
}

module.exports = { parseCsv };
