const mongoose = require('mongoose');

/**
 * Middleware to validate vehicle creation data
 */
const validateVehicleCreation = (req, res, next) => {
    const { name, capacityKg, tyres } = req.body;
    const errors = [];

    // Check required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    } else if (name.trim().length > 100) {
        errors.push('Name cannot exceed 100 characters');
    }

    if (!capacityKg || isNaN(Number(capacityKg))) {
        errors.push('CapacityKg is required and must be a number');
    } else {
        const capacity = Number(capacityKg);
        if (capacity < 1 || capacity > 50000) {
            errors.push('CapacityKg must be between 1 and 50,000 kg');
        }
    }

    if (!tyres || isNaN(Number(tyres))) {
        errors.push('Tyres is required and must be a number');
    } else {
        const tyreCount = Number(tyres);
        if (tyreCount < 2 || tyreCount > 18) {
            errors.push('Tyres must be between 2 and 18');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Invalid vehicle data',
            details: errors
        });
    }

    next();
};

/**
 * Middleware to validate booking creation data
 */
const validateBookingCreation = (req, res, next) => {
    const { vehicleId, fromPincode, toPincode, startTime, customerId } = req.body;
    const errors = [];

    // Check required fields
    if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.trim().length === 0) {
        errors.push('VehicleId is required and must be a non-empty string');
    } else if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        errors.push('VehicleId must be a valid MongoDB ObjectId');
    }

    if (!customerId || typeof customerId !== 'string' || customerId.trim().length === 0) {
        errors.push('CustomerId is required and must be a non-empty string');
    }

    // Validate pincodes
    const pincodeRegex = /^\d{6}$/;
    if (!fromPincode || !pincodeRegex.test(fromPincode)) {
        errors.push('FromPincode is required and must be exactly 6 digits');
    }

    if (!toPincode || !pincodeRegex.test(toPincode)) {
        errors.push('ToPincode is required and must be exactly 6 digits');
    }

    // Validate start time
    if (!startTime) {
        errors.push('StartTime is required');
    } else {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
            errors.push('StartTime must be a valid ISO date string');
        } else if (start <= new Date()) {
            errors.push('StartTime must be in the future');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Invalid booking data',
            details: errors
        });
    }

    next();
};

/**
 * Middleware to validate MongoDB ObjectId
 */
const validateObjectId = (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            error: 'Invalid ID format',
            message: 'The provided ID is not a valid MongoDB ObjectId'
        });
    }

    next();
};

/**
 * Middleware to validate query parameters for vehicle availability search
 */
const validateAvailabilityQuery = (req, res, next) => {
    const { capacityRequired, fromPincode, toPincode, startTime } = req.query;
    const errors = [];

    if (!capacityRequired || isNaN(Number(capacityRequired))) {
        errors.push('capacityRequired is required and must be a number');
    } else if (Number(capacityRequired) < 1) {
        errors.push('capacityRequired must be greater than 0');
    }

    const pincodeRegex = /^\d{6}$/;
    if (!fromPincode || !pincodeRegex.test(fromPincode)) {
        errors.push('fromPincode is required and must be exactly 6 digits');
    }

    if (!toPincode || !pincodeRegex.test(toPincode)) {
        errors.push('toPincode is required and must be exactly 6 digits');
    }

    if (!startTime) {
        errors.push('startTime is required');
    } else {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
            errors.push('startTime must be a valid ISO date string');
        } else if (start <= new Date()) {
            errors.push('startTime must be in the future');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Invalid search parameters',
            details: errors
        });
    }

    next();
};

/**
 * Middleware to validate pagination parameters
 */
const validatePagination = (req, res, next) => {
    const { limit, offset } = req.query;
    const errors = [];

    if (limit !== undefined) {
        const limitNum = Number(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            errors.push('limit must be a number between 1 and 100');
        }
    }

    if (offset !== undefined) {
        const offsetNum = Number(offset);
        if (isNaN(offsetNum) || offsetNum < 0) {
            errors.push('offset must be a non-negative number');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Invalid pagination parameters',
            details: errors
        });
    }

    next();
};

module.exports = {
    validateVehicleCreation,
    validateBookingCreation,
    validateObjectId,
    validateAvailabilityQuery,
    validatePagination
};