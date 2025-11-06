const mysql = require('mysql2/promise');

async function cleanupTestCustomer() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'rtrw_db'
    });

    // Delete the test customer
    const [result] = await connection.execute(
      "DELETE FROM customers WHERE name = 'Test Customer Debug'"
    );
    
    console.log('Deleted test customer:', result.affectedRows, 'rows');
    
    // Reset ODP slot count for ODP 47
    await connection.execute(
      "UPDATE odps SET usedSlots = usedSlots - 1, availableSlots = availableSlots + 1 WHERE id = 47"
    );
    
    console.log('Reset ODP slot count for ODP 47');
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

cleanupTestCustomer();