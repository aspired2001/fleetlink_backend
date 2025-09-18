const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
// Destructure the middleware function from the exported object
const { errorMiddleware } = require('./middleware/errorMiddleware');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'FleetLink Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Helper to mount routes safely and log helpful errors
const mountRoute = (path, router) => {
    if (!router) {
        console.error(`Cannot mount ${path}: router is undefined or null`);
        return;
    }
    // Express routers are functions with properties, but safe check:
    const isRouter = typeof router === 'function' || (typeof router === 'object' && router.stack);
    if (!isRouter) {
        console.error(`Cannot mount ${path}: invalid router/middleware.`, router);
        return;
    }
    app.use(path, router);
};

// API routes (use safe mounting)
mountRoute('/api/vehicles', vehicleRoutes);
mountRoute('/api/bookings', bookingRoutes);

// 404 handler (keeps your existing inline handler)
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Error handling middleware (must be last)
if (typeof errorMiddleware === 'function') {
    app.use(errorMiddleware);
} else {
    console.error('errorMiddleware is not a function. Check exports in ./middleware/errorMiddleware');
}

module.exports = app;
