'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  try {
    const cfgPath = path.join(__dirname, '..', 'config', 'config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')).development;
    const conn = await mysql.createConnection({
      host: cfg.host || 'localhost',
      user: cfg.username,
      password: cfg.password || undefined,
      database: cfg.database,
      port: cfg.port || 3306
    });

    const [exists] = await conn.query("SHOW COLUMNS FROM Transactions LIKE 'receivedBy';");
    if (exists.length === 0) {
      await conn.query('ALTER TABLE Transactions ADD COLUMN receivedBy VARCHAR(255) NULL;');
      console.log('[DB] Column receivedBy ADDED');
    } else {
      console.log('[DB] Column receivedBy already EXISTS');
    }

    const [cols] = await conn.query('SHOW COLUMNS FROM Transactions;');
    console.log('[DB] Columns:', cols.map(c => c.Field).join(','));
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('[DB] Error:', e.message);
    process.exit(1);
  }
})();

