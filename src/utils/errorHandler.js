/**
 * Error handling utilities
 */

/**
 * Custom error classes for different types of application errors
 */

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400);
        this.name = 'ValidationError';
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

/**
 * Error handler for async functions
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

/**
 * Handle MongoDB cast errors
 */
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new ValidationError(message);
};

/**
 * Handle MongoDB duplicate field errors
 */
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new ConflictError(message);
};

/**
 * Handle MongoDB validation errors
 */
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new ValidationError(message, errors);
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥', err);

        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        });
    }
};

/**
 * Format error response
 */
const formatErrorResponse = (error, statusCode = 500) => {
    return {
        success: false,
        status: 'error',
        statusCode,
        message: error.message || 'An error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
};

/**
 * Log error details
 */
const logError = (error, req = null) => {
    const timestamp = new Date().toISOString();
    const logData = {
        timestamp,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        }
    };

    if (req) {
        logData.request = {
            method: req.method,
            url: req.originalUrl,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        };
    }

    console.error('Application Error:', JSON.stringify(logData, null, 2));
};

/**
 * Handle specific MongoDB connection errors
 */
const handleConnectionError = (error) => {
    console.error('Database connection error:', error.message);

    if (error.name === 'MongoNetworkError') {
        return new AppError('Database connection failed. Please try again later.', 503);
    }

    if (error.name === 'MongoServerSelectionError') {
        return new AppError('Database server unavailable. Please try again later.', 503);
    }

    return new AppError('Database error occurred', 500);
};

/**
 * Validate and format validation errors
 */
const formatValidationErrors = (errors) => {
    if (Array.isArray(errors)) {
        return errors;
    }

    if (typeof errors === 'object') {
        return Object.values(errors).map(error =>
            typeof error === 'string' ? error : error.message
        );
    }

    return [errors];
};

/**
 * Check if error is operational
 */
const isOperationalError = (error) => {
    return error instanceof AppError || error.isOperational === true;
};

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    ConflictError,
    UnauthorizedError,
    ForbiddenError,
    catchAsync,
    handleCastErrorDB,
    handleDuplicateFieldsDB,
    handleValidationErrorDB,
    sendErrorDev,
    sendErrorProd,
    formatErrorResponse,
    logError,
    handleConnectionError,
    formatValidationErrors,
    isOperationalError
};