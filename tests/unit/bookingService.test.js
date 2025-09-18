const mongoose = require('mongoose');
const BookingService = require('../../src/services/bookingService');
const VehicleService = require('../../src/services/vehicleService');
const Booking = require('../../src/models/Booking');

describe('BookingService', () => {
    let testVehicle;

    beforeEach(async () => {
        // Create a test vehicle for bookings
        testVehicle = await VehicleService.createVehicle(
            testUtils.createValidVehicleData()
        );
    });

    describe('createBooking', () => {
        test('should create a booking successfully', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id);

            const booking = await BookingService.createBooking(bookingData);

            expect(booking).toBeTruthy();
            expect(booking.vehicleId.toString()).toBe(testVehicle._id.toString());
            expect(booking.customerId).toBe(bookingData.customerId);
            expect(booking.fromPincode).toBe(bookingData.fromPincode);
            expect(booking.toPincode).toBe(bookingData.toPincode);
            expect(booking.status).toBe('confirmed');
            expect(booking.estimatedRideDurationHours).toBeTruthy();
            expect(booking.endTime).toBeTruthy();
        });

        test('should prevent overlapping bookings', async () => {
            const startTime = testUtils.getFutureDate(24);
            const bookingData1 = testUtils.createValidBookingData(testVehicle._id, {
                startTime: startTime.toISOString()
            });

            // Create first booking
            await BookingService.createBooking(bookingData1);

            // Try to create overlapping booking
            const bookingData2 = testUtils.createValidBookingData(testVehicle._id, {
                startTime: new Date(startTime.getTime() + 30 * 60 * 1000).toISOString() // 30 minutes later
            });

            await expect(BookingService.createBooking(bookingData2))
                .rejects.toThrow('Vehicle is no longer available for the requested time slot');
        });

        test('should validate vehicle exists', async () => {
            const nonExistentVehicleId = new mongoose.Types.ObjectId();
            const bookingData = testUtils.createValidBookingData(nonExistentVehicleId);

            await expect(BookingService.createBooking(bookingData))
                .rejects.toThrow('Vehicle not found');
        });

        test('should validate vehicle is active', async () => {
            // Set vehicle to maintenance
            await VehicleService.updateVehicleStatus(testVehicle._id, 'maintenance');

            const bookingData = testUtils.createValidBookingData(testVehicle._id);

            await expect(BookingService.createBooking(bookingData))
                .rejects.toThrow('Vehicle is not available for booking');
        });

        test('should validate pincode format', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id, {
                fromPincode: '11001' // Invalid: 5 digits
            });

            await expect(BookingService.createBooking(bookingData))
                .rejects.toThrow('Invalid pincode format');
        });

        test('should validate start time is in future', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id, {
                startTime: testUtils.getPastDate(1).toISOString()
            });

            await expect(BookingService.createBooking(bookingData))
                .rejects.toThrow('Start time must be in the future');
        });

        test('should calculate ride duration correctly', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id, {
                fromPincode: '110001',
                toPincode: '110005'
            });

            const booking = await BookingService.createBooking(bookingData);

            // Expected duration: Math.abs(110005 - 110001) % 24 = 4 hours
            expect(booking.estimatedRideDurationHours).toBe(4);
        });
    });

    describe('getBookingById', () => {
        test('should retrieve booking by ID with vehicle details', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id);
            const createdBooking = await BookingService.createBooking(bookingData);

            const retrievedBooking = await BookingService.getBookingById(createdBooking._id);

            expect(retrievedBooking.customerId).toBe(bookingData.customerId);
            expect(retrievedBooking.vehicleId.name).toBe(testVehicle.name);
        });

        test('should throw error for non-existent booking', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            await expect(BookingService.getBookingById(nonExistentId))
                .rejects.toThrow('Booking not found');
        });
    });

    describe('updateBookingStatus', () => {
        test('should update booking status successfully', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id);
            const booking = await BookingService.createBooking(bookingData);

            const updatedBooking = await BookingService.updateBookingStatus(
                booking._id,
                'in-progress'
            );

            expect(updatedBooking.status).toBe('in-progress');
            expect(updatedBooking.actualStartTime).toBeTruthy();
        });

        test('should set actualEndTime when status is completed', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id);
            const booking = await BookingService.createBooking(bookingData);

            const updatedBooking = await BookingService.updateBookingStatus(
                booking._id,
                'completed'
            );

            expect(updatedBooking.status).toBe('completed');
            expect(updatedBooking.actualEndTime).toBeTruthy();
        });
    });

    describe('cancelBooking', () => {
        test('should cancel booking successfully', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id);
            const booking = await BookingService.createBooking(bookingData);

            const cancelledBooking = await BookingService.cancelBooking(
                booking._id,
                'Customer request'
            );

            expect(cancelledBooking.status).toBe('cancelled');
            expect(cancelledBooking.notes).toContain('Customer request');
        });

        test('should prevent cancellation of completed booking', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id);
            const booking = await BookingService.createBooking(bookingData);

            // Update to completed status
            await BookingService.updateBookingStatus(booking._id, 'completed');

            await expect(BookingService.cancelBooking(booking._id))
                .rejects.toThrow('Cannot cancel completed booking');
        });

        test('should prevent cancellation too close to start time', async () => {
            const startTime = testUtils.getFutureDate(1); // 1 hour from now
            const bookingData = testUtils.createValidBookingData(testVehicle._id, {
                startTime: startTime.toISOString()
            });
            const booking = await BookingService.createBooking(bookingData);

            await expect(BookingService.cancelBooking(booking._id))
                .rejects.toThrow('Cannot cancel booking less than 2 hours before start time');
        });
    });

    describe('getAllBookings', () => {
        beforeEach(async () => {
            // Create multiple bookings for testing
            const booking1Data = testUtils.createValidBookingData(testVehicle._id, {
                customerId: 'CUSTOMER_1'
            });
            const booking2Data = testUtils.createValidBookingData(testVehicle._id, {
                customerId: 'CUSTOMER_2',
                startTime: testUtils.getFutureDate(48).toISOString()
            });

            await BookingService.createBooking(booking1Data);
            const booking2 = await BookingService.createBooking(booking2Data);

            // Cancel one booking
            await BookingService.cancelBooking(booking2._id, 'Test cancellation');
        });

        test('should get all bookings', async () => {
            const bookings = await BookingService.getAllBookings();

            expect(bookings).toHaveLength(2);
            expect(bookings[0].vehicleId).toBeTruthy();
        });

        test('should filter bookings by customer ID', async () => {
            const bookings = await BookingService.getAllBookings({
                customerId: 'CUSTOMER_1'
            });

            expect(bookings).toHaveLength(1);
            expect(bookings[0].customerId).toBe('CUSTOMER_1');
        });

        test('should filter bookings by status', async () => {
            const cancelledBookings = await BookingService.getAllBookings({
                status: 'cancelled'
            });

            expect(cancelledBookings).toHaveLength(1);
            expect(cancelledBookings[0].status).toBe('cancelled');
        });
    });

    describe('getCustomerBookings', () => {
        test('should get customer bookings with pagination', async () => {
            const customerId = 'CUSTOMER_TEST';

            // Create multiple bookings for the same customer
            for (let i = 0; i < 3; i++) {
                const bookingData = testUtils.createValidBookingData(testVehicle._id, {
                    customerId,
                    startTime: testUtils.getFutureDate(24 + (i * 24)).toISOString()
                });
                await BookingService.createBooking(bookingData);
            }

            const result = await BookingService.getCustomerBookings(customerId, {
                limit: 2,
                offset: 0
            });

            expect(result.bookings).toHaveLength(2);
            expect(result.total).toBe(3);
            expect(result.hasMore).toBe(true);
        });
    });

    describe('getBookingAnalytics', () => {
        test('should calculate booking analytics', async () => {
            // Create bookings with different statuses
            const booking1Data = testUtils.createValidBookingData(testVehicle._id);
            const booking2Data = testUtils.createValidBookingData(testVehicle._id, {
                startTime: testUtils.getFutureDate(48).toISOString()
            });

            const booking1 = await BookingService.createBooking(booking1Data);
            const booking2 = await BookingService.createBooking(booking2Data);

            // Update statuses
            await BookingService.updateBookingStatus(booking1._id, 'completed');
            await BookingService.cancelBooking(booking2._id, 'Test');

            const analytics = await BookingService.getBookingAnalytics();

            expect(analytics.totalBookings).toBe(2);
            expect(analytics.completedBookings).toBe(1);
            expect(analytics.cancelledBookings).toBe(1);
            expect(analytics.totalHours).toBeGreaterThan(0);
        });
    });

    describe('deleteBooking', () => {
        test('should delete cancelled booking', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id);
            const booking = await BookingService.createBooking(bookingData);

            // Cancel the booking first
            await BookingService.cancelBooking(booking._id, 'Test deletion');

            // Now delete it
            const result = await BookingService.deleteBooking(booking._id);

            expect(result).toBe(true);

            // Verify booking is deleted
            await expect(BookingService.getBookingById(booking._id))
                .rejects.toThrow('Booking not found');
        });

        test('should prevent deletion of non-cancelled booking', async () => {
            const bookingData = testUtils.createValidBookingData(testVehicle._id);
            const booking = await BookingService.createBooking(bookingData);

            await expect(BookingService.deleteBooking(booking._id))
                .rejects.toThrow('Only cancelled bookings can be deleted');
        });
    });
});