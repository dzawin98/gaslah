const mysql = require('mysql2/promise');

async function checkODPIds() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'rtrw_db'
    });

    console.log('=== Available ODP IDs in Database ===');
    const [odps] = await connection.execute('SELECT id, name, area FROM odps ORDER BY id');
    
    if (odps.length === 0) {
      console.log('❌ NO ODPs found in database!');
    } else {
      console.log('✅ Found ODPs:');
      odps.forEach(odp => {
        console.log(`  ID: ${odp.id} - Name: ${odp.name} - Area: ${odp.area}`);
      });
    }

    console.log('\n=== Recent Customer Creation Attempts ===');
    const [customers] = await connection.execute(`
      SELECT id, name, odpId, createdAt 
      FROM customers 
      ORDER BY createdAt DESC 
      LIMIT 5
    `);
    
    customers.forEach(customer => {
      console.log(`  Customer: ${customer.name} - odpId: ${customer.odpId} - Created: ${customer.createdAt}`);
    });

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkODPIds();