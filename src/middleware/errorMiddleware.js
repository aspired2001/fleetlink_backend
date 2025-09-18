/**
 * Global error handling middleware
 * This should be the last middleware in the application
 */
const errorMiddleware = (err, req, res, next) => {
    console.error('Error occurred:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Default error response
    let error = {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong on the server'
    };

    // Handle different types of errors

    // MongoDB validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        error = {
            success: false,
            error: 'Validation failed',
            message: 'Invalid data provided',
            details: messages
        };
        return res.status(400).json(error);
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = {
            success: false,
            error: 'Duplicate entry',
            message: `${field} already exists`
        };
        return res.status(409).json(error);
    }

    // MongoDB CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        error = {
            success: false,
            error: 'Invalid ID format',
            message: 'The provided ID is not valid'
        };
        return res.status(400).json(error);
    }

    // Custom application errors
    if (err.name === 'ApplicationError') {
        error = {
            success: false,
            error: err.type || 'Application error',
            message: err.message
        };
        return res.status(err.statusCode || 400).json(error);
    }

    // JWT errors (if implemented later)
    if (err.name === 'JsonWebTokenError') {
        error = {
            success: false,
            error: 'Authentication failed',
            message: 'Invalid token'
        };
        return res.status(401).json(error);
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            success: false,
            error: 'Authentication failed',
            message: 'Token has expired'
        };
        return res.status(401).json(error);
    }

    // Rate limiting errors (if implemented)
    if (err.name === 'RateLimitError') {
        error = {
            success: false,
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.'
        };
        return res.status(429).json(error);
    }

    // Default server error
    const statusCode = err.statusCode || err.status || 500;

    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        return res.status(500).json(error);
    }

    // In development, provide more details
    error = {
        success: false,
        error: err.name || 'Server Error',
        message: err.message || 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    res.status(statusCode).json(error);
};

/**
 * Custom error class for application-specific errors
 */
class ApplicationError extends Error {
    constructor(message, statusCode = 400, type = 'ApplicationError') {
        super(message);
        this.name = 'ApplicationError';
        this.statusCode = statusCode;
        this.type = type;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Not found middleware
 * Handles 404 errors for undefined routes
 */
const notFoundMiddleware = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
};

module.exports = {
    errorMiddleware,
    ApplicationError,
    asyncHandler,
    notFoundMiddleware
};