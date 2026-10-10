const pool = require('../config/db');

async function migrate() {
  try {
    console.log('Running database migration for furnishing and locality...');

    // 1. Add furnishing column if not exists
    await pool.query(`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS furnishing VARCHAR(30) NOT NULL DEFAULT 'unfurnished';
    `);

    // 2. Add check constraint for furnishing if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'properties_furnishing_check'
        ) THEN
          ALTER TABLE properties 
          ADD CONSTRAINT properties_furnishing_check 
          CHECK (furnishing IN ('unfurnished', 'semi_furnished', 'fully_furnished'));
        END IF;
      END $$;
    `);

    // 3. Add locality column if not exists
    await pool.query(`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS locality VARCHAR(150);
    `);

    // 4. Create indexes on furnishing and locality
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_furnishing ON properties(furnishing);
      CREATE INDEX IF NOT EXISTS idx_properties_locality ON properties(locality);
    `);

    console.log('✅ Migration completed successfully!');

    const res = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'properties' 
      ORDER BY ordinal_position;
    `);
    console.log('Updated columns:');
    console.table(res.rows);

    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
