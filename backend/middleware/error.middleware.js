/**
 * Centralized error handler — catches anything thrown anywhere in the app.
 * Express recognizes 4-arg middleware as error-handling middleware.
 */
function errorHandler(err, req, res, next) {
  console.error(' API error:', err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);

  // Mongoose validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message])),
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `${field} already exists` });
  }

  // JWT
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid session' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expired' });

  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Server error',
  });
}

module.exports = errorHandler;
