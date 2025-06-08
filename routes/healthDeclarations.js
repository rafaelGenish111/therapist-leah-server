const router = require('express').Router();
const HealthDeclaration = require('../models/HealthDeclaration');
const { authenticateToken } = require('../middleware/auth');

// Get health declaration statistics (protected)
router.get('/stats/summary', authenticateToken, async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            totalDeclarations,
            todayDeclarations,
            weekDeclarations,
            monthDeclarations
        ] = await Promise.all([
            HealthDeclaration.countDocuments(),
            HealthDeclaration.countDocuments({ createdAt: { $gte: startOfDay } }),
            HealthDeclaration.countDocuments({ createdAt: { $gte: startOfWeek } }),
            HealthDeclaration.countDocuments({ createdAt: { $gte: startOfMonth } })
        ]);

        res.json({
            total: totalDeclarations, 
            today: todayDeclarations,
            thisWeek: weekDeclarations,
            thisMonth: monthDeclarations
        });

    } catch (error) {
        console.error('Get health declaration stats error:', error);
        res.status(500).json({ message: 'Error loading stats' });
    }
});

// Submit health declaration (public)
router.post('/', async (req, res) => {
    try {
        const {
            fullName,
            idNumber,
            phoneNumber,
            healthConditions,
            declarationConfirmed,
            signature
        } = req.body;

        if (!fullName || !idNumber || !phoneNumber || !signature) {
            return res.status(400).json({ message: 'All required fields must be filled in' });
        }

        if (!declarationConfirmed) {
            return res.status(400).json({ message: 'The declaration must be confirmed' });
        }

        if (!/^\d{9}$/.test(idNumber)) {
            return res.status(400).json({ message: 'ID number is not correct' });
        }

        if (!/^0\d{1,2}-?\d{7}$/.test(phoneNumber.replace(/\s/g, ''))) {
            return res.status(400).json({ message: 'Phone number is not correct' });
        }

        if (healthConditions.surgeries?.hasSurgeries && !healthConditions.surgeries?.details?.trim()) {
            return res.status(400).json({ message: 'You must detail the surgeries you have undergone' });
        }

        if (healthConditions.otherMedicalIssues?.hasOtherIssues && !healthConditions.otherMedicalIssues?.details?.trim()) {
            return res.status(400).json({ message: 'You must detail the other medical issues' });
        }

        const declaration = new HealthDeclaration({
            fullName: fullName.trim(),
            idNumber: idNumber.trim(),
            phoneNumber: phoneNumber.trim(),
            healthConditions,
            declarationConfirmed,
            signature,
            ipAddress: req.ip || req.connection.remoteAddress
        });

        await declaration.save();

        res.status(201).json({
            message: 'Health declaration sent successfully',
            declarationId: declaration._id
        });

    } catch (error) {
        console.error('Health declaration submission error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all health declarations (protected)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let query = {};

        if (req.query.search) {
            const search = req.query.search.trim();
            query.$or = [
                { fullName: new RegExp(search, 'i') },
                { idNumber: new RegExp(search, 'i') }
            ];
        }

        if (req.query.fromDate || req.query.toDate) {
            query.createdAt = {};
            if (req.query.fromDate) {
                query.createdAt.$gte = new Date(req.query.fromDate);
            }
            if (req.query.toDate) {
                query.createdAt.$lte = new Date(req.query.toDate);
            }
        }

        const declarations = await HealthDeclaration
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-signature');

        const total = await HealthDeclaration.countDocuments(query);

        res.json({
            declarations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get health declarations error:', error);
        res.status(500).json({ message: 'Error loading declarations' });
    }
});

// Get single health declaration (protected)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const declaration = await HealthDeclaration.findById(req.params.id);

        if (!declaration) {
            return res.status(404).json({ message: 'Declaration not found' });
        }

        res.json(declaration);

    } catch (error) {
        console.error('Get health declaration error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID' });
        }

        res.status(500).json({ message: 'Error loading declaration' });
    }
});

// Delete health declaration (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const declaration = await HealthDeclaration.findByIdAndDelete(req.params.id);

        if (!declaration) {
            return res.status(404).json({ message: 'Declaration not found' });
        }

        res.json({ message: 'Declaration deleted successfully' });

    } catch (error) {
        console.error('Delete health declaration error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID' });
        }

        res.status(500).json({ message: 'Error deleting declaration' });
    }
});

module.exports = router;