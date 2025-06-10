const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 200
    },
    duration: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    price: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    description: {
        type: String,
        required: true,
        maxLength: 1000
    },
    benefits: [{
        type: String,
        trim: true,
        maxLength: 200
    }],
    category: {
        type: String,
        default: 'general',
        enum: ['relaxation', 'therapeutic', 'sports', 'specialized', 'alternative', 'luxury', 'general']
    },
    suitableFor: {
        type: String,
        maxLength: 500,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

ServiceSchema.index({ createdAt: -1 });
ServiceSchema.index({ order: 1, createdAt: -1 });
ServiceSchema.index({ category: 1, order: 1 });

ServiceSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('Service', ServiceSchema);