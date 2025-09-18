const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const RideCalculationService = require('./rideCalculationService');

class VehicleService {
    /**
     * Create a new vehicle
     * 
     * @param {Object} vehicleData - Vehicle data
     * @returns {Object} - Created vehicle
     */
    static async createVehicle(vehicleData) {
        try {
            const vehicle = new Vehicle(vehicleData);
            await vehicle.save();
            return vehicle;
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('Vehicle with this registration number already exists');
            }
            throw error;
        }
    }

    /**
     * Get all vehicles with optional filtering
     * 
     * @param {Object} filters - Filtering options
     * @returns {Array} - Array of vehicles
     */
    static async getAllVehicles(filters = {}) {
        try {
            const query = {};

            // Add filters
            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.minCapacity) {
                query.capacityKg = { $gte: parseInt(filters.minCapacity) };
            }

            const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
            return vehicles;
        } catch (error) {
            throw new Error(`Error fetching vehicles: ${error.message}`);
        }
    }

    /**
     * Get vehicle by ID
     * 
     * @param {string} vehicleId - Vehicle ID
     * @returns {Object} - Vehicle object
     */
    static async getVehicleById(vehicleId) {
        try {
            const vehicle = await Vehicle.findById(vehicleId);
            if (!vehicle) {
                throw new Error('Vehicle not found');
            }
            return vehicle;
        } catch (error) {
            throw new Error(`Error fetching vehicle: ${error.message}`);
        }
    }

    /**
     * Find available vehicles based on criteria
     * Core logic for availability checking
     * 
     * @param {Object} criteria - Search criteria
     * @returns {Array} - Available vehicles with route info
     */
    static async findAvailableVehicles(criteria) {
        try {
            const { capacityRequired, fromPincode, toPincode, startTime } = criteria;

            // Validate input
            if (!capacityRequired || !fromPincode || !toPincode || !startTime) {
                throw new Error('All search criteria are required');
            }

            // Validate pincodes
            if (!RideCalculationService.isValidPincode(fromPincode) ||
                !RideCalculationService.isValidPincode(toPincode)) {
                throw new Error('Invalid pincode format. Pincodes must be 6 digits.');
            }

            // Validate start time
            const requestedStartTime = new Date(startTime);
            if (isNaN(requestedStartTime.getTime())) {
                throw new Error('Invalid start time format');
            }

            if (requestedStartTime <= new Date()) {
                throw new Error('Start time must be in the future');
            }

            // Calculate ride duration and end time
            const estimatedRideDurationHours = RideCalculationService.calculateEstimatedDuration(
                fromPincode,
                toPincode
            );

            const requestedEndTime = RideCalculationService.calculateEndTime(
                requestedStartTime,
                estimatedRideDurationHours
            );

            // Find vehicles with sufficient capacity and active status
            const eligibleVehicles = await Vehicle.find({
                capacityKg: { $gte: capacityRequired },
                status: 'active'
            });

            if (eligibleVehicles.length === 0) {
                return [];
            }

            // Check availability for each eligible vehicle
            const availableVehicles = [];

            for (const vehicle of eligibleVehicles) {
                const overlappingBookings = await Booking.findOverlappingBookings(
                    vehicle._id,
                    requestedStartTime,
                    requestedEndTime
                );

                // If no overlapping bookings, vehicle is available
                if (overlappingBookings.length === 0) {
                    // Add route information
                    const routeInfo = RideCalculationService.getRouteInfo(
                        fromPincode,
                        toPincode,
                        vehicle.capacityKg
                    );

                    availableVehicles.push({
                        ...vehicle.toObject(),
                        estimatedRideDurationHours,
                        routeInfo,
                        searchCriteria: {
                            fromPincode,
                            toPincode,
                            requestedStartTime,
                            requestedEndTime
                        }
                    });
                }
            }

            return availableVehicles;

        } catch (error) {
            throw new Error(`Error finding available vehicles: ${error.message}`);
        }
    }

    /**
     * Update vehicle status
     * 
     * @param {string} vehicleId - Vehicle ID
     * @param {string} status - New status
     * @returns {Object} - Updated vehicle
     */
    static async updateVehicleStatus(vehicleId, status) {
        try {
            const vehicle = await Vehicle.findByIdAndUpdate(
                vehicleId,
                { status },
                { new: true, runValidators: true }
            );

            if (!vehicle) {
                throw new Error('Vehicle not found');
            }

            return vehicle;
        } catch (error) {
            throw new Error(`Error updating vehicle status: ${error.message}`);
        }
    }

    /**
     * Get vehicle utilization stats
     * 
     * @param {string} vehicleId - Vehicle ID
     * @param {Object} dateRange - Date range for stats
     * @returns {Object} - Utilization statistics
     */
    static async getVehicleUtilization(vehicleId, dateRange = {}) {
        try {
            const vehicle = await this.getVehicleById(vehicleId);

            const { startDate, endDate } = dateRange;
            const query = { vehicleId: vehicle._id };

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            const bookings = await Booking.find(query);

            const stats = {
                vehicleId: vehicle._id,
                vehicleName: vehicle.name,
                totalBookings: bookings.length,
                confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
                completedBookings: bookings.filter(b => b.status === 'completed').length,
                cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
                totalHoursBooked: bookings.reduce((sum, b) => sum + b.estimatedRideDurationHours, 0),
                averageRideDuration: bookings.length > 0
                    ? bookings.reduce((sum, b) => sum + b.estimatedRideDurationHours, 0) / bookings.length
                    : 0
            };

            return stats;

        } catch (error) {
            throw new Error(`Error calculating vehicle utilization: ${error.message}`);
        }
    }

    /**
     * Delete vehicle (soft delete by changing status)
     * 
     * @param {string} vehicleId - Vehicle ID
     * @returns {Object} - Updated vehicle
     */
    static async deleteVehicle(vehicleId) {
        try {
            // Check for active bookings
            const activeBookings = await Booking.find({
                vehicleId,
                status: { $in: ['confirmed', 'in-progress'] }
            });

            if (activeBookings.length > 0) {
                throw new Error('Cannot delete vehicle with active bookings');
            }

            const vehicle = await Vehicle.findByIdAndUpdate(
                vehicleId,
                { status: 'retired' },
                { new: true }
            );

            if (!vehicle) {
                throw new Error('Vehicle not found');
            }

            return vehicle;
        } catch (error) {
            throw new Error(`Error deleting vehicle: ${error.message}`);
        }
    }
}

module.exports = VehicleService;