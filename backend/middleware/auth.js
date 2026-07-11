const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const { AppError } = require('../utils/AppError');

/**
 * Protect routes — requires valid Bearer JWT
 */
const protect = async (req, res, next) => {
  try {
    let token;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      token = auth.split(' ')[1];
    }
    if (!token) throw new AppError('Not authenticated — no token provided', 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new AppError('User belonging to this token no longer exists', 401);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return next(new AppError('Invalid token', 401));
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expired — please log in again', 401));
    next(err);
  }
};

/**
 * Optional auth — attaches user if token present but doesn't fail
 */
const optionalAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token   = auth.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (_) { /* ignore */ }
  next();
};

/**
 * Restrict to specific roles
 */
const restrict = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
};

module.exports = { protect, optionalAuth, restrict };
