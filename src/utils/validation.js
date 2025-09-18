const mongoose = require('mongoose');

/**
 * Validation utility functions
 */

/**
 * Validate pincode format (6 digits)
 */
const isValidPincode = (pincode) => {
    const pincodeRegex = /^\d{6}$/;
    return typeof pincode === 'string' && pincodeRegex.test(pincode);
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate ISO date string
 */
const isValidISODate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString();
};

/**
 * Validate date is in the future
 */
const isFutureDate = (dateString) => {
    const date = new Date(dateString);
    return date > new Date();
};

/**
 * Validate email format (for future use)
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email);
};

/**
 * Validate phone number format (Indian format)
 */
const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return typeof phone === 'string' && phoneRegex.test(phone);
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate capacity range
 */
const isValidCapacity = (capacity) => {
    const num = Number(capacity);
    return !isNaN(num) && num >= 1 && num <= 50000;
};

/**
 * Validate tyres count
 */
const isValidTyreCount = (tyres) => {
    const num = Number(tyres);
    return !isNaN(num) && num >= 2 && num <= 18;
};

/**
 * Validate vehicle status
 */
const isValidVehicleStatus = (status) => {
    const validStatuses = ['active', 'maintenance', 'retired'];
    return validStatuses.includes(status);
};

/**
 * Validate booking status
 */
const isValidBookingStatus = (status) => {
    const validStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled'];
    return validStatuses.includes(status);
};

/**
 * Validate pagination parameters
 */
const isValidPaginationParams = (limit, offset) => {
    const limitNum = Number(limit);
    const offsetNum = Number(offset);

    const isValidLimit = isNaN(limitNum) || (limitNum >= 1 && limitNum <= 100);
    const isValidOffset = isNaN(offsetNum) || offsetNum >= 0;

    return isValidLimit && isValidOffset;
};

/**
 * Comprehensive vehicle data validation
 */
const validateVehicleData = (vehicleData) => {
    const errors = [];
    const { name, capacityKg, tyres, status, registrationNumber } = vehicleData;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    } else if (name.trim().length > 100) {
        errors.push('Name cannot exceed 100 characters');
    }

    if (!isValidCapacity(capacityKg)) {
        errors.push('Capacity must be between 1 and 50,000 kg');
    }

    if (!isValidTyreCount(tyres)) {
        errors.push('Tyres must be between 2 and 18');
    }

    if (status && !isValidVehicleStatus(status)) {
        errors.push('Status must be one of: active, maintenance, retired');
    }

    if (registrationNumber && typeof registrationNumber !== 'string') {
        errors.push('Registration number must be a string');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Comprehensive booking data validation
 */
const validateBookingData = (bookingData) => {
    const errors = [];
    const { vehicleId, fromPincode, toPincode, startTime, customerId } = bookingData;

    if (!isValidObjectId(vehicleId)) {
        errors.push('Vehicle ID must be a valid MongoDB ObjectId');
    }

    if (!customerId || typeof customerId !== 'string' || customerId.trim().length === 0) {
        errors.push('Customer ID is required and must be a non-empty string');
    }

    if (!isValidPincode(fromPincode)) {
        errors.push('From pincode must be exactly 6 digits');
    }

    if (!isValidPincode(toPincode)) {
        errors.push('To pincode must be exactly 6 digits');
    }

    if (!startTime) {
        errors.push('Start time is required');
    } else if (!isValidISODate(startTime)) {
        errors.push('Start time must be a valid ISO date string');
    } else if (!isFutureDate(startTime)) {
        errors.push('Start time must be in the future');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    isValidPincode,
    isValidObjectId,
    isValidISODate,
    isFutureDate,
    isValidEmail,
    isValidPhoneNumber,
    sanitizeString,
    isValidCapacity,
    isValidTyreCount,
    isValidVehicleStatus,
    isValidBookingStatus,
    isValidPaginationParams,
    validateVehicleData,
    validateBookingData
};