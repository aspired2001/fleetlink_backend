/**
 * Service for calculating ride duration and related metrics
 */

class RideCalculationService {
    /**
     * Calculate estimated ride duration based on pincodes
     * Note: This is a simplified placeholder logic as mentioned in requirements
     * 
     * @param {string} fromPincode - Source pincode (6 digits)
     * @param {string} toPincode - Destination pincode (6 digits)
     * @returns {number} - Estimated duration in hours
     */
    static calculateEstimatedDuration(fromPincode, toPincode) {
        try {
            // Validate pincode format
            if (!this.isValidPincode(fromPincode) || !this.isValidPincode(toPincode)) {
                throw new Error('Invalid pincode format. Pincodes must be 6 digits.');
            }

            // Convert pincodes to numbers
            const fromPin = parseInt(fromPincode);
            const toPin = parseInt(toPincode);

            // Calculate duration using the specified formula
            // estimatedRideDurationHours = Math.abs(parseInt(toPincode) - parseInt(fromPincode)) % 24
            const duration = Math.abs(toPin - fromPin) % 24;

            // Ensure minimum duration of 0.5 hours for practical purposes
            return Math.max(duration, 0.5);

        } catch (error) {
            throw new Error(`Error calculating ride duration: ${error.message}`);
        }
    }

    /**
     * Calculate end time based on start time and duration
     * 
     * @param {Date|string} startTime - Start time
     * @param {number} durationHours - Duration in hours
     * @returns {Date} - End time
     */
    static calculateEndTime(startTime, durationHours) {
        try {
            const start = new Date(startTime);

            if (isNaN(start.getTime())) {
                throw new Error('Invalid start time format');
            }

            if (!durationHours || durationHours <= 0) {
                throw new Error('Duration must be a positive number');
            }

            // Add duration in milliseconds
            const endTime = new Date(start.getTime() + (durationHours * 60 * 60 * 1000));

            return endTime;

        } catch (error) {
            throw new Error(`Error calculating end time: ${error.message}`);
        }
    }

    /**
     * Validate pincode format (6 digits)
     * 
     * @param {string} pincode - Pincode to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    static isValidPincode(pincode) {
        const pincodeRegex = /^\d{6}$/;
        return pincodeRegex.test(pincode);
    }

    /**
     * Calculate distance estimate based on pincode difference
     * This is also a simplified logic for demo purposes
     * 
     * @param {string} fromPincode - Source pincode
     * @param {string} toPincode - Destination pincode
     * @returns {number} - Estimated distance in kilometers
     */
    static calculateEstimatedDistance(fromPincode, toPincode) {
        try {
            const duration = this.calculateEstimatedDuration(fromPincode, toPincode);

            // Assume average speed of 50 km/h for estimation
            const averageSpeed = 50;

            return Math.round(duration * averageSpeed);

        } catch (error) {
            throw new Error(`Error calculating distance: ${error.message}`);
        }
    }

    /**
     * Get route information including duration, distance, and estimated cost
     * 
     * @param {string} fromPincode - Source pincode
     * @param {string} toPincode - Destination pincode
     * @param {number} capacityKg - Vehicle capacity for cost calculation
     * @returns {Object} - Route information object
     */
    static getRouteInfo(fromPincode, toPincode, capacityKg = 1000) {
        try {
            const duration = this.calculateEstimatedDuration(fromPincode, toPincode);
            const distance = this.calculateEstimatedDistance(fromPincode, toPincode);

            // Simplified cost calculation: base rate + distance rate + capacity multiplier
            const baseRate = 500; // Base rate in currency units
            const perKmRate = 10; // Rate per kilometer
            const capacityMultiplier = Math.max(1, capacityKg / 1000); // Scale with capacity

            const estimatedCost = Math.round(baseRate + (distance * perKmRate * capacityMultiplier));

            return {
                fromPincode,
                toPincode,
                estimatedDurationHours: duration,
                estimatedDistanceKm: distance,
                estimatedCost,
                route: `${fromPincode} → ${toPincode}`
            };

        } catch (error) {
            throw new Error(`Error getting route info: ${error.message}`);
        }
    }
}

module.exports = RideCalculationService;