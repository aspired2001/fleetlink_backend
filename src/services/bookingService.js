const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const RideCalculationService = require('./rideCalculationService');

class BookingService {
    /**
     * Create a new booking with conflict checking
     * 
     * @param {Object} bookingData - Booking data
     * @returns {Object} - Created booking
     */
    static async createBooking(bookingData) {
        try {
            const { vehicleId, fromPincode, toPincode, startTime, customerId } = bookingData;

            // Validate required fields
            if (!vehicleId || !fromPincode || !toPincode || !startTime || !customerId) {
                throw new Error('All booking fields are required');
            }

            // Validate vehicle exists and is active
            const vehicle = await Vehicle.findById(vehicleId);
            if (!vehicle) {
                throw new Error('Vehicle not found');
            }

            if (vehicle.status !== 'active') {
                throw new Error('Vehicle is not available for booking');
            }

            // Validate pincodes
            if (!RideCalculationService.isValidPincode(fromPincode) ||
                !RideCalculationService.isValidPincode(toPincode)) {
                throw new Error('Invalid pincode format. Pincodes must be 6 digits.');
            }

            // Validate start time
            const bookingStartTime = new Date(startTime);
            if (isNaN(bookingStartTime.getTime())) {
                throw new Error('Invalid start time format');
            }

            if (bookingStartTime <= new Date()) {
                throw new Error('Start time must be in the future');
            }

            // Calculate ride duration and end time
            const estimatedRideDurationHours = RideCalculationService.calculateEstimatedDuration(
                fromPincode,
                toPincode
            );

            const bookingEndTime = RideCalculationService.calculateEndTime(
                bookingStartTime,
                estimatedRideDurationHours
            );

            // CRITICAL: Re-verify vehicle availability to prevent race conditions
            const overlappingBookings = await Booking.findOverlappingBookings(
                vehicleId,
                bookingStartTime,
                bookingEndTime
            );

            if (overlappingBookings.length > 0) {
                throw new Error('Vehicle is no longer available for the requested time slot');
            }

            // Create booking
            const booking = new Booking({
                vehicleId,
                customerId,
                fromPincode,
                toPincode,
                startTime: bookingStartTime,
                endTime: bookingEndTime,
                estimatedRideDurationHours,
                status: 'confirmed'
            });

            await booking.save();

            // Populate vehicle details
            await booking.populate('vehicleId');

            return booking;

        } catch (error) {
            // Handle MongoDB duplicate key errors
            if (error.code === 11000) {
                throw new Error('Booking conflict detected');
            }
            throw new Error(`Error creating booking: ${error.message}`);
        }
    }

    /**
     * Get booking by ID
     * 
     * @param {string} bookingId - Booking ID
     * @returns {Object} - Booking object with vehicle details
     */
    static async getBookingById(bookingId) {
        try {
            const booking = await Booking.findById(bookingId).populate('vehicleId');
            if (!booking) {
                throw new Error('Booking not found');
            }
            return booking;
        } catch (error) {
            throw new Error(`Error fetching booking: ${error.message}`);
        }
    }

