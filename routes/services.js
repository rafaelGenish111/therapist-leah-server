const router = require('express').Router();
const Service = require('../models/Service');
const { authenticateToken } = require('../middleware/auth');

// Get all services (public)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let query = { isActive: true };

        // Filter by category
        if (req.query.category && req.query.category !== 'all') {
            query.category = req.query.category;
        }

        // Search functionality
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search.trim(), 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { benefits: { $in: [searchRegex] } }
            ];
        }

        const services = await Service
            .find(query)
            .sort({ order: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'username');

        const total = await Service.countDocuments(query);

        res.json({
            services,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ message: 'Error loading services' });
    }
});

// Get single service (public)
router.get('/:id', async (req, res) => {
    try {
        const service = await Service
            .findById(req.params.id)
            .populate('createdBy', 'username');

        if (!service || !service.isActive) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json(service);

    } catch (error) {
        console.error('Get service error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid service ID' });
        }

        res.status(500).json({ message: 'Error loading service' });
    }
});

// Get all services for admin (protected)
router.get('/admin/all', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let query = {};

        // Search functionality
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search.trim(), 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex }
            ];
        }

        // Filter by category
        if (req.query.category && req.query.category !== 'all') {
            query.category = req.query.category;
        }

        // Filter by active status
        if (req.query.active !== undefined) {
            query.isActive = req.query.active === 'true';
        }

        const services = await Service
            .find(query)
            .populate('createdBy', 'username')
            .sort({ order: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Service.countDocuments(query);

        res.json({
            services,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get admin services error:', error);
        res.status(500).json({ message: 'Error loading services' });
    }
});

// Get services statistics (protected)
router.get('/stats/summary', authenticateToken, async (req, res) => {
    try {
        const [
            totalServices,
            activeServices,
            categoryStats
        ] = await Promise.all([
            Service.countDocuments(),
            Service.countDocuments({ isActive: true }),
            Service.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        const recentServices = await Service
            .find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title category createdAt');

        res.json({
            total: totalServices,
            active: activeServices,
            inactive: totalServices - activeServices,
            categoryStats,
            recentServices
        });

    } catch (error) {
        console.error('Get services stats error:', error);
        res.status(500).json({ message: 'Error loading statistics' });
    }
});

// Create new service (protected)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, duration, price, description, benefits, category, suitableFor, order } = req.body;

        if (!title || !duration || !price || !description) {
            return res.status(400).json({ message: 'Title, duration, price and description are required' });
        }

        // Validate benefits array
        if (benefits && !Array.isArray(benefits)) {
            return res.status(400).json({ message: 'Benefits must be an array' });
        }

        const serviceData = {
            title: title.trim(),
            duration: duration.trim(),
            price: price.trim(),
            description: description.trim(),
            benefits: benefits ? benefits.filter(b => b && b.trim()).map(b => b.trim()) : [],
            category: category || 'general',
            suitableFor: suitableFor ? suitableFor.trim() : '',
            order: order || 0,
            createdBy: req.user._id
        };

        const service = new Service(serviceData);
        await service.save();

        await service.populate('createdBy', 'username');

        res.status(201).json({
            message: 'Service created successfully',
            service
        });

    } catch (error) {
        console.error('Create service error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: 'Error creating service' });
    }
});

// Update service (protected)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { title, duration, price, description, benefits, category, suitableFor, isActive, order } = req.body;

        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Update fields
        if (title) service.title = title.trim();
        if (duration) service.duration = duration.trim();
        if (price) service.price = price.trim();
        if (description) service.description = description.trim();
        if (benefits !== undefined) {
            service.benefits = Array.isArray(benefits) 
                ? benefits.filter(b => b && b.trim()).map(b => b.trim())
                : [];
        }
        if (category) service.category = category;
        if (suitableFor !== undefined) service.suitableFor = suitableFor.trim();
        if (isActive !== undefined) service.isActive = isActive;
        if (order !== undefined) service.order = order;

        service.updatedAt = new Date();
        await service.save();
        await service.populate('createdBy', 'username');

        res.json({
            message: 'Service updated successfully',
            service
        });

    } catch (error) {
        console.error('Update service error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid service ID' });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: 'Error updating service' });
    }
});

// Delete service (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json({ message: 'Service deleted successfully' });

    } catch (error) {
        console.error('Delete service error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid service ID' });
        }

        res.status(500).json({ message: 'Error deleting service' });
    }
});

// Reorder services (protected)
router.put('/reorder/batch', authenticateToken, async (req, res) => {
    try {
        const { services } = req.body;

        if (!Array.isArray(services)) {
            return res.status(400).json({ message: 'Services must be an array' });
        }

        // Update order for each service
        const updatePromises = services.map((item, index) => 
            Service.findByIdAndUpdate(
                item.id,
                { order: index, updatedAt: new Date() },
                { new: true }
            )
        );

        await Promise.all(updatePromises);

        res.json({ message: 'Services reordered successfully' });

    } catch (error) {
        console.error('Reorder services error:', error);
        res.status(500).json({ message: 'Error reordering services' });
    }
});

module.exports = router;