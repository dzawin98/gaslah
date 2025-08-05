const { User } = require('./backend/models');
const bcrypt = require('bcryptjs');

async function createUser() {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { username: 'latansa' } });
    if (existingUser) {
      console.log('User "latansa" already exists!');
      return;
    }

    // Create new user
    const user = await User.create({
      username: 'latansa',
      password: 'latansa12',
      fullName: 'Latansa User',
      role: 'admin',
      isActive: true
    });

    console.log('User created successfully!');
    console.log('Username:', user.username);
    console.log('Role:', user.role);
    console.log('Full Name:', user.fullName);
    console.log('Active:', user.isActive);
    
  } catch (error) {
    console.error('Error creating user:', error.message);
  } finally {
    process.exit(0);
  }
}

createUser();