const express = require('express');
const VehicleController = require('../controllers/vehicleController');
const { validateVehicleCreation, validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/vehicles - Create a new vehicle
router.post('/', validateVehicleCreation, VehicleController.createVehicle);

// GET /api/vehicles/available - Find available vehicles (must come before /:id route)
router.get('/available', VehicleController.findAvailableVehicles);

// GET /api/vehicles - Get all vehicles
router.get('/', VehicleController.getAllVehicles);

// GET /api/vehicles/:id - Get vehicle by ID
router.get('/:id', validateObjectId, VehicleController.getVehicleById);

// GET /api/vehicles/:id/utilization - Get vehicle utilization stats
router.get('/:id/utilization', validateObjectId, VehicleController.getVehicleUtilization);

// PATCH /api/vehicles/:id/status - Update vehicle status
router.patch('/:id/status', validateObjectId, VehicleController.updateVehicleStatus);

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', validateObjectId, VehicleController.deleteVehicle);

module.exports = router;