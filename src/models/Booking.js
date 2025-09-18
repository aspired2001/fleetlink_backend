const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle ID is required']
    },
    customerId: {
        type: String,
        required: [true, 'Customer ID is required'],
        trim: true
    },
    fromPincode: {
        type: String,
        required: [true, 'From pincode is required'],
        trim: true,
        match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
    },
    toPincode: {
        type: String,
        required: [true, 'To pincode is required'],
        trim: true,
        match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required'],
        validate: {
            validator: function (value) {
                return value > new Date();
            },
            message: 'Start time must be in the future'
        }
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required']
    },
    estimatedRideDurationHours: {
        type: Number,
        required: [true, 'Estimated ride duration is required'],
        min: [0.1, 'Ride duration must be at least 0.1 hours']
    },
    status: {
        type: String,
        enum: ['confirmed', 'in-progress', 'completed', 'cancelled'],
        default: 'confirmed'
    },
    actualStartTime: {
        type: Date
    },
    actualEndTime: {
        type: Date
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for efficient queries
bookingSchema.index({ vehicleId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

// Virtual for booking duration in hours
bookingSchema.virtual('actualDurationHours').get(function () {
    if (this.actualStartTime && this.actualEndTime) {
        return (this.actualEndTime - this.actualStartTime) / (1000 * 60 * 60);
    }
    return null;
});

// Validation: End time must be after start time
bookingSchema.pre('save', function (next) {
    if (this.endTime <= this.startTime) {
        return next(new Error('End time must be after start time'));
    }
    next();
});

// Static method to find overlapping bookings
bookingSchema.statics.findOverlappingBookings = function (vehicleId, startTime, endTime, excludeBookingId = null) {
    const query = {
        vehicleId,
        status: { $in: ['confirmed', 'in-progress'] }, // Only consider active bookings
        $or: [
            // Case 1: Existing booking starts before new booking ends AND existing booking ends after new booking starts
            {
                startTime: { $lt: endTime },
                endTime: { $gt: startTime }
            }
        ]
    };

    // Exclude current booking when updating
    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    return this.find(query);
};

module.exports = mongoose.model('Booking', bookingSchema);