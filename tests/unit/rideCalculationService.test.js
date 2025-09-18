const RideCalculationService = require('../../src/services/rideCalculationService');

describe('RideCalculationService', () => {
    describe('calculateEstimatedDuration', () => {
        test('should calculate duration correctly for different pincodes', () => {
            // Test case 1: Basic calculation
            const duration1 = RideCalculationService.calculateEstimatedDuration('110001', '110005');
            expect(duration1).toBe(4); // Math.abs(110005 - 110001) % 24 = 4

            // Test case 2: Larger difference
            const duration2 = RideCalculationService.calculateEstimatedDuration('110001', '110030');
            expect(duration2).toBe(5); // Math.abs(110030 - 110001) % 24 = 29 % 24 = 5

            // Test case 3: Reverse order
            const duration3 = RideCalculationService.calculateEstimatedDuration('110030', '110001');
            expect(duration3).toBe(5); // Math.abs(110001 - 110030) % 24 = 29 % 24 = 5
        });

        test('should return minimum duration of 0.5 hours', () => {
            // Same pincode should return minimum duration
            const duration = RideCalculationService.calculateEstimatedDuration('110001', '110001');
            expect(duration).toBe(0.5);
        });

        test('should handle modulo operation correctly', () => {
            // Test case where difference is greater than 24
            const duration = RideCalculationService.calculateEstimatedDuration('110001', '110050');
            expect(duration).toBe(1); // Math.abs(110050 - 110001) % 24 = 49 % 24 = 1
        });

        test('should validate pincode format', () => {
            expect(() => {
                RideCalculationService.calculateEstimatedDuration('11001', '110002'); // Invalid: 5 digits
            }).toThrow('Invalid pincode format');

            expect(() => {
                RideCalculationService.calculateEstimatedDuration('110001', '1100022'); // Invalid: 7 digits
            }).toThrow('Invalid pincode format');

            expect(() => {
                RideCalculationService.calculateEstimatedDuration('11000a', '110002'); // Invalid: contains letter
            }).toThrow('Invalid pincode format');
        });

        test('should handle string inputs correctly', () => {
            const duration = RideCalculationService.calculateEstimatedDuration('110001', '110005');
            expect(typeof duration).toBe('number');
            expect(duration).toBe(4);
        });
    });

    describe('calculateEndTime', () => {
        test('should calculate end time correctly', () => {
            const startTime = new Date('2024-01-01T10:00:00Z');
            const duration = 2.5; // 2.5 hours

            const endTime = RideCalculationService.calculateEndTime(startTime, duration);

            expect(endTime.getTime()).toBe(startTime.getTime() + (2.5 * 60 * 60 * 1000));
            expect(endTime.toISOString()).toBe('2024-01-01T12:30:00.000Z');
        });

        test('should handle string start time', () => {
            const startTimeString = '2024-01-01T10:00:00Z';
            const duration = 1;

            const endTime = RideCalculationService.calculateEndTime(startTimeString, duration);

            expect(endTime.toISOString()).toBe('2024-01-01T11:00:00.000Z');
        });

        test('should validate start time format', () => {
            expect(() => {
                RideCalculationService.calculateEndTime('invalid-date', 1);
            }).toThrow('Invalid start time format');

            expect(() => {
                RideCalculationService.calculateEndTime(null, 1);
            }).toThrow('Invalid start time format');
        });

        test('should validate duration', () => {
            const startTime = new Date();

            expect(() => {
                RideCalculationService.calculateEndTime(startTime, 0);
            }).toThrow('Duration must be a positive number');

            expect(() => {
                RideCalculationService.calculateEndTime(startTime, -1);
            }).toThrow('Duration must be a positive number');

            expect(() => {
                RideCalculationService.calculateEndTime(startTime, null);
            }).toThrow('Duration must be a positive number');
        });
    });

    describe('isValidPincode', () => {
        test('should validate correct pincode format', () => {
            expect(RideCalculationService.isValidPincode('110001')).toBe(true);
            expect(RideCalculationService.isValidPincode('000000')).toBe(true);
            expect(RideCalculationService.isValidPincode('999999')).toBe(true);
        });

        test('should reject incorrect pincode formats', () => {
            expect(RideCalculationService.isValidPincode('11001')).toBe(false); // 5 digits
            expect(RideCalculationService.isValidPincode('1100012')).toBe(false); // 7 digits
            expect(RideCalculationService.isValidPincode('11000a')).toBe(false); // Contains letter
            expect(RideCalculationService.isValidPincode('110-001')).toBe(false); // Contains dash
            expect(RideCalculationService.isValidPincode('')).toBe(false); // Empty string
            expect(RideCalculationService.isValidPincode(null)).toBe(false); // Null
            expect(RideCalculationService.isValidPincode(110001)).toBe(false); // Number instead of string
        });
    });

    describe('calculateEstimatedDistance', () => {
        test('should calculate distance based on duration', () => {
            const distance = RideCalculationService.calculateEstimatedDistance('110001', '110005');

            // Duration should be 4 hours, distance = 4 * 50 = 200 km
            expect(distance).toBe(200);
        });

        test('should return integer distance', () => {
            const distance = RideCalculationService.calculateEstimatedDistance('110001', '110002');

            expect(Number.isInteger(distance)).toBe(true);
        });

        test('should handle edge cases', () => {
            const distance = RideCalculationService.calculateEstimatedDistance('110001', '110001');

            // Minimum duration of 0.5 hours = 25 km
            expect(distance).toBe(25);
        });
    });

    describe('getRouteInfo', () => {
        test('should return complete route information', () => {
            const routeInfo = RideCalculationService.getRouteInfo('110001', '110005', 1000);

            expect(routeInfo).toHaveProperty('fromPincode', '110001');
            expect(routeInfo).toHaveProperty('toPincode', '110005');
            expect(routeInfo).toHaveProperty('estimatedDurationHours');
            expect(routeInfo).toHaveProperty('estimatedDistanceKm');
            expect(routeInfo).toHaveProperty('estimatedCost');
            expect(routeInfo).toHaveProperty('route', '110001 → 110005');

            expect(typeof routeInfo.estimatedDurationHours).toBe('number');
            expect(typeof routeInfo.estimatedDistanceKm).toBe('number');
            expect(typeof routeInfo.estimatedCost).toBe('number');
        });

        test('should calculate cost based on capacity', () => {
            const routeInfo1 = RideCalculationService.getRouteInfo('110001', '110005', 1000);
            const routeInfo2 = RideCalculationService.getRouteInfo('110001', '110005', 2000);

            expect(routeInfo2.estimatedCost).toBeGreaterThan(routeInfo1.estimatedCost);
        });

        test('should handle default capacity', () => {
            const routeInfo = RideCalculationService.getRouteInfo('110001', '110005');

            expect(routeInfo.estimatedCost).toBeGreaterThan(0);
        });

        test('should validate input parameters', () => {
            expect(() => {
                RideCalculationService.getRouteInfo('11001', '110005', 1000); // Invalid from pincode
            }).toThrow('Invalid pincode format');

            expect(() => {
                RideCalculationService.getRouteInfo('110001', '11005', 1000); // Invalid to pincode
            }).toThrow('Invalid pincode format');
        });
    });

    describe('Error handling', () => {
        test('should provide descriptive error messages', () => {
            expect(() => {
                RideCalculationService.calculateEstimatedDuration('invalid', '110001');
            }).toThrow('Error calculating ride duration: Invalid pincode format');

            expect(() => {
                RideCalculationService.calculateEndTime('invalid-date', 1);
            }).toThrow('Error calculating end time: Invalid start time format');

            expect(() => {
                RideCalculationService.calculateEstimatedDistance('invalid', '110001');
            }).toThrow('Error calculating distance: Invalid pincode format');

            expect(() => {
                RideCalculationService.getRouteInfo('invalid', '110001');
            }).toThrow('Error getting route info: Invalid pincode format');
        });
    });
});