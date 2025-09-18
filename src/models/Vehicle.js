const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vehicle name is required'],
        trim: true,
        maxlength: [100, 'Vehicle name cannot exceed 100 characters']
    },
    capacityKg: {
        type: Number,
        required: [true, 'Vehicle capacity is required'],
        min: [1, 'Capacity must be at least 1 kg'],
        max: [50000, 'Capacity cannot exceed 50,000 kg']
    },
    tyres: {
        type: Number,
        required: [true, 'Number of tyres is required'],
        min: [2, 'Vehicle must have at least 2 tyres'],
        max: [18, 'Vehicle cannot have more than 18 tyres']
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'retired'],
        default: 'active'
    },
    registrationNumber: {
        type: String,
        unique: true,
        sparse: true, // Allow null values but maintain uniqueness
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for efficient queries
vehicleSchema.index({ capacityKg: 1 });
vehicleSchema.index({ status: 1 });

// Virtual for vehicle type based on capacity
vehicleSchema.virtual('type').get(function () {
    if (this.capacityKg <= 1000) return 'Light Vehicle';
    if (this.capacityKg <= 5000) return 'Medium Vehicle';
    return 'Heavy Vehicle';
});

// Pre-save middleware to generate registration number if not provided
vehicleSchema.pre('save', function (next) {
    if (!this.registrationNumber) {
        this.registrationNumber = `FL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);