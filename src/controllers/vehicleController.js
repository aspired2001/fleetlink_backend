const VehicleService = require('../services/vehicleService');

class VehicleController {
    /**
     * Create a new vehicle
     * POST /api/vehicles
     */
    static async createVehicle(req, res) {
        try {
            const { name, capacityKg, tyres, registrationNumber } = req.body;

            // Basic validation
            if (!name || !capacityKg || !tyres) {
                return res.status(400).json({
                    error: 'Validation failed',
                    message: 'Name, capacityKg, and tyres are required fields'
                });
            }

            const vehicleData = {
                name: name.trim(),
                capacityKg: Number(capacityKg),
                tyres: Number(tyres)
            };

            if (registrationNumber) {
                vehicleData.registrationNumber = registrationNumber.trim();
            }

            const vehicle = await VehicleService.createVehicle(vehicleData);

            res.status(201).json({
                success: true,
                message: 'Vehicle created successfully',
                data: vehicle
            });

        } catch (error) {
            res.status(400).json({
                error: 'Vehicle creation failed',
                message: error.message
            });
        }
    }

    /**
     * Get all vehicles
     * GET /api/vehicles
     */
    static async getAllVehicles(req, res) {
        try {
            const { status, minCapacity } = req.query;

            const filters = {};
            if (status) filters.status = status;
            if (minCapacity) filters.minCapacity = minCapacity;

            const vehicles = await VehicleService.getAllVehicles(filters);

            res.status(200).json({
                success: true,
                message: 'Vehicles fetched successfully',
                data: vehicles,
                count: vehicles.length
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch vehicles',
                message: error.message
            });
        }
    }

    /**
     * Get vehicle by ID
     * GET /api/vehicles/:id
     */
    static async getVehicleById(req, res) {
        try {
            const { id } = req.params;
            const vehicle = await VehicleService.getVehicleById(id);

            res.status(200).json({
                success: true,
                message: 'Vehicle fetched successfully',
                data: vehicle
            });

        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                error: 'Failed to fetch vehicle',
                message: error.message
            });
        }
    }

    /**
     * Find available vehicles
     * GET /api/vehicles/available
     */
    static async findAvailableVehicles(req, res) {
        try {
            const { capacityRequired, fromPincode, toPincode, startTime } = req.query;

            // Validate required parameters
            if (!capacityRequired || !fromPincode || !toPincode || !startTime) {
                return res.status(400).json({
                    error: 'Missing required parameters',
                    message: 'capacityRequired, fromPincode, toPincode, and startTime are required'
                });
            }

            const criteria = {
                capacityRequired: Number(capacityRequired),
                fromPincode: fromPincode.trim(),
                toPincode: toPincode.trim(),
                startTime: startTime.trim()
            };

            const availableVehicles = await VehicleService.findAvailableVehicles(criteria);

            res.status(200).json({
                success: true,
                message: 'Available vehicles fetched successfully',
                data: availableVehicles,
                count: availableVehicles.length,
                searchCriteria: criteria
            });

        } catch (error) {
            res.status(400).json({
                error: 'Failed to find available vehicles',
                message: error.message
            });
        }
    }

    /**
     * Update vehicle status
     * PATCH /api/vehicles/:id/status
     */
    static async updateVehicleStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({
                    error: 'Validation failed',
                    message: 'Status is required'
                });
            }

            const validStatuses = ['active', 'maintenance', 'retired'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status',
                    message: `Status must be one of: ${validStatuses.join(', ')}`
                });
            }

            const vehicle = await VehicleService.updateVehicleStatus(id, status);

            res.status(200).json({
                success: true,
                message: 'Vehicle status updated successfully',
                data: vehicle
            });

        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                error: 'Failed to update vehicle status',
                message: error.message
            });
        }
    }

    /**
     * Get vehicle utilization stats
     * GET /api/vehicles/:id/utilization
     */
    static async getVehicleUtilization(req, res) {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;

            const dateRange = {};
            if (startDate) dateRange.startDate = startDate;
            if (endDate) dateRange.endDate = endDate;

            const stats = await VehicleService.getVehicleUtilization(id, dateRange);

            res.status(200).json({
                success: true,
                message: 'Vehicle utilization stats fetched successfully',
                data: stats
            });

        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                error: 'Failed to fetch utilization stats',
                message: error.message
            });
        }
    }

    /**
     * Delete vehicle (soft delete)
     * DELETE /api/vehicles/:id
     */
    static async deleteVehicle(req, res) {
        try {
            const { id } = req.params;
            const vehicle = await VehicleService.deleteVehicle(id);

            res.status(200).json({
                success: true,
                message: 'Vehicle deleted successfully',
                data: vehicle
            });

        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 :
                error.message.includes('active bookings') ? 409 : 500;
            res.status(statusCode).json({
                error: 'Failed to delete vehicle',
                message: error.message
            });
        }
    }
}

module.exports = VehicleController;