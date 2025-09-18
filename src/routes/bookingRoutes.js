const express = require('express');
const BookingController = require('../controllers/bookingController');
const { validateBookingCreation, validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/bookings - Create a new booking
router.post('/', validateBookingCreation, BookingController.createBooking);

// GET /api/bookings/analytics - Get booking analytics (must come before other GET routes)
router.get('/analytics', BookingController.getBookingAnalytics);

// GET /api/bookings/customer/:customerId - Get customer bookings
router.get('/customer/:customerId', BookingController.getCustomerBookings);

// GET /api/bookings - Get all bookings
router.get('/', BookingController.getAllBookings);

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', validateObjectId, BookingController.getBookingById);

// PATCH /api/bookings/:id/status - Update booking status
router.patch('/:id/status', validateObjectId, BookingController.updateBookingStatus);

// PATCH /api/bookings/:id/cancel - Cancel booking
router.patch('/:id/cancel', validateObjectId, BookingController.cancelBooking);

// DELETE /api/bookings/:id - Delete booking
router.delete('/:id', validateObjectId, BookingController.deleteBooking);

module.exports = router;