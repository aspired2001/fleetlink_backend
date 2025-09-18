const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

// Cleanup after each test
afterEach(async () => {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

// Cleanup after all tests
afterAll(async () => {
    // Close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    // Stop the in-memory MongoDB instance
    if (mongoServer) {
        await mongoServer.stop();
    }
});

// Mock console methods to reduce test noise
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

// Test utilities
global.testUtils = {
    // Create a valid vehicle data object
    createValidVehicleData: (overrides = {}) => ({
        name: 'Test Vehicle',
        capacityKg: 1000,
        tyres: 4,
        ...overrides
    }),

    // Create a valid booking data object
    createValidBookingData: (vehicleId, overrides = {}) => ({
        vehicleId: vehicleId.toString(),
        customerId: 'TEST_CUSTOMER_001',
        fromPincode: '110001',
        toPincode: '110002',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        ...overrides
    }),

    // Wait for a specified amount of time
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // Generate a future date
    getFutureDate: (hoursFromNow = 24) => {
        const date = new Date();
        date.setHours(date.getHours() + hoursFromNow);
        return date;
    },

    // Generate a past date
    getPastDate: (hoursAgo = 24) => {
        const date = new Date();
        date.setHours(date.getHours() - hoursAgo);
        return date;
    }
};