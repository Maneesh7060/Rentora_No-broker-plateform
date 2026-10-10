const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function migratePhase5() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 5 DATABASE MIGRATION');
  console.log('====================================================');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Extend USERS table
    console.log('1. Adding profile & account status fields to users table...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS state VARCHAR(100),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (account_status IN ('ACTIVE', 'SUSPENDED'));
    `);

    // Ensure users index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
    `);

    // 2. Extend PROPERTIES table for Verification & Rejection
    console.log('2. Adding verification & rejection fields to properties table...');
    await client.query(`
      ALTER TABLE properties
      ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) NOT NULL DEFAULT 'verified',
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // Update check constraint on properties.status if needed to allow all lifecycle statuses
    await client.query(`
      DO $$
      BEGIN
        ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
        ALTER TABLE properties ADD CONSTRAINT properties_status_check
          CHECK (status IN ('draft', 'pending_verification', 'pending', 'published', 'verified', 'active', 'rejected', 'rented', 'inactive'));
      EXCEPTION
        WHEN others THEN NULL;
      END $$;
    `);

    // Create index on verification_status
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_verification_status ON properties(verification_status);
    `);

    // 3. Create DOCUMENTS table
    console.log('3. Creating documents table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id      INTEGER REFERENCES properties(id) ON DELETE SET NULL,
        application_id   INTEGER REFERENCES rental_applications(id) ON DELETE SET NULL,
        document_type    VARCHAR(50) NOT NULL
          CHECK (document_type IN ('IDENTITY', 'ADDRESS_PROOF', 'INCOME_PROOF', 'PROPERTY_DOCUMENT', 'RENTAL_DOCUMENT', 'OTHER')),
        file_name        VARCHAR(255) NOT NULL,
        file_url         TEXT NOT NULL,
        file_size        INTEGER,
        mime_type        VARCHAR(100),
        status           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
          CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
        rejection_reason TEXT,
        uploaded_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        verified_at      TIMESTAMP WITH TIME ZONE,
        created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
      CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
      CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
      CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
    `);

    // Trigger for documents updated_at
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'documents_updated_at'
        ) THEN
          CREATE TRIGGER documents_updated_at
            BEFORE UPDATE ON documents
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);

    // 4. Update demo data
    console.log('4. Seeding profile defaults for key demo accounts...');
    await client.query(`
      UPDATE users
      SET bio = COALESCE(bio, 'Experienced real estate property owner committed to quality housing and responsive tenant care in Greater Noida and NCR.'),
          city = COALESCE(city, 'Greater Noida'),
          state = COALESCE(state, 'Uttar Pradesh'),
          address = COALESCE(address, 'Sector 22D, Yamuna Expressway')
      WHERE email = 'owner@rentora.dev';

      UPDATE users
      SET bio = COALESCE(bio, 'Software engineer and prospective long-term tenant looking for peaceful homes with good transit connectivity.'),
          city = COALESCE(city, 'Noida'),
          state = COALESCE(state, 'Uttar Pradesh'),
          address = COALESCE(address, 'Sector 62, Noida')
      WHERE email = 'tenant@rentora.dev' OR email = 'manishgangwar373@gmail.com';

      UPDATE users
      SET bio = COALESCE(bio, 'Rentora platform administrator managing listings, verification compliance, and user moderation.'),
          city = COALESCE(city, 'New Delhi'),
          state = COALESCE(state, 'Delhi')
      WHERE email = 'admin@rentora.dev';
    `);

    // 5. Ensure existing properties are marked verified and published
    console.log('5. Ensuring existing demo properties have verified status...');
    await client.query(`
      UPDATE properties
      SET verification_status = 'verified',
          status = 'published',
          verified_at = CURRENT_TIMESTAMP
      WHERE status IN ('published', 'pending') OR verification_status IS NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ PHASE 5 MIGRATION COMPLETED SUCCESSFULLY!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

migratePhase5();