    /**
     * Get all bookings with optional filtering
     * 
     * @param {Object} filters - Filtering options
     * @returns {Array} - Array of bookings
     */
    static async getAllBookings(filters = {}) {
        try {
            const query = {};

            // Add filters
            if (filters.customerId) {
                query.customerId = filters.customerId;
            }

            if (filters.vehicleId) {
                query.vehicleId = filters.vehicleId;
            }

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.startDate || filters.endDate) {
                query.startTime = {};
                if (filters.startDate) query.startTime.$gte = new Date(filters.startDate);
                if (filters.endDate) query.startTime.$lte = new Date(filters.endDate);
            }

            const bookings = await Booking.find(query)
                .populate('vehicleId')
                .sort({ createdAt: -1 });

            return bookings;
        } catch (error) {
            throw new Error(`Error fetching bookings: ${error.message}`);
        }
    }

    /**
     * Update booking status
     * 
     * @param {string} bookingId - Booking ID
     * @param {string} status - New status
     * @param {Object} additionalData - Additional update data
     * @returns {Object} - Updated booking
     */
    static async updateBookingStatus(bookingId, status, additionalData = {}) {
        try {
            const updateData = { status, ...additionalData };

            // Add timestamps for status changes
            if (status === 'in-progress' && !updateData.actualStartTime) {
                updateData.actualStartTime = new Date();
            }

            if (status === 'completed' && !updateData.actualEndTime) {
                updateData.actualEndTime = new Date();
            }

            const booking = await Booking.findByIdAndUpdate(
                bookingId,
                updateData,
                { new: true, runValidators: true }
            ).populate('vehicleId');

            if (!booking) {
                throw new Error('Booking not found');
            }

            return booking;
        } catch (error) {
            throw new Error(`Error updating booking: ${error.message}`);
        }
    }

    /**
     * Cancel booking
     * 
     * @param {string} bookingId - Booking ID
     * @param {string} reason - Cancellation reason
     * @returns {Object} - Updated booking
     */
    static async cancelBooking(bookingId, reason = '') {
        try {
            const booking = await Booking.findById(bookingId);

            if (!booking) {
                throw new Error('Booking not found');
            }

            if (booking.status === 'completed') {
                throw new Error('Cannot cancel completed booking');
            }

            if (booking.status === 'cancelled') {
                throw new Error('Booking is already cancelled');
            }

            // Check if booking can be cancelled (e.g., not too close to start time)
            const now = new Date();
            const timeDiff = booking.startTime.getTime() - now.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff < 2) {
                throw new Error('Cannot cancel booking less than 2 hours before start time');
            }

            const updatedBooking = await this.updateBookingStatus(
                bookingId,
                'cancelled',
                { notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user' }
            );

            return updatedBooking;
        } catch (error) {
            throw new Error(`Error cancelling booking: ${error.message}`);
        }
    }

    /**
     * Get customer booking history
     * 
     * @param {string} customerId - Customer ID
     * @param {Object} options - Query options
     * @returns {Array} - Customer bookings
     */
    static async getCustomerBookings(customerId, options = {}) {
        try {
            const { limit = 10, offset = 0, status } = options;

            const query = { customerId };
            if (status) {
                query.status = status;
            }

            const bookings = await Booking.find(query)
                .populate('vehicleId')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset);

            const total = await Booking.countDocuments(query);

            return {
                bookings,
                total,
                hasMore: (offset + limit) < total
            };
        } catch (error) {
            throw new Error(`Error fetching customer bookings: ${error.message}`);
        }
    }

    /**
     * Get booking analytics
     * 
     * @param {Object} dateRange - Date range for analytics
     * @returns {Object} - Booking statistics
     */
    static async getBookingAnalytics(dateRange = {}) {
        try {
            const { startDate, endDate } = dateRange;
            const matchQuery = {};

            if (startDate || endDate) {
                matchQuery.createdAt = {};
                if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
                if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
            }

            const analytics = await Booking.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: null,
                        totalBookings: { $sum: 1 },
                        confirmedBookings: {
                            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                        },
                        inProgressBookings: {
                            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
                        },
                        completedBookings: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        cancelledBookings: {
                            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                        },
                        totalHours: { $sum: '$estimatedRideDurationHours' },
                        averageDuration: { $avg: '$estimatedRideDurationHours' }
                    }
                }
            ]);

            return analytics[0] || {
                totalBookings: 0,
                confirmedBookings: 0,
                inProgressBookings: 0,
                completedBookings: 0,
                cancelledBookings: 0,
                totalHours: 0,
                averageDuration: 0
            };
        } catch (error) {
            throw new Error(`Error fetching booking analytics: ${error.message}`);
        }
    }

    /**
     * Delete booking (hard delete - use with caution)
     * 
     * @param {string} bookingId - Booking ID
     * @returns {boolean} - Success status
     */
    static async deleteBooking(bookingId) {
        try {
            const booking = await Booking.findById(bookingId);

            if (!booking) {
                throw new Error('Booking not found');
            }

            // Only allow deletion of cancelled bookings
            if (booking.status !== 'cancelled') {
                throw new Error('Only cancelled bookings can be deleted');
            }

            await Booking.findByIdAndDelete(bookingId);
            return true;
        } catch (error) {
            throw new Error(`Error deleting booking: ${error.message}`);
        }
    }
}

module.exports = BookingService;