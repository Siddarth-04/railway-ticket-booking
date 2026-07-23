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
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: isProduction
      ? 'An internal server error occurred. Please try again later.'
      : err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
