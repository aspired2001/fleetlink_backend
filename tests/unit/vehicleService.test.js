const mongoose = require('mongoose');
const VehicleService = require('../../src/services/vehicleService');
const Vehicle = require('../../src/models/Vehicle');
const Booking = require('../../src/models/Booking');

describe('VehicleService', () => {
  describe('createVehicle', () => {
    test('should create a vehicle successfully', async () => {
      const vehicleData = testUtils.createValidVehicleData();
      
      const vehicle = await VehicleService.createVehicle(vehicleData);
      
      expect(vehicle).toBeTruthy();
      expect(vehicle.name).toBe(vehicleData.name);
      expect(vehicle.capacityKg).toBe(vehicleData.capacityKg);
      expect(vehicle.tyres).toBe(vehicleData.tyres);
      expect(vehicle.status).toBe('active');
      expect(vehicle.registrationNumber).toBeTruthy();
    });

    test('should handle duplicate registration number', async () => {
      const vehicleData = testUtils.createValidVehicleData({
        registrationNumber: 'TEST-123'
      });
      
      // Create first vehicle
      await VehicleService.createVehicle(vehicleData);
      
      // Try to create second vehicle with same registration
      await expect(VehicleService.createVehicle(vehicleData))
        .rejects.toThrow('Vehicle with this registration number already exists');
    });
  });

  describe('findAvailableVehicles', () => {
    let vehicle1, vehicle2;

    beforeEach(async () => {
      // Create test vehicles
      vehicle1 = await VehicleService.createVehicle(
        testUtils.createValidVehicleData({ name: 'Vehicle 1', capacityKg: 1000 })
      );
      vehicle2 = await VehicleService.createVehicle(
        testUtils.createValidVehicleData({ name: 'Vehicle 2', capacityKg: 2000 })
      );
    });

    test('should find available vehicles with sufficient capacity', async () => {
      const criteria = {
        capacityRequired: 500,
        fromPincode: '110001',
        toPincode: '110002',
        startTime: testUtils.getFutureDate(24).toISOString()
      };

      const availableVehicles = await VehicleService.findAvailableVehicles(criteria);

      expect(availableVehicles).toHaveLength(2);
      expect(availableVehicles[0].estimatedRideDurationHours).toBeDefined();
      expect(availableVehicles[0].routeInfo).toBeDefined();
    });

    test('should filter vehicles by capacity requirement', async () => {
      const criteria = {
        capacityRequired: 1500,
        fromPincode: '110001',
        toPincode: '110002',
        startTime: testUtils.getFutureDate(24).toISOString()
      };

      const availableVehicles = await VehicleService.findAvailableVehicles(criteria);

      expect(availableVehicles).toHaveLength(1);
      expect(availableVehicles[0].name).toBe('Vehicle 2');
    });

    test('should exclude booked vehicles from results', async () => {
      const startTime = testUtils.getFutureDate(24);
      const endTime = testUtils.getFutureDate(26);

      // Create a booking for vehicle1
      await new Booking({
        vehicleId: vehicle1._id,
        customerId: 'TEST_CUSTOMER',
        fromPincode: '110001',
        toPincode: '110002',
        startTime,
        endTime,
        estimatedRideDurationHours: 2,
        status: 'confirmed'
      }).save();

      const criteria = {
        capacityRequired: 500,
        fromPincode: '110001',
        toPincode: '110002',
        startTime: startTime.toISOString()
      };

      const availableVehicles = await VehicleService.findAvailableVehicles(criteria);

      expect(availableVehicles).toHaveLength(1);
      expect(availableVehicles[0].name).toBe('Vehicle 2');
    });

    test('should validate pincode format', async () => {
      const criteria = {
        capacityRequired: 500,
        fromPincode: '11001', // Invalid: 5 digits
        toPincode: '110002',
        startTime: testUtils.getFutureDate(24).toISOString()
      };

      await expect(VehicleService.findAvailableVehicles(criteria))
        .rejects.toThrow('Invalid pincode format');
    });

    test('should validate future start time', async () => {
      const criteria = {
        capacityRequired: 500,
        fromPincode: '110001',
        toPincode: '110002',
        startTime: testUtils.getPastDate(1).toISOString()
      };

      await expect(VehicleService.findAvailableVehicles(criteria))
        .rejects.toThrow('Start time must be in the future');
    });
  });

  describe('getVehicleById', () => {
    test('should retrieve vehicle by ID', async () => {
      const vehicleData = testUtils.createValidVehicleData();
      const createdVehicle = await VehicleService.createVehicle(vehicleData);

      const retrievedVehicle = await VehicleService.getVehicleById(createdVehicle._id);

      expect(retrievedVehicle.name).toBe(vehicleData.name);
      expect(retrievedVehicle.capacityKg).toBe(vehicleData.capacityKg);
    });

    test('should throw error for non-existent vehicle', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      await expect(VehicleService.getVehicleById(nonExistentId))
        .rejects.toThrow('Vehicle not found');
    });
  });

  describe('updateVehicleStatus', () => {
    test('should update vehicle status successfully', async () => {
      const vehicle = await VehicleService.createVehicle(testUtils.createValidVehicleData());

      const updatedVehicle = await VehicleService.updateVehicleStatus(
        vehicle._id, 
        'maintenance'
      );

      expect(updatedVehicle.status).toBe('maintenance');
    });

    test('should throw error for invalid vehicle ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      await expect(VehicleService.updateVehicleStatus(nonExistentId, 'maintenance'))
        .rejects.toThrow('Vehicle not found');
    });
  });

  describe('deleteVehicle', () => {
    test('should soft delete vehicle without active bookings', async () => {
      const vehicle = await VehicleService.createVehicle(testUtils.createValidVehicleData());

      const deletedVehicle = await VehicleService.deleteVehicle(vehicle._id);

      expect(deletedVehicle.status).toBe('retired');
    });

    test('should prevent deletion of vehicle with active bookings', async () => {
      const vehicle = await VehicleService.createVehicle(testUtils.createValidVehicleData());

      // Create an active booking
      await new Booking({
        vehicleId: vehicle._id,
        customerId: 'TEST_CUSTOMER',
        fromPincode: '110001',
        toPincode: '110002',
        startTime: testUtils.getFutureDate(24),
        endTime: testUtils.getFutureDate(26),
        estimatedRideDurationHours: 2,
        status: 'confirmed'
      }).save();

      await expect(VehicleService.deleteVehicle(vehicle._id))
        .rejects.toThrow('Cannot delete vehicle with active bookings');
    });
  });

  describe('getVehicleUtilization', () => {
    test('should calculate vehicle utilization stats', async () => {
      const vehicle = await VehicleService.createVehicle(testUtils.createValidVehicleData());

      // Create some bookings
      await new Booking({
        vehicleId: vehicle._id,
        customerId: 'TEST_CUSTOMER_1',
        fromPincode: '110001',
        toPincode: '110002',
        startTime: testUtils.getFutureDate(24),
        endTime: testUtils.getFutureDate(26),
        estimatedRideDurationHours: 2,
        status: 'confirmed'
      }).save();

      await new Booking({
        vehicleId: vehicle._id,
        customerId: 'TEST_CUSTOMER_2',
        fromPincode: '110003',
        toPincode: '110004',
        startTime: testUtils.getFutureDate(48),
        endTime: testUtils.getFutureDate(52),
        estimatedRideDurationHours: 4,
        status: 'completed'
      }).save();

      const stats = await VehicleService.getVehicleUtilization(vehicle._id);

      expect(stats.totalBookings).toBe(2);
      expect(stats.confirmedBookings).toBe(1);
      expect(stats.completedBookings).toBe(1);
      expect(stats.totalHoursBooked).toBe(6);
      expect(stats.averageRideDuration).toBe(3);
    });
  });
});