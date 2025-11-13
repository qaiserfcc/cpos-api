const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Enhanced error logging
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    code: err.code,
    name: err.name,
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  // Prisma error handling with more details
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        const field = err.meta?.target ? err.meta.target.join(', ') : 'field';
        return res.status(409).json({
          error: `A record with this ${field} already exists`,
          code: err.code,
          details: errorDetails,
          type: 'DUPLICATE_ENTRY'
        });
      case 'P2025':
        return res.status(404).json({
          error: 'The requested record was not found',
          code: err.code,
          details: errorDetails,
          type: 'NOT_FOUND'
        });
      case 'P1001':
        return res.status(503).json({
          error: 'Database connection failed. Please try again later.',
          code: err.code,
          details: errorDetails,
          type: 'DATABASE_CONNECTION_ERROR'
        });
      default:
        break;
    }
  }

  // JWT errors with enhanced details
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication token is invalid or malformed',
      code: 'INVALID_TOKEN',
      details: errorDetails,
      type: 'AUTHENTICATION_ERROR'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication token has expired. Please log in again.',
      code: 'TOKEN_EXPIRED',
      details: errorDetails,
      type: 'AUTHENTICATION_ERROR'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Invalid input data',
      code: 'VALIDATION_ERROR',
      details: {
        ...errorDetails,
        validationErrors: err.errors
      },
      type: 'VALIDATION_ERROR'
    });
  }

  // Network/Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Service temporarily unavailable. Please check your connection and try again.',
      code: err.code,
      details: errorDetails,
      type: 'NETWORK_ERROR'
    });
  }

  // Default error response with enhanced details
  const statusCode = err.status || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    error: err.message || 'An unexpected error occurred',
    code: err.code || 'INTERNAL_ERROR',
    type: 'INTERNAL_ERROR',
    details: isDevelopment ? errorDetails : {
      message: errorDetails.message,
      timestamp: errorDetails.timestamp
    },
    ...(isDevelopment && { stack: err.stack })
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'The requested endpoint was not found',
    code: 'NOT_FOUND',
    type: 'NOT_FOUND',
    details: {
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = { errorHandler, notFoundHandler };