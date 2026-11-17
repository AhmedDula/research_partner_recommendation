// Auth cookie helpers
const { env } = require("../config/env.js");

const isProduction = env.app.nodeEnv === "production";

// Production uses HTTPS and cross-site cookies, dev uses lax on localhost
const baseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

const accessCookieOptions = {
  ...baseOptions,
  path: "/api/v1",
  maxAge: env.cookies.accessMaxAge,
};

// Refresh cookie is only sent to auth routes
const refreshCookieOptions = {
  ...baseOptions,
  path: "/api/v1/auth",
  maxAge: env.cookies.refreshMaxAge,
};

function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie("accessToken", accessToken, accessCookieOptions);
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  }
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", { ...baseOptions, path: "/api/v1" });
  res.clearCookie("refreshToken", { ...baseOptions, path: "/api/v1/auth" });
}

module.exports = { setAuthCookies, clearAuthCookies };