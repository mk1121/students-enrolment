const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/students-enrollment',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.log('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Admin user data
const adminData = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@studentsenrollment.com',
  password: 'admin123456',
  phone: '+1234567890',
  role: 'admin',
  isEmailVerified: true,
  isActive: true,
  dateOfBirth: new Date('1990-01-01'),
  address: {
    street: '123 Admin Street',
    city: 'Admin City',
    state: 'Admin State',
    zipCode: '12345',
    country: 'Admin Country',
  },
};

// Create admin user
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create new admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 Role:', admin.role);
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.log('User with this email already exists!');
    }
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
createAdmin();
