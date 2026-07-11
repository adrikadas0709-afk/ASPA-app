/**
 * Global Express error handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = `Resource not found with id: ${err.value}`;
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error.message = `Duplicate value for field: ${field}`;
    error.statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(e => e.message).join('. ');
    error.statusCode = 422;
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 50}MB.`;
    error.statusCode = 413;
  }

  const statusCode = error.statusCode || err.status || 500;
  const message    = error.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${statusCode}] ${req.method} ${req.path} — ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
