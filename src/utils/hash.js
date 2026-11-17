// Password hashing with bcrypt + pepper from env
const bcrypt = require("bcryptjs");
const { env } = require("../config/env.js");

const hashPassword = (password) =>
  bcrypt.hash(password + env.security.pepper, env.security.bcryptSaltRounds);

const comparePassword = (password, hash) =>
  bcrypt.compare(password + env.security.pepper, hash);

module.exports = { hashPassword, comparePassword };