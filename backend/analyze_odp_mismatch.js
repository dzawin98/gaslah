const mysql = require('mysql2/promise');
const axios = require('axios');

async function analyzeODPMismatch() {
  try {
    console.log('🔍 Analyzing ODP ID mismatch between frontend and database...\n');
    
    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'rtrw_db'
    });

    // Get ODPs from database
    const [dbODPs] = await connection.execute('SELECT id, name, area FROM odps ORDER BY id');
    console.log('📊 ODPs in Database:');
    console.log('Total:', dbODPs.length);
    console.log('ID Range:', dbODPs[0]?.id, 'to', dbODPs[dbODPs.length - 1]?.id);
    console.log('Sample ODPs:');
    dbODPs.slice(0, 5).forEach(odp => {
      console.log(`  - ID: ${odp.id}, Name: ${odp.name}, Area: ${odp.area}`);
    });
    
    // Get ODPs from API
    console.log('\n🌐 ODPs from API:');
    const apiResponse = await axios.get('https://api.latansa.my.id/api/odps');
    const apiODPs = apiResponse.data.data;
    console.log('Total:', apiODPs.length);
    console.log('ID Range:', apiODPs[apiODPs.length - 1]?.id, 'to', apiODPs[0]?.id);
    console.log('Sample ODPs:');
    apiODPs.slice(0, 5).forEach(odp => {
      console.log(`  - ID: ${odp.id}, Name: ${odp.name}, Area: ${odp.area}`);
    });
    
    // Compare database vs API
    console.log('\n🔍 Comparison Analysis:');
    const dbIds = new Set(dbODPs.map(odp => odp.id));
    const apiIds = new Set(apiODPs.map(odp => odp.id));
    
    const missingInAPI = [...dbIds].filter(id => !apiIds.has(id));
    const missingInDB = [...apiIds].filter(id => !dbIds.has(id));
    
    console.log('ODPs in DB but not in API:', missingInAPI.length);
    if (missingInAPI.length > 0) {
      console.log('Missing IDs:', missingInAPI.slice(0, 10));
    }
    
    console.log('ODPs in API but not in DB:', missingInDB.length);
    if (missingInDB.length > 0) {
      console.log('Missing IDs:', missingInDB.slice(0, 10));
    }
    
    // Check recent failed customer attempts
    console.log('\n📋 Recent Customer Creation Attempts:');
    const [recentCustomers] = await connection.execute(
      'SELECT odpId, name, createdAt FROM customers ORDER BY createdAt DESC LIMIT 10'
    );
    
    recentCustomers.forEach(customer => {
      const exists = dbIds.has(customer.odpId);
      console.log(`  - ${customer.name}: odpId=${customer.odpId} ${exists ? '✅' : '❌'} (${customer.createdAt})`);
    });
    
    // Check if there are any NULL odpIds
    const [nullOdpCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM customers WHERE odpId IS NULL'
    );
    console.log('\nCustomers with NULL odpId:', nullOdpCount[0].count);
    
    await connection.end();
    
    console.log('\n💡 Recommendations:');
    if (missingInDB.length > 0) {
      console.log('- Frontend is trying to use ODP IDs that don\'t exist in database');
      console.log('- Check if frontend is caching old ODP data');
    }
    if (missingInAPI.length > 0) {
      console.log('- Database has ODPs that aren\'t returned by API');
      console.log('- Check API filtering or ODP status conditions');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeODPMismatch();