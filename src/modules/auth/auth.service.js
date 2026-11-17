// Authentication business logic
const Users = require("../users/user.model");
const { hashPassword, comparePassword } = require("../../utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} = require("../../utils/token");
const ApiError = require("../../utils/ApiError");

// Generate both tokens and store the hash of the refresh token
const generateAndSaveTokens = async (user) => {
  const payload = { id: user._id, role: user.role };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshToken = hashToken(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
};

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// Register new user
exports.register = async (data) => {
  const { name, email, password, role } = data;

  const existingUser = await Users.findOne({ email });
  if (existingUser) {
    // Generic message on purpose: do not reveal which emails exist
    throw ApiError.unauthorized("Invalid Email or Password");
  }

  const hashedPassword = await hashPassword(password);

  const user = await Users.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  const { accessToken, refreshToken } = await generateAndSaveTokens(user);

  return { user: toPublicUser(user), accessToken, refreshToken };
};

// Login user
exports.login = async (data) => {
  const { email, password } = data;

  const user = await Users.findOne({ email }).select("+password");
  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Account is deactivated");
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAndSaveTokens(user);

  return { user: toPublicUser(user), accessToken, refreshToken };
};

// Get user from access token
exports.getCurrentUser = async (token) => {
  if (!token) {
    throw ApiError.unauthorized("No access token");
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    throw ApiError.unauthorized("Invalid access token");
  }

  const user = await Users.findById(payload.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return toPublicUser(user);
};

// Issue new access token from a valid refresh token
exports.refresh = async (token) => {
  if (!token) {
    throw ApiError.unauthorized("No refresh token");
  }

  const payload = verifyRefreshToken(token);
  if (!payload) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const user = await Users.findOne({ refreshToken: hashToken(token) }).select(
    "+refreshToken",
  );
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });

  return { accessToken };
};

// Logout: remove stored refresh token
exports.logout = async (token) => {
  if (!token) return;

  await Users.findOneAndUpdate(
    { refreshToken: hashToken(token) },
    { refreshToken: null },
  );
};