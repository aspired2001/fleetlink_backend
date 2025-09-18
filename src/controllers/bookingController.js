const BookingService = require('../services/bookingService');

class BookingController {
    /**
     * Create a new booking
     * POST /api/bookings
     */
    static async createBooking(req, res) {
        try {
            const { vehicleId, fromPincode, toPincode, startTime, customerId } = req.body;

            // Basic validation
            if (!vehicleId || !fromPincode || !toPincode || !startTime || !customerId) {
                return res.status(400).json({
                    error: 'Validation failed',
                    message: 'vehicleId, fromPincode, toPincode, startTime, and customerId are required'
                });
            }

            const bookingData = {
                vehicleId: vehicleId.trim(),
                fromPincode: fromPincode.trim(),
                toPincode: toPincode.trim(),
                startTime: startTime.trim(),
                customerId: customerId.trim()
            };

            const booking = await BookingService.createBooking(bookingData);

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: booking
            });

        } catch (error) {
            let statusCode = 400;

            if (error.message.includes('not found')) {
                statusCode = 404;
            } else if (error.message.includes('no longer available') ||
                error.message.includes('conflict')) {
                statusCode = 409;
            }

            res.status(statusCode).json({
                error: 'Booking creation failed',
                message: error.message
            });
        }
    }

    /**
     * Get all bookings
     * GET /api/bookings
     */
    static async getAllBookings(req, res) {
        try {
            const { customerId, vehicleId, status, startDate, endDate } = req.query;

            const filters = {};
            if (customerId) filters.customerId = customerId;
            if (vehicleId) filters.vehicleId = vehicleId;
            if (status) filters.status = status;
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;

            const bookings = await BookingService.getAllBookings(filters);

            res.status(200).json({
                success: true,
                message: 'Bookings fetched successfully',
                data: bookings,
                count: bookings.length,
                filters: filters
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch bookings',
                message: error.message
            });
        }
    }

    /**
     * Get booking by ID
     * GET /api/bookings/:id
     */
    static async getBookingById(req, res) {
        try {
            const { id } = req.params;
            const booking = await BookingService.getBookingById(id);

            res.status(200).json({
                success: true,
                message: 'Booking fetched successfully',
                data: booking
            });

        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                error: 'Failed to fetch booking',
                message: error.message
            });
        }
    }

    /**
     * Update booking status
     * PATCH /api/bookings/:id/status
     */
    static async updateBookingStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            if (!status) {
                return res.status(400).json({
                    error: 'Validation failed',
                    message: 'Status is required'
                });
            }

            const validStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status',
                    message: `Status must be one of: ${validStatuses.join(', ')}`
                });
            }

            const additionalData = {};
            if (notes) additionalData.notes = notes;

            const booking = await BookingService.updateBookingStatus(id, status, additionalData);

            res.status(200).json({
                success: true,
                message: 'Booking status updated successfully',
                data: booking
            });

        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                error: 'Failed to update booking status',
                message: error.message
            });
        }
    }

    /**
     * Cancel booking
     * PATCH /api/bookings/:id/cancel
     */
    static async cancelBooking(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const booking = await BookingService.cancelBooking(id, reason);

            res.status(200).json({
                success: true,
                message: 'Booking cancelled successfully',
                data: booking
            });

        } catch (error) {
            let statusCode = 400;

            if (error.message.includes('not found')) {
                statusCode = 404;
            } else if (error.message.includes('Cannot cancel')) {
                statusCode = 409;
            }

            res.status(statusCode).json({
                error: 'Failed to cancel booking',
                message: error.message
            });
        }
    }

    /**
     * Get customer bookings
     * GET /api/bookings/customer/:customerId
     */
    static async getCustomerBookings(req, res) {
        try {
            const { customerId } = req.params;
            const { limit, offset, status } = req.query;

            const options = {};
            if (limit) options.limit = parseInt(limit);
            if (offset) options.offset = parseInt(offset);
            if (status) options.status = status;

            const result = await BookingService.getCustomerBookings(customerId, options);

            res.status(200).json({
                success: true,
                message: 'Customer bookings fetched successfully',
                data: result.bookings,
                pagination: {
                    total: result.total,
                    limit: options.limit || 10,
                    offset: options.offset || 0,
                    hasMore: result.hasMore
                }
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch customer bookings',
                message: error.message
            });
        }
    }

    /**
     * Get booking analytics
     * GET /api/bookings/analytics
     */
    static async getBookingAnalytics(req, res) {
        try {
            const { startDate, endDate } = req.query;

            const dateRange = {};
            if (startDate) dateRange.startDate = startDate;
            if (endDate) dateRange.endDate = endDate;

            const analytics = await BookingService.getBookingAnalytics(dateRange);

            res.status(200).json({
                success: true,
                message: 'Booking analytics fetched successfully',
                data: analytics,
                dateRange: dateRange
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch booking analytics',
                message: error.message
            });
        }
    }

    /**
     * Delete booking
     * DELETE /api/bookings/:id
     */
    static async deleteBooking(req, res) {
        try {
            const { id } = req.params;
            await BookingService.deleteBooking(id);

            res.status(200).json({
                success: true,
                message: 'Booking deleted successfully'
            });

        } catch (error) {
            let statusCode = 400;

            if (error.message.includes('not found')) {
                statusCode = 404;
            } else if (error.message.includes('Only cancelled')) {
                statusCode = 409;
            }

            res.status(statusCode).json({
                error: 'Failed to delete booking',
                message: error.message
            });
        }
    }
}

module.exports = BookingController;