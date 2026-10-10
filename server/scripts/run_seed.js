const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function seed() {
  try {
    const seedSql = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf-8');
    await pool.query(seedSql);
    console.log('✅ Seed executed successfully!');

    const res = await pool.query('SELECT id, title, locality, city, bedrooms, furnishing, rent_amount FROM properties ORDER BY id ASC;');
    console.log(`Total properties in DB: ${res.rows.length}`);
    console.table(res.rows);

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
