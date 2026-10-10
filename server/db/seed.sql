-- ============================================================
-- Rentora Seed Data (DEVELOPMENT ONLY)
-- Phase 1 & 2: Sample users and properties
-- Passwords are bcrypt hashed for "Password@123"
-- ============================================================

-- 1. Insert seed users (safely skip if email already exists)
INSERT INTO users (full_name, email, password_hash, phone, role, is_verified)
VALUES
  (
    'Raj Kumar',
    'tenant@rentora.dev',
    '$2a$10$BEnFGkUmWC5u.aA2cErAUObXOhUPBxwwkURBOI//NFRONj3RAIdRa',
    '+91 9876543210',
    'tenant',
    TRUE
  ),
  (
    'Priya Sharma',
    'owner@rentora.dev',
    '$2a$10$BEnFGkUmWC5u.aA2cErAUObXOhUPBxwwkURBOI//NFRONj3RAIdRa',
    '+91 9876543211',
    'owner',
    TRUE
  ),
  (
    'Amit Patel',
    'agent@rentora.dev',
    '$2a$10$BEnFGkUmWC5u.aA2cErAUObXOhUPBxwwkURBOI//NFRONj3RAIdRa',
    '+91 9876543212',
    'agent',
    TRUE
  ),
  (
    'Rahul Singh',
    'maintenance@rentora.dev',
    '$2a$10$BEnFGkUmWC5u.aA2cErAUObXOhUPBxwwkURBOI//NFRONj3RAIdRa',
    '+91 9876543213',
    'maintenance',
    TRUE
  ),
  (
    'Admin User',
    'admin@rentora.dev',
    '$2a$10$BEnFGkUmWC5u.aA2cErAUObXOhUPBxwwkURBOI//NFRONj3RAIdRa',
    '+91 9876543214',
    'admin',
    TRUE
  )
ON CONFLICT (email) DO NOTHING;

-- 2. Insert sample properties for owner@rentora.dev
DO $$
DECLARE
  owner_record_id INTEGER;
