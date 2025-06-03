const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const healthDeclarationRoutes = require('./routes/healthDeclarations');
const articleRoutes = require('./routes/articles');
const galleryRoutes = require('./routes/gallery');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/health-declarations', healthDeclarationRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/gallery', galleryRoutes);

// Error handling middleware
app.use((err, req, res, next) => { 
    console.error(err.stack);
    res.status(500).json({message: 'Internal server error'})
});

// 404 handler
app.use('*', (req, res) => {
   res.status(404).json({message: 'Path not found'}) 
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`); 
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});