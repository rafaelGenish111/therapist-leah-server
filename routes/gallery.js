const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const GalleryImage = require('../models/GalleryImage');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// Get all images for admin (protected)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by visibility
    if (req.query.visible !== undefined) {
      query.isVisible = req.query.visible === 'true';
    }

    const images = await GalleryImage
      .find(query)
      .populate('uploadedBy', 'username')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GalleryImage.countDocuments(query);

    // Get category statistics
    const categoryStats = await GalleryImage.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      images,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      categoryStats
    });

  } catch (error) {
    console.error('Get admin gallery images error:', error);
    res.status(500).json({ message: 'Error louding gallery images' });
  }
});

// Get gallery statistics (protected)
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const [
      totalImages,
      visibleImages,
      totalSize
    ] = await Promise.all([
      GalleryImage.countDocuments(),
      GalleryImage.countDocuments({ isVisible: true }),
      GalleryImage.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ])
    ]);

    const categoryDistribution = await GalleryImage.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentImages = await GalleryImage
      .find({ isVisible: true })
      .sort({ uploadedAt: -1 })
      .limit(5)
      .select('filename originalName uploadedAt category');

    res.json({
      total: totalImages,
      visible: visibleImages,
      hidden: totalImages - visibleImages,
      totalSize: totalSize[0]?.totalSize || 0,
      categoryDistribution,
      recentImages
    });

  } catch (error) {
    console.error('Get gallery stats error:', error);
    res.status(500).json({ message: 'Error get gallery stats' });
  }
});

// Bulk operations (protected)
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { action, imageIds } = req.body;

    if (!action || !imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({ message: 'Action and image ID are required' });
    }

    let result;

    switch (action) {
      case 'hide':
        result = await GalleryImage.updateMany(
          { _id: { $in: imageIds } },
          { isVisible: false }
        );
        break;

      case 'show':
        result = await GalleryImage.updateMany(
          { _id: { $in: imageIds } },
          { isVisible: true }
        );
        break;

      case 'delete':
        const imagesToDelete = await GalleryImage.find({ _id: { $in: imageIds } });
        
        // Delete physical files
        imagesToDelete.forEach(image => {
          const filePath = path.join(__dirname, '../uploads', image.filename);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (fileError) {
              console.error('Error deleting file:', fileError);
            }
          }
        });

        result = await GalleryImage.deleteMany({ _id: { $in: imageIds } });
        break;

      default:
        return res.status(400).json({ message: 'Unsuppored oparation' });
    }

    res.json({
      message: `Operation '${action}' completed succssfully`,
      affectedCount: result.modifiedCount || result.deletedCount
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({ message: 'Error bulk operation' });
  }
});

// Get all gallery images (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { isVisible: true };

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    const images = await GalleryImage
      .find(query)
      .populate('uploadedBy', 'username')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GalleryImage.countDocuments(query);

    res.json({
      images,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get gallery images error:', error);
    res.status(500).json({ message: 'Error loading gallery'});
  }
});

// Get single image (public)
router.get('/:id', async (req, res) => {
  try {
    const image = await GalleryImage
      .findById(req.params.id)
      .populate('uploadedBy', 'username');
    
    if (!image || !image.isVisible) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json(image);

  } catch (error) {
    console.error('Get gallery image error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Uncorrect image ID' });
    }
    
    res.status(500).json({ message: 'Error loading image' });
  }
});

// Upload new image (protected)
router.post('/', authenticateToken, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'לא הועלתה תמונה' });
    }

    const { description, category = 'general' } = req.body;

    const imageData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      description: description || '',
      category,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id
    };

    const galleryImage = new GalleryImage(imageData);
    await galleryImage.save();
    
    await galleryImage.populate('uploadedBy', 'username');

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: galleryImage
    });

  } catch (error) {
    console.error('Upload image error:', error);
    
    // Delete uploaded file if database save failed
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    res.status(500).json({ message: 'Error uoloading image' });
  }
});

// Update image details (protected)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { description, category, isVisible } = req.body;

    const image = await GalleryImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Update fields
    if (description !== undefined) image.description = description;
    if (category !== undefined) image.category = category;
    if (isVisible !== undefined) image.isVisible = isVisible;

    await image.save();
    await image.populate('uploadedBy', 'username');

    res.json({
      message: 'Image details updated successfully',
      image
    });

  } catch (error) {
    console.error('Update image error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Uncorrect image ID' });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    res.status(500).json({ message: 'Error updating image details' });
  }
});

// Delete image (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const image = await GalleryImage.findByIdAndDelete(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '../uploads', image.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    res.json({ message: 'Image deleted succssfully' });

  } catch (error) {
    console.error('Delete image error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Uncorrect image ID' });
    }
    
    res.status(500).json({ message: 'Error deleting image' });
  }
});

module.exports = router;