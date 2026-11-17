// HTTP layer for auth (tokens only in cookies)
const authService = require("./auth.service");
const { sendSuccess } = require("../../utils/apiResponse");
const { setAuthCookies, clearAuthCookies } = require("../../utils/cookies");

// Read access token from cookie first, then Bearer header
const getAccessToken = (req) => {
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  const header = req.headers.authorization;
  return header && header.startsWith("Bearer ") ? header.split(" ")[1] : undefined;
};

// Read refresh token from cookie first, then body
const getRefreshToken = (req) =>
  req.cookies?.refreshToken || req.body?.refreshToken;

exports.register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    setAuthCookies(res, { accessToken, refreshToken });
    return sendSuccess(res, 201, { user }, "Registered successfully");
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setAuthCookies(res, { accessToken, refreshToken });
    return sendSuccess(res, 200, { user }, "Logged in successfully");
  } catch (error) {
    return next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(getAccessToken(req));
    return sendSuccess(res, 200, { user }, "Current user");
  } catch (error) {
    return next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { accessToken } = await authService.refresh(getRefreshToken(req));
    setAuthCookies(res, { accessToken });
    return sendSuccess(res, 200, null, "Token refreshed");
  } catch (error) {
    return next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logout(getRefreshToken(req));
    clearAuthCookies(res);
    return sendSuccess(res, 200, null, "Logged out successfully");
  } catch (error) {
    return next(error);
  }
};