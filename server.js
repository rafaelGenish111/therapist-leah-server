const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');

require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const healthDeclarationRoutes = require('./routes/healthDeclarations');
const articleRoutes = require('./routes/articles');
const galleryRoutes = require('./routes/gallery');
const serviceRoute = require('./routes/services');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// יצירת תיקיית uploads אם לא קיימת
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// הגשת קבצים סטטיים מתיקיית uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path) => {
        // הוספת headers לתמונות
        if (path.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // שנה אחת
            res.setHeader('Content-Type', 'image/' + path.split('.').pop().toLowerCase());
        }
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/health-declarations', healthDeclarationRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/services', serviceRoute);

// Test route for uploads
app.get('/api/test-upload', (req, res) => {
    const uploadsPath = path.join(__dirname, 'uploads');
    try {
        const files = fs.readdirSync(uploadsPath);
        res.json({
            uploadsPath,
            files: files.slice(0, 10), // רק 10 קבצים ראשונים
            totalFiles: files.length
        });
    } catch (error) {
        res.status(500).json({
            error: 'Cannot read uploads directory',
            uploadsPath,
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => { 
    console.error('Error stack:', err.stack);
    
    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'קובץ גדול מדי. הגודל המקסימלי הוא 5MB' });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'יותר מדי קבצים' });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'שדה קובץ לא צפוי' });
    }
    
    // Generic error
    res.status(err.status || 500).json({
        message: err.message || 'שגיאה פנימית בשרת',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'נתיב לא נמצא',
        path: req.originalUrl,
        method: req.method
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`); 
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log(`📁 Uploads URL: http://localhost:${PORT}/uploads`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
});