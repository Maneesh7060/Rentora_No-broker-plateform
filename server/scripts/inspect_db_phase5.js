const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function inspect() {
  try {
    const users = await pool.query('SELECT id, full_name, email, role, is_verified FROM users');
    console.log('--- USERS IN DB ---');
    console.table(users.rows);

    const props = await pool.query('SELECT id, title, owner_id, status FROM properties');
    console.log('--- PROPERTIES IN DB ---');
    console.table(props.rows);

    const uCols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`);
    console.log('--- USERS COLUMNS ---');
    console.table(uCols.rows);

    const pCols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'properties'`);
    console.log('--- PROPERTIES COLUMNS ---');
    console.table(pCols.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

inspect();
