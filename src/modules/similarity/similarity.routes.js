const express = require("express");
const { uploadCsv } = require("../../utils/fileUpload");
const controller = require("./similarity.controller");

const router = express.Router();

router.post(
  "/run",
  uploadCsv.fields([
    { name: "research", maxCount: 1 },
    { name: "challenge", maxCount: 1 },
  ]),
  controller.run,
);

module.exports = router;