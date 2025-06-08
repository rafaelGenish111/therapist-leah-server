const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leah-genish-clinic');
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('❌ Admin user already exists');
            process.exit(1);
        }

        // Create admin user
        const saltRounds = 10;
        const password = process.argv[2] || 'admin123456'; // Default password or from command line
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const admin = new User({
            username: 'admin',
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin user created successfully');
        console.log(`📝 Username: admin`);
        console.log(`🔐 Password: ${password}`);
        console.log('⚠️  Please change the password after first login!');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    }
};

// Handle command line arguments
if (process.argv.length > 3) {
    console.log('Usage: node createAdmin.js [password]');
    process.exit(1);
}

createAdmin();