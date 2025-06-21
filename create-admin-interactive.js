const mongoose = require('mongoose');
const User = require('./server/models/User');
const readline = require('readline');
require('dotenv').config();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/students-enrollment', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.log('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

// Create admin user interactively
const createAdminInteractive = async () => {
  try {
    console.log('\n🚀 Creating Admin User for Students Enrollment System\n');
    console.log('Please provide the following information:\n');

    // Get admin details
    const firstName = await askQuestion('First Name: ');
    const lastName = await askQuestion('Last Name: ');
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Password (min 6 characters): ');
    const phone = await askQuestion('Phone (optional): ');
    const street = await askQuestion('Street Address: ');
    const city = await askQuestion('City: ');
    const state = await askQuestion('State/Province: ');
    const zipCode = await askQuestion('ZIP/Postal Code: ');
    const country = await askQuestion('Country: ');

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      console.log('❌ First name, last name, email, and password are required!');
      rl.close();
      mongoose.connection.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters long!');
      rl.close();
      mongoose.connection.close();
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('\n❌ User with this email already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      rl.close();
      mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user data
    const adminData = {
      firstName,
      lastName,
      email,
      password,
      phone: phone || undefined,
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
      dateOfBirth: new Date('1990-01-01'),
      address: {
        street,
        city,
        state,
        zipCode,
        country
      }
    };

    // Create new admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', admin.role);
    console.log('📱 Phone:', admin.phone || 'Not provided');
    console.log('📍 Address:', `${admin.address.street}, ${admin.address.city}, ${admin.address.state} ${admin.address.zipCode}, ${admin.address.country}`);
    console.log('\n⚠️  Please change the password after first login!');
    console.log('\n🔗 You can now login at: http://localhost:3000/login');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.log('User with this email already exists!');
    }
  } finally {
    rl.close();
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
createAdminInteractive(); 