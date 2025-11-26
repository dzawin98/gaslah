const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Baca konfigurasi database dari file config.json
const configPath = path.join(__dirname, 'backend', 'config', 'config.json');
const configFile = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configFile);

// Gunakan konfigurasi development
const dbConfig = config.development;

// Buat koneksi ke database
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false
  }
);

// Definisikan model User
const User = sequelize.define('User', {
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  fullName: {
    type: Sequelize.STRING,
    allowNull: true
  },
  role: {
    type: Sequelize.ENUM('admin', 'operator', 'viewer'),
    allowNull: false,
    defaultValue: 'admin'
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  loginAttempts: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  lockedUntil: {
    type: Sequelize.DATE,
    allowNull: true
  },
  lastLogin: {
    type: Sequelize.DATE,
    allowNull: true
  },
  refreshToken: {
    type: Sequelize.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: true
});

// Fungsi untuk membuat user
async function createUser() {
  try {
    // Cek koneksi ke database
    await sequelize.authenticate();
    console.log('Koneksi ke database berhasil.');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('latansa12', salt);

    // Cek apakah user sudah ada
    const existingUser = await User.findOne({ where: { username: 'latansa' } });
    
    if (existingUser) {
      console.log('User "latansa" sudah ada!');
      return;
    }

    // Buat user baru
    const user = await User.create({
      username: 'latansa',
      password: hashedPassword,
      fullName: 'Latansa User',
      role: 'admin',
      isActive: true
    });

    console.log('User berhasil dibuat!');
    console.log('Username:', user.username);
    console.log('Role:', user.role);
    console.log('Full Name:', user.fullName);
    console.log('Active:', user.isActive);
    
  } catch (error) {
    console.error('Error membuat user:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Jalankan fungsi
createUser();