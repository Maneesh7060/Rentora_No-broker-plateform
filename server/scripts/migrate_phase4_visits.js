require('dotenv').config();
const pool = require('../config/db');

async function migratePhase4Visits() {
  console.log('==============================================');
  console.log('🚀 RUNNING PHASE 4: PROPERTY VISITS MIGRATION');
  console.log('==============================================');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create property_visits table
    console.log('1. Creating property_visits table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS property_visits (
        id             SERIAL PRIMARY KEY,
        property_id    INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        tenant_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        owner_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        visit_date     DATE NOT NULL,
        start_time     TIME NOT NULL,
        end_time       TIME NOT NULL,
        status         VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
        tenant_message TEXT,
        owner_notes    TEXT,
        created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes on property_visits
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_property_visits_property_id ON property_visits(property_id);
      CREATE INDEX IF NOT EXISTS idx_property_visits_tenant_id ON property_visits(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_property_visits_owner_id ON property_visits(owner_id);
      CREATE INDEX IF NOT EXISTS idx_property_visits_visit_date ON property_visits(visit_date);
      CREATE INDEX IF NOT EXISTS idx_property_visits_status ON property_visits(status);
      CREATE INDEX IF NOT EXISTS idx_property_visits_created_at ON property_visits(created_at DESC);
    `);

    // Trigger for property_visits updated_at
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'property_visits_updated_at'
        ) THEN
          CREATE TRIGGER property_visits_updated_at
            BEFORE UPDATE ON property_visits
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);

    // 2. Create visit_availability table
    console.log('2. Creating visit_availability table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS visit_availability (
        id          SERIAL PRIMARY KEY,
        owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        start_time  TIME NOT NULL,
        end_time    TIME NOT NULL,
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(owner_id, property_id, day_of_week)
      );
    `);

    // Indexes on visit_availability
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_visit_availability_owner_id ON visit_availability(owner_id);
      CREATE INDEX IF NOT EXISTS idx_visit_availability_property_id ON visit_availability(property_id);
      CREATE INDEX IF NOT EXISTS idx_visit_availability_day ON visit_availability(day_of_week);
    `);

    // Trigger for visit_availability updated_at
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'visit_availability_updated_at'
        ) THEN
          CREATE TRIGGER visit_availability_updated_at
            BEFORE UPDATE ON visit_availability
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);

    // 3. Seed default availability for existing owners
    console.log('3. Seeding default availability for existing owners...');
    const ownersRes = await client.query(`SELECT id, full_name FROM users WHERE role IN ('owner', 'admin')`);
    
    for (const owner of ownersRes.rows) {
      // Check if availability already exists
      const existRes = await client.query(
        `SELECT COUNT(*) as cnt FROM visit_availability WHERE owner_id = $1 AND property_id IS NULL`,
        [owner.id]
      );
      
      if (parseInt(existRes.rows[0].cnt, 10) === 0) {
        // Seed Monday (1) to Saturday (6) 10:00 - 18:00, Sunday (0) inactive
        const defaultDays = [
          { day: 1, start: '10:00:00', end: '18:00:00', active: true },
          { day: 2, start: '10:00:00', end: '18:00:00', active: true },
          { day: 3, start: '10:00:00', end: '18:00:00', active: true },
          { day: 4, start: '10:00:00', end: '18:00:00', active: true },
          { day: 5, start: '10:00:00', end: '18:00:00', active: true },
          { day: 6, start: '10:00:00', end: '14:00:00', active: true },
          { day: 0, start: '10:00:00', end: '14:00:00', active: false },
        ];

        for (const item of defaultDays) {
          await client.query(
            `INSERT INTO visit_availability (owner_id, property_id, day_of_week, start_time, end_time, is_active)
             VALUES ($1, NULL, $2, $3, $4, $5)
             ON CONFLICT (owner_id, property_id, day_of_week) DO NOTHING`,
            [owner.id, item.day, item.start, item.end, item.active]
          );
        }
        console.log(`  ✓ Default availability seeded for owner: ${owner.full_name} (ID ${owner.id})`);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Phase 4 migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

migratePhase4Visits();
