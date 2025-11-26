// Script sederhana untuk membuat user latansa
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createUser() {
  // Konfigurasi database
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'rtrw_db'
  });

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('latansa12', salt);
    
    // Cek apakah user sudah ada
    const [rows] = await connection.execute('SELECT * FROM Users WHERE username = ?', ['latansa']);
    
    if (rows.length > 0) {
      console.log('User "latansa" sudah ada!');
      return;
    }
    
    // Buat user baru
    const [result] = await connection.execute(
      'INSERT INTO Users (id, username, password, fullName, role, isActive, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), NOW())',
      ['latansa', hashedPassword, 'Latansa User', 'admin', 1]
    );
    
    console.log('User berhasil dibuat!');
    console.log('Username: latansa');
    console.log('Role: admin');
    console.log('Full Name: Latansa User');
    console.log('Active: Yes');
    
  } catch (error) {
    console.error('Error membuat user:', error.message);
  } finally {
    await connection.end();
  }
}

createUser();