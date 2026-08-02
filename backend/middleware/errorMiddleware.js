/**
 * errorMiddleware — Global error handler.
 * Must be registered as the LAST middleware in server.js.
 * Catches all errors passed via next(err).
 *
 * - In development: returns full error message and stack.
 * - In production:  returns generic message, hides internals.
 */
const errorMiddleware = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(`[ERROR] ${new Date().toISOString()} — ${req.method} ${req.originalUrl}`);
  console.error(err.stack || err.message || err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred. Please try again later.',
  });
};

module.exports = errorMiddleware;
