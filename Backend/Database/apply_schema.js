require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pool = require('./connection');

async function applySchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('Schema applied successfully from Database/schema.sql');
  } catch (error) {
    console.error('Failed to apply schema:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

applySchema();
