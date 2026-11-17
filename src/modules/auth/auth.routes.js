const express = require("express");
const validate = require("../../middlewares/validationMiddleware");
const authValidation = require("./auth.validation");
const controller = require("./auth.controller");

const router = express.Router();

router.post("/register", validate(authValidation.register), controller.register);
router.post("/login", validate(authValidation.login), controller.login);
router.get("/me", controller.me);
router.post("/refresh", validate(authValidation.refresh), controller.refresh);
router.post("/logout", validate(authValidation.refresh), controller.logout);

module.exports = router;