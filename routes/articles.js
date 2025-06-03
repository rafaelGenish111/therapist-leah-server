const router = require('express').Router();
const Article = require('../models/Articles');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex }
      ];
    }

    // Filter by published status
    if (req.query.published !== undefined) {
      query.isPublished = req.query.published === 'true';
    }

    const articles = await Article
      .find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Article.countDocuments(query);

    res.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get admin articles error:', error);
    res.status(500).json({ message: 'Error loading articles' });
  }
});

router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const [
      totalArticles,
      publishedArticles,
      totalViews
    ] = await Promise.all([
      Article.countDocuments(),
      Article.countDocuments({ isPublished: true }),
      Article.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ])
    ]);

    const popularArticles = await Article
      .find({ isPublished: true })
      .sort({ views: -1 })
      .limit(5)
      .select('title views createdAt');

    res.json({
      total: totalArticles,
      published: publishedArticles,
      drafts: totalArticles - publishedArticles,
      totalViews: totalViews[0]?.totalViews || 0,
      popularArticles
    });

  } catch (error) {
    console.error('Get articles stats error:', error);
    res.status(500).json({ message: 'Error loading statistics' });
  }
});

// Get all published articles (public)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = { isPublished: true };

        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search.trim(), 'i');
            query.$or = [
                { title: searchRegex },
                { content: searchRegex },
                { tags: { $in: [searchRegex] } }
            ];
        }

        if (req.query.tags) {
            const tags = req.query.tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tags };
        }
        const articles = await Article
            .find(query)
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Article.countDocuments(query);

        res.json({
            articles,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get articles error:', error);
        res.status(500).json({ message: 'Error loading articles' });
    }
});

// Get single article (public)
router.get('/:id', async (req, res) => {
    try {
        const article = await Article
            .findById(req.params.id)
            .populate('author', 'username');

        if (!article || !article.isPublished) {
            return res.status(404).json({ message: 'Article not found' });
        }

        article.views += 1;
        await article.save();

        res.json(article);

    } catch (error) {
        console.error('Get articles error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Uncorrect article ID' });
        }

        res.status(500).json({ message: 'Error loading article' });
    }
});

// Create new article (protected)
router.post('/', authenticateToken, upload.single('image'), handleUploadError, async (req, res) => {
    try {
        const { title, content, tags, isPublished = true } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required fields' });
        }

        const articleData = {
            title: title.trim(),
            content: content.trim(),
            author: req.user._id,
            isPublished: isPublished === 'true' || isPublished === true
        };

        if (req.file) {
            articleData.image = req.file.filename;
        }

        if (tags) {
            articleData.tags = typeof tags === 'string'
                ? tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                : tags;
        }

        const article = new Article(articleData);
        await article.save();

        await article.populate('author', 'username');

        res.status(201).json({
            message: 'Article created successfully',
            article
        });

    } catch (error) {
        console.error('Create article error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Error creating article' })
        }
    }
});

// Update article (protected)
router.put('/:id', authenticateToken, upload.single('image'), handleUploadError, async (req, res) => {
    try {
        const { title, content, tags, isPublished } = req.body;

        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        if (title) article.title = title.trim();
        if (content) article.content = content.trim();
        if (isPublished !== undefined) {
            article.isPublished = isPublished === 'true' || isPublished === true;
        }

        if (req.file) {
            article.image = req.file.filename;
        }

        if (tags !== undefined) {
            article.tags = typeof tags === 'string'
                ? tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                : tags || [];
        }

        article.updatedAt = new Date();
        await article.save();
        await article.populate('author', 'username');

        res.json({
            message: 'Article updated successfully',
            article
        });

    } catch (error) {
        console.error('Update article error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Uncorrect article ID' });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: 'Error updating article' });
    }
});

// Delete article (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // TODO: Delete associated image file if exists

    res.json({ message: 'Article deleted successfully' });

  } catch (error) {
    console.error('Delete article error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Uncorrect article ID' });
    }
    
    res.status(500).json({ message: 'Error deleting article' });
  }
});


module.exports = router;