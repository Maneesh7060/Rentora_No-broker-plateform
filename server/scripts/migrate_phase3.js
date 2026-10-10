const pool = require('../config/db');

async function migratePhase3() {
  console.log('--- Starting Phase 3 Database Migration ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Rental Applications Table
    console.log('Creating rental_applications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS rental_applications (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        tenant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        applicant_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(150) NOT NULL,
        monthly_income NUMERIC(12, 2) NOT NULL CHECK (monthly_income >= 0),
        employment_status VARCHAR(50) NOT NULL DEFAULT 'employed',
        occupation VARCHAR(100),
        occupants INTEGER NOT NULL DEFAULT 1 CHECK (occupants >= 1),
        move_in_date DATE NOT NULL,
        message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
        owner_notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes for rental_applications
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rental_apps_property_id ON rental_applications(property_id);
      CREATE INDEX IF NOT EXISTS idx_rental_apps_tenant_id ON rental_applications(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_rental_apps_owner_id ON rental_applications(owner_id);
      CREATE INDEX IF NOT EXISTS idx_rental_apps_status ON rental_applications(status);
      CREATE INDEX IF NOT EXISTS idx_rental_apps_created_at ON rental_applications(created_at DESC);
    `);

    // Unique partial index: Prevent multiple pending applications by same tenant for same property
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_app 
      ON rental_applications(tenant_id, property_id) 
      WHERE status = 'pending';
    `);

    // Trigger for rental_applications updated_at
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'rental_applications_updated_at'
        ) THEN
          CREATE TRIGGER rental_applications_updated_at
            BEFORE UPDATE ON rental_applications
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);

    // 2. Wishlists Table
    console.log('Creating wishlists table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, property_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
      CREATE INDEX IF NOT EXISTS idx_wishlists_property_id ON wishlists(property_id);
      CREATE INDEX IF NOT EXISTS idx_wishlists_created_at ON wishlists(created_at DESC);
    `);

    // 3. Notifications Table
    console.log('Creating notifications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'application',
        link VARCHAR(255),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    `);

    await client.query('COMMIT');
    console.log('✅ Phase 3 Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

migratePhase3();
