export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong.';

  // Log server errors
  if (status >= 500) {
    console.error(`[error] ${status} ${req.method} ${req.path}:`, err);
  }

  res.status(status).json({
    success: false,
    error: message,
  });
}

// Helper to create errors with status codes
export function createError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