BEGIN
  SELECT id INTO owner_record_id FROM users WHERE email = 'owner@rentora.dev' LIMIT 1;

  IF owner_record_id IS NOT NULL THEN
    -- Clear seed properties for this owner if resetting
    DELETE FROM properties WHERE owner_id = owner_record_id;

    INSERT INTO properties (
      owner_id, title, description, property_type, furnishing,
      rent_amount, deposit_amount, bedrooms, bathrooms, area_sqft,
      address_line, locality, city, state, zip_code, latitude, longitude,
      amenities, images, status
    ) VALUES
    -- 1. GAUR YAMUNA CITY - 2 BHK FULLY FURNISHED
    (
      owner_record_id,
      'Fully Furnished 2 BHK Flat in Gaur Yamuna City',
      'Modern, bright and spacious 2 BHK fully furnished apartment in Gaur Yamuna City on Yamuna Expressway. Features custom modular kitchen with chimney, ACs in all bedrooms, LED TV with console, plush sofa set, 6-seater dining table, double beds with orthopaedic mattresses, and a large sunlit balcony facing the landscaped green gardens. Enjoy 24/7 security, power backup, high-speed fiber internet, and clubhouse with pool and gym.',
      'apartment',
      'fully_furnished',
      28000.00,
      56000.00,
      2,
      2,
      1050,
      'Tower 6, Flat 704, Gaur Yamuna City, Sector 19, Yamuna Expressway',
      'Gaur Yamuna City',
      'Greater Noida',
      'Uttar Pradesh',
      '203201',
      28.3096,
      77.5575,
      '["High Speed WiFi", "Air Conditioning", "Covered Parking", "Swimming Pool", "Gym / Fitness Centre", "Gated Security", "Power Backup", "Balcony", "Clubhouse", "Elevator", "Washing Machine", "Refrigerator", "24/7 Water Supply"]'::jsonb,
      '[
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
      ]'::jsonb,
      'published'
    ),
    -- 2. GAUR YAMUNA CITY - 2 BHK SEMI FURNISHED
    (
      owner_record_id,
      'Semi Furnished 2 BHK Apartment in Gaur Yamuna City',
      'Spacious semi-furnished 2 BHK apartment with woodwork, modular kitchen, electrical fittings, modern bathroom fixtures, and dedicated basement parking. Located near the central park with easy connectivity to the Yamuna Expressway and upcoming airport.',
      'apartment',
      'semi_furnished',
      24000.00,
      48000.00,
      2,
      2,
      980,
      'Tower 2, Flat 402, Gaur Yamuna City, Yamuna Expressway',
      'Gaur Yamuna City',
      'Greater Noida',
      'Uttar Pradesh',
      '203201',
      28.3105,
      77.5580,
      '["Modular Kitchen", "Covered Parking", "Gated Security", "Power Backup", "Elevator", "Balcony", "24/7 Water Supply", "Park View"]'::jsonb,
      '[
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
      ]'::jsonb,
      'published'
    ),
    -- 3. GAUR YAMUNA CITY - 3 BHK FULLY FURNISHED
    (
      owner_record_id,
      'Fully Furnished 3 BHK Luxury Flat in Gaur Yamuna City',
      'Premium top-floor 3 BHK apartment with designer interiors, complete furniture, smart TV, high-capacity inverter backup, 3 balconies with unobstructed views, and access to all Olympic-size sports amenities and club.',
      'apartment',
      'fully_furnished',
      35000.00,
      70000.00,
      3,
      3,
      1450,
      'Tower 11, Flat 1201, Gaur Yamuna City, Yamuna Expressway',
      'Gaur Yamuna City',
      'Greater Noida',
      'Uttar Pradesh',
      '203201',
      28.3088,
      77.5568,
      '["High Speed WiFi", "Air Conditioning", "Covered Parking", "Swimming Pool", "Gym / Fitness Centre", "Clubhouse", "Gated Security", "Power Backup", "Washing Machine", "Balcony"]'::jsonb,
      '[
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
      ]'::jsonb,
      'published'
    ),
    -- 4. GURGAON - 3 BHK FULLY FURNISHED
    (
      owner_record_id,
      'Luxury 3BHK Skyline Residency with Balcony View',
      'Modern high-rise apartment located in the prime residential hub. Features Italian marble flooring, floor-to-ceiling windows, spacious modular kitchen, dedicated basement car parking, and 24/7 power backup with club house access.',
      'apartment',
      'fully_furnished',
      45000.00,
      90000.00,
      3,
      3,
      1850,
      'Tower B, Flat 1402, Golf Course Ext Road',
      'Golf Course Extension',
      'Gurgaon',
      'Haryana',
      '122018',
      28.4595,
      77.0266,
      '["Gated Security", "Covered Parking", "Gym / Fitness Centre", "Swimming Pool", "High Speed WiFi", "Air Conditioning", "Power Backup", "Clubhouse", "Balcony"]'::jsonb,
      '[
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
      ]'::jsonb,
      'published'
    ),
    -- 5. BANGALORE - 1 BHK STUDIO FULLY FURNISHED
    (
      owner_record_id,
      'Contemporary Studio Loft near Metro Station',
      'Chic and compact fully furnished studio apartment ideal for tech professionals. Walking distance to the metro station, supermarkets, and cafes. Equipped with high-speed fiber internet and workstation.',
      'studio',
      'fully_furnished',
      22000.00,
      44000.00,
      1,
      1,
      650,
      'Flat 304, Green Glen Layout, Bellandur',
      'Bellandur',
      'Bangalore',
      'Karnataka',
      '560103',
      12.9279,
      77.6771,
      '["High Speed WiFi", "Air Conditioning", "Elevator", "Power Backup", "Washing Machine", "Gated Security"]'::jsonb,
      '[
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
      ]'::jsonb,
      'published'
    ),
    -- 6. BANGALORE - 4 BHK VILLA SEMI FURNISHED
    (
      owner_record_id,
      'Spacious 4BHK Mediterranean Style Villa with Private Garden',
      'Magnificent independent luxury villa featuring private landscaped garden, home theatre room, separate servant quarters, 2-car covered porch, and solar water heating. Peaceful gated community with 24/7 security patrol.',
      'villa',
      'semi_furnished',
      120000.00,
      300000.00,
      4,
      5,
      4200,
      'Villa 18, Palm Meadows, Whitefield',
      'Whitefield',
      'Bangalore',
      'Karnataka',
      '560066',
      12.9698,
      77.7499,
      '["Private Garden", "Covered Parking", "Swimming Pool", "Gym / Fitness Centre", "Pet Friendly", "Gated Security", "EV Charging Station"]'::jsonb,
      '[
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
      ]'::jsonb,
      'published'
    ),
    -- 7. SOUTH DELHI - 2 BHK SEMI FURNISHED
    (
      owner_record_id,
      'Cozy 2BHK Garden View Apartment in South Delhi',
      'Bright and airy 2BHK apartment facing community park. Recently renovated bathrooms, modular wood kitchen, quiet neighborhood, near Saket City Centre and premier schools.',
      'apartment',
      'semi_furnished',
      35000.00,
      70000.00,
      2,
      2,
      1250,
      'B-42, Second Floor, Saket',
      'Saket',
      'Delhi',
      'Delhi',
      '110017',
      28.5244,
      77.2155,
      '["Modular Kitchen", "Air Conditioning", "Balcony", "24/7 Water Supply", "Covered Parking", "Gated Security"]'::jsonb,
      '[
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
      ]'::jsonb,
      'published'
    ),
    -- 8. NAVI MUMBAI - 3 BHK HOUSE UNFURNISHED
    (
      owner_record_id,
      'Modern 2-Story Independent House with Rooftop Terrace',
      'Independent 3-bedroom house in a serene residential sector. Features open roof terrace, front garden, study room, separate dining area, and dedicated water reservoir.',
      'house',
      'unfurnished',
      55000.00,
      110000.00,
      3,
      3,
      2400,
      'House No. 412, Sector 15, Vashi',
      'Vashi',
      'Navi Mumbai',
      'Maharashtra',
      '400703',
      19.0771,
      72.9986,
      '["Private Garden", "Covered Parking", "Gated Security", "Pet Friendly", "Balcony / Terrace"]'::jsonb,
      '[
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80"
      ]'::jsonb,
      'published'
    );
  END IF;
END $$;
