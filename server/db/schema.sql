-- ============================================================
-- Rentora Database Schema
-- Phase 1 & 2: Users and Properties
-- ============================================================

-- Function to auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          VARCHAR(20) NOT NULL DEFAULT 'tenant'
                CHECK (role IN ('tenant', 'owner', 'agent', 'maintenance', 'admin')),
  avatar_url    VARCHAR(255),
  bio           TEXT,
  city          VARCHAR(100),
  state         VARCHAR(100),
  address       TEXT,
  account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                CHECK (account_status IN ('ACTIVE', 'SUSPENDED')),
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index for role-based filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Trigger for users updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at'
  ) THEN
    CREATE TRIGGER users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- 2. PROPERTIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id             SERIAL PRIMARY KEY,
  owner_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  property_type  VARCHAR(30) NOT NULL DEFAULT 'apartment'
                 CHECK (property_type IN ('apartment', 'house', 'villa', 'studio', 'commercial')),
  furnishing     VARCHAR(30) NOT NULL DEFAULT 'unfurnished'
                 CHECK (furnishing IN ('unfurnished', 'semi_furnished', 'fully_furnished')),
  rent_amount    NUMERIC(12, 2) NOT NULL CHECK (rent_amount >= 0),
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (deposit_amount >= 0),
  bedrooms       INTEGER NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
  bathrooms      INTEGER NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
  area_sqft      INTEGER CHECK (area_sqft >= 0),
  address_line   VARCHAR(255) NOT NULL,
  locality       VARCHAR(150),
  city           VARCHAR(100) NOT NULL,
  state          VARCHAR(100) NOT NULL,
  zip_code       VARCHAR(20) NOT NULL,
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  amenities      JSONB NOT NULL DEFAULT '[]'::jsonb,
  images              JSONB NOT NULL DEFAULT '[]'::jsonb,
  status              VARCHAR(30) NOT NULL DEFAULT 'published'
                      CHECK (status IN ('draft', 'pending_verification', 'pending', 'published', 'verified', 'active', 'rejected', 'rented', 'inactive')),
  verification_status VARCHAR(30) NOT NULL DEFAULT 'verified',
  rejection_reason    TEXT,
  verified_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & search
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_locality ON properties(locality);
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_furnishing ON properties(furnishing);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_rent ON properties(rent_amount);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_bathrooms ON properties(bathrooms);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- Trigger for properties updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'properties_updated_at'
  ) THEN
    CREATE TRIGGER properties_updated_at
      BEFORE UPDATE ON properties
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- 3. RENTAL APPLICATIONS TABLE (PHASE 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS rental_applications (
  id                SERIAL PRIMARY KEY,
  property_id       INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applicant_name    VARCHAR(100) NOT NULL,
  phone             VARCHAR(20) NOT NULL,
  email             VARCHAR(150) NOT NULL,
  monthly_income    NUMERIC(12, 2) NOT NULL CHECK (monthly_income >= 0),
  employment_status VARCHAR(50) NOT NULL DEFAULT 'employed',
  occupation        VARCHAR(100),
  occupants         INTEGER NOT NULL DEFAULT 1 CHECK (occupants >= 1),
  move_in_date      DATE NOT NULL,
  message           TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  owner_notes       TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rental_apps_property_id ON rental_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_apps_tenant_id ON rental_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_apps_owner_id ON rental_applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_rental_apps_status ON rental_applications(status);
CREATE INDEX IF NOT EXISTS idx_rental_apps_created_at ON rental_applications(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_app 
ON rental_applications(tenant_id, property_id) 
WHERE status = 'pending';

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

-- ============================================================
-- 4. WISHLISTS TABLE (PHASE 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_property_id ON wishlists(property_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_created_at ON wishlists(created_at DESC);

-- ============================================================
-- 5. NOTIFICATIONS TABLE (PHASE 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(50) NOT NULL DEFAULT 'application',
  link       VARCHAR(255),
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- 6. SOCIETIES TABLE (NEARBY SOCIETIES DISCOVERY)
-- ============================================================
CREATE TABLE IF NOT EXISTS societies (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  locality    VARCHAR(150),
  city        VARCHAR(100) NOT NULL,
  state       VARCHAR(100) NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  description TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_societies_lat_lng ON societies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_societies_city ON societies(city);
CREATE INDEX IF NOT EXISTS idx_societies_locality ON societies(locality);
CREATE INDEX IF NOT EXISTS idx_societies_name ON societies(name);

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

-- Link properties to societies
ALTER TABLE properties ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_properties_society_id ON properties(society_id);

-- ============================================================
-- 7. PROPERTY VISITS TABLE (PHASE 4)
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_property_visits_property_id ON property_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_tenant_id ON property_visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_owner_id ON property_visits(owner_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_visit_date ON property_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_property_visits_status ON property_visits(status);
CREATE INDEX IF NOT EXISTS idx_property_visits_created_at ON property_visits(created_at DESC);

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

-- ============================================================
-- 8. VISIT AVAILABILITY TABLE (PHASE 4)
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_visit_availability_owner_id ON visit_availability(owner_id);
CREATE INDEX IF NOT EXISTS idx_visit_availability_property_id ON visit_availability(property_id);
CREATE INDEX IF NOT EXISTS idx_visit_availability_day ON visit_availability(day_of_week);

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

-- ============================================================
-- 9. DOCUMENTS TABLE (PHASE 5)
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

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




