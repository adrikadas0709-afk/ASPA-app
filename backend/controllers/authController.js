const User         = require('../models/User');
const { sendToken } = require('../utils/jwt');
const { AppError, catchAsync } = require('../utils/AppError');

// POST /api/auth/register
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email, and password are required', 400);
  if (password.length < 8) throw new AppError('Password must be at least 8 characters', 400);

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('An account with that email already exists', 409);

  const user = await User.create({ name, email, password });
  sendToken(user, 201, res);
});

// POST /api/auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password required', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  sendToken(user, 200, res);
});

// GET /api/auth/me
exports.getMe = catchAsync(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PATCH /api/auth/me
exports.updateMe = catchAsync(async (req, res, next) => {
  const { name, preferences, apiConfig } = req.body;
  const update = {};
  if (name)        update.name        = name;
  if (preferences) update.preferences = preferences;
  if (apiConfig)   update.apiConfig   = { ...req.user.apiConfig, ...apiConfig };

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true, runValidators: true,
  });
  res.json({ success: true, user });
});

// PATCH /api/auth/password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Both passwords are required', 400);
  if (newPassword.length < 8) throw new AppError('New password must be at least 8 characters', 400);

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});
