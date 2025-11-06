const mysql = require('mysql2/promise');

async function checkODPs() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'rtrw_db'
    });

    console.log('Connected to MySQL database');

    // Check ODPs table structure
    console.log('\n=== ODPs Table Structure ===');
    const [structure] = await connection.execute('DESCRIBE odps');
    console.table(structure);

    // Check ODPs data
    console.log('\n=== ODPs Data ===');
    const [odps] = await connection.execute('SELECT * FROM odps ORDER BY id');
    console.table(odps);

    // Check customers table structure for odpId
    console.log('\n=== Customers Table Structure (odpId related) ===');
    const [customerStructure] = await connection.execute('DESCRIBE customers');
    const odpIdField = customerStructure.find(field => field.Field === 'odpId');
    console.log('odpId field:', odpIdField);

    // Check foreign key constraints
    console.log('\n=== Foreign Key Constraints ===');
    const [constraints] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_SCHEMA = 'rtrw_db' 
        AND REFERENCED_TABLE_NAME = 'odps'
    `);
    console.table(constraints);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkODPs();