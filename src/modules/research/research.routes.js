const express = require("express");
const { uploadCsv } = require("../../utils/fileUpload");
const controller = require("./research.controller");

const router = express.Router();

router.post("/import", uploadCsv.single("file"), controller.importCsv);
router.post("/", controller.createManual);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/import-openalex", controller.importOpenAlex);
module.exports = router;