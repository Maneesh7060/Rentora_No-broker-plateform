const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../config/db');

async function migrateSocieties() {
  console.log('--- Starting Societies Migration & Seeding ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create societies table
    console.log('Creating societies table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS societies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        locality VARCHAR(150),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes for societies
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_societies_lat_lng ON societies(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_societies_city ON societies(city);
      CREATE INDEX IF NOT EXISTS idx_societies_locality ON societies(locality);
      CREATE INDEX IF NOT EXISTS idx_societies_name ON societies(name);
    `);

    // Trigger for societies updated_at
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'societies_updated_at'
        ) THEN
          CREATE TRIGGER societies_updated_at
            BEFORE UPDATE ON societies
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);

    // 2. Add society_id to properties table (nullable for backward compatibility)
    console.log('Adding society_id to properties table...');
    await client.query(`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id) ON DELETE SET NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_society_id ON properties(society_id);
    `);

    // 3. Seed Verified Societies
    console.log('Seeding verified society data...');
    const seedSocieties = [
      // --- Greater Noida / Yamuna Expressway (Gaur Yamuna City Hub) ---
      {
        name: 'Gaur Yamuna City',
        locality: 'Yamuna Expressway',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        latitude: 28.3096,
        longitude: 77.5575,
        description: '250-acre integrated mega township with world-class residential towers, lake park, and schools.',
      },
      {
        name: '6th Parkview (Gaur Yamuna City)',
        locality: 'Gaur Yamuna City',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        latitude: 28.3120,
        longitude: 77.5595,
        description: 'Premium multistory apartment complex overlooking 9-acre Yamuna Lake Park.',
      },
      {
        name: '16th Parkview (Gaur Yamuna City)',
        locality: 'Gaur Yamuna City',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        latitude: 28.3075,
        longitude: 77.5550,
        description: 'Spacious 2 BHK and 3 BHK residential tower sector inside Gaur Yamuna City.',
      },
      {
        name: '32nd Parkview (Gaur Yamuna City)',
        locality: 'Gaur Yamuna City',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        latitude: 28.3140,
        longitude: 77.5610,
        description: 'Luxury low-rise and high-rise villa and apartment sector.',
      },
      {
        name: 'Supertech Upcountry',
        locality: 'Sector 17A, Yamuna Expressway',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        latitude: 28.3320,
        longitude: 77.5490,
        description: 'Expansive 100-acre themed residential township near Formula 1 track.',
      },
      {
        name: 'Jaypee Greens Sports City',
        locality: 'Sector 25, Yamuna Expressway',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        latitude: 28.3480,
        longitude: 77.5410,
        description: 'India’s premier sports-centric township next to Buddh International Circuit.',
      },
      {
        name: 'Purvanchal Royal City',
        locality: 'Chi 5',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        latitude: 28.4410,
        longitude: 77.5320,
        description: 'Luxury high-rise residential complex located near Noida-Greater Noida Expressway.',
      },
      {
        name: 'ATS Dolce',
        locality: 'Zeta 1',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        latitude: 28.4820,
        longitude: 77.5180,
        description: 'Architectural residential haven in Zeta 1 with lush green landscaped central park.',
      },
      {
        name: 'Jaypee Greens Wishtown',
        locality: 'Sector 128',
        city: 'Noida',
        state: 'Uttar Pradesh',
        latitude: 28.5200,
        longitude: 77.3700,
        description: 'Massive golf township on Noida Expressway with international standard amenities.',
      },
      // --- Gurgaon ---
      {
        name: 'Skyline Residency',
        locality: 'Golf Course Extension',
        city: 'Gurgaon',
        state: 'Haryana',
        latitude: 28.4595,
        longitude: 77.0266,
        description: 'Ultra-luxury high rise with panoramic Aravalli skyline views.',
      },
      // --- Bangalore ---
      {
        name: 'Prestige Tech Vista',
        locality: 'Bellandur',
        city: 'Bangalore',
        state: 'Karnataka',
        latitude: 12.9279,
        longitude: 77.6771,
        description: 'Premium tech corridor residential enclave close to outer ring road IT parks.',
      },
      {
        name: 'Palm Meadows Villa Community',
        locality: 'Whitefield',
        city: 'Bangalore',
        state: 'Karnataka',
        latitude: 12.9698,
        longitude: 77.7499,
        description: 'Exclusive Mediterranean style gated villa community.',
      },
      // --- Delhi ---
      {
        name: 'DDA Saket Residential Complex',
        locality: 'Saket',
        city: 'Delhi',
        state: 'Delhi',
        latitude: 28.5244,
        longitude: 77.2155,
        description: 'Well-connected south Delhi green residential society near Select Citywalk.',
      },
      // --- Navi Mumbai ---
      {
        name: 'Palm Beach Enclave',
        locality: 'Vashi',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        latitude: 19.0771,
        longitude: 72.9986,
        description: 'Serene coastal society in prime Vashi sector with sea views.',
      },
    ];

    for (const soc of seedSocieties) {
      const existing = await client.query(
        'SELECT id FROM societies WHERE name = $1 AND city = $2',
        [soc.name, soc.city]
      );
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO societies (name, locality, city, state, latitude, longitude, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [soc.name, soc.locality, soc.city, soc.state, soc.latitude, soc.longitude, soc.description]
        );
      }
    }

    // 4. Link existing properties to societies
    console.log('Linking existing properties to societies...');
    const gycMain = await client.query("SELECT id FROM societies WHERE name = 'Gaur Yamuna City' LIMIT 1");
    if (gycMain.rows[0]) {
      const gycId = gycMain.rows[0].id;
      await client.query(
        "UPDATE properties SET society_id = $1 WHERE locality ILIKE '%Gaur Yamuna City%' OR title ILIKE '%Gaur Yamuna City%'",
        [gycId]
      );
    }

    const skylineSoc = await client.query("SELECT id FROM societies WHERE name = 'Skyline Residency' LIMIT 1");
    if (skylineSoc.rows[0]) {
      await client.query(
        "UPDATE properties SET society_id = $1 WHERE title ILIKE '%Skyline Residency%'",
        [skylineSoc.rows[0].id]
      );
    }

    const techVista = await client.query("SELECT id FROM societies WHERE name = 'Prestige Tech Vista' LIMIT 1");
    if (techVista.rows[0]) {
      await client.query(
        "UPDATE properties SET society_id = $1 WHERE locality ILIKE '%Bellandur%'",
        [techVista.rows[0].id]
      );
    }

    const palmMeadows = await client.query("SELECT id FROM societies WHERE name = 'Palm Meadows Villa Community' LIMIT 1");
    if (palmMeadows.rows[0]) {
      await client.query(
        "UPDATE properties SET society_id = $1 WHERE locality ILIKE '%Whitefield%'",
        [palmMeadows.rows[0].id]
      );
    }

    const ddaSaket = await client.query("SELECT id FROM societies WHERE name = 'DDA Saket Residential Complex' LIMIT 1");
    if (ddaSaket.rows[0]) {
      await client.query(
        "UPDATE properties SET society_id = $1 WHERE locality ILIKE '%Saket%'",
        [ddaSaket.rows[0].id]
      );
    }

    const palmBeach = await client.query("SELECT id FROM societies WHERE name = 'Palm Beach Enclave' LIMIT 1");
    if (palmBeach.rows[0]) {
      await client.query(
        "UPDATE properties SET society_id = $1 WHERE locality ILIKE '%Vashi%'",
        [palmBeach.rows[0].id]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Societies migration and seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Societies migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrateSocieties();
