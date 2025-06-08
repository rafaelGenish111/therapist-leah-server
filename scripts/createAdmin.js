const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // התחבר למסד הנתונים
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/leah-genish-clinic'
    );
    
    console.log('✅ Connected to MongoDB');

    // מחק משתמש admin קיים אם יש
    await User.deleteOne({ username: 'admin' });
    console.log('🗑️  Removed existing admin user');

    // צור משתמש admin חדש
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('123456', saltRounds);

    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('📝 Username: admin');
    console.log('🔐 Password: 123456');
    console.log('👤 Role: admin');
    console.log('🆔 ID:', adminUser._id);
    console.log('⚠️  Please change the password after first login!');

    // בדוק שהמשתמש אכן נוצר
    const createdUser = await User.findOne({ username: 'admin' });
    console.log('\n🔍 Verification - User found:', {
      id: createdUser._id,
      username: createdUser.username,
      role: createdUser.role,
      passwordLength: createdUser.password.length
    });

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();