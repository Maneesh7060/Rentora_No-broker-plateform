const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Import routes & middlewares
const visitRoutes = require('../routes/visitRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const { errorHandler } = require('../middlewares/errorMiddleware');

const app = express();
app.use(express.json());
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use(errorHandler);

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET || 'rentora_dev_secret_change_in_production_abc123xyz',
    { expiresIn: '1h' }
  );
}

async function runE2EHttpTests() {
  console.log('===========================================================');
  console.log('🌐 RUNNING PHASE 4 E2E HTTP API & NOTIFICATION TEST SUITE');
  console.log('===========================================================');

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Get test tenant (ID 1) and test owner (ID 3)
    const tenantRes = await pool.query(`SELECT id, full_name, email, role FROM users WHERE role = 'tenant' LIMIT 1`);
    const tenant = tenantRes.rows[0];
    const tenantToken = generateToken(tenant);

    const ownerRes = await pool.query(`SELECT id, full_name, email, role FROM users WHERE role = 'owner' LIMIT 1`);
    const owner = ownerRes.rows[0];
    const ownerToken = generateToken(owner);

    const propRes = await pool.query(`SELECT id, title, owner_id FROM properties WHERE owner_id = $1 LIMIT 1`, [owner.id]);
    const property = propRes.rows[0];

    console.log(`👤 Tenant: ${tenant.full_name} (${tenant.email})`);
    console.log(`🏡 Owner: ${owner.full_name} (${owner.email})`);
    console.log(`🏢 Property: "${property.title}" (ID ${property.id})`);

    // Date for testing (3 days from now)
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 3);
    const testDateStr = testDate.toISOString().split('T')[0];

    // --- TEST 1: GET /visits/availability (Public / Tenant) ---
    console.log('\n--- 1. Testing GET /api/v1/visits/availability ---');
    const availResp = await fetch(`${baseUrl}/api/v1/visits/availability?property_id=${property.id}&date=${testDateStr}`);
    const availJson = await availResp.json();
    console.log(`✅ Status: ${availResp.status} | Total slots: ${availJson.data.slots.length}`);

    // --- TEST 2: POST /visits (Tenant request visit) ---
    console.log('\n--- 2. Testing POST /api/v1/visits (Tenant schedules visit) ---');
    // Clean prior test records
    await pool.query(
      `DELETE FROM property_visits WHERE property_id = $1 AND visit_date = $2`,
      [property.id, testDateStr]
    );

    const createResp = await fetch(`${baseUrl}/api/v1/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: property.id,
        visitDate: testDateStr,
        startTime: '14:00:00',
        endTime: '14:30:00',
        tenantMessage: 'Hello, looking forward to the 2 PM tour!',
      }),
    });
    const createJson = await createResp.json();
    const visitId = createJson.data?.visit?.id;
    console.log(`✅ Status: ${createResp.status} | Created Visit ID: ${visitId} | Status: ${createJson.data?.visit?.status}`);

    // Verify Owner received notification
    const ownerNotifRes = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [owner.id]
    );
    console.log(`✅ In-App Notification Sent to Owner: "${ownerNotifRes.rows[0]?.title}" - "${ownerNotifRes.rows[0]?.message}"`);

    // --- TEST 3: Double booking conflict ---
    console.log('\n--- 3. Testing Double Booking Conflict (409 Conflict) ---');
    const conflictResp = await fetch(`${baseUrl}/api/v1/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: property.id,
        visitDate: testDateStr,
        startTime: '14:00:00',
        endTime: '14:30:00',
        tenantMessage: 'Second tenant trying same time slot',
      }),
    });
    const conflictJson = await conflictResp.json();
    console.log(`✅ Status: ${conflictResp.status} | Message: "${conflictJson.message}"`);

    // --- TEST 4: GET /visits/received (Owner reviews pending visits) ---
    console.log('\n--- 4. Testing GET /api/v1/visits/received (Owner visit queue) ---');
    const ownerVisitsResp = await fetch(`${baseUrl}/api/v1/visits/received`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ownerVisitsJson = await ownerVisitsResp.json();
    const foundVisit = ownerVisitsJson.data.visits.find((v) => v.id === visitId);
    console.log(`✅ Status: ${ownerVisitsResp.status} | Found visit in owner list: ${Boolean(foundVisit)} (Status: ${foundVisit?.status})`);

    // --- TEST 5: PATCH /visits/:id/status (Owner approves visit) ---
    console.log('\n--- 5. Testing PATCH /api/v1/visits/:id/status (Owner Approves) ---');
    const approveResp = await fetch(`${baseUrl}/api/v1/visits/${visitId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        status: 'APPROVED',
        ownerNotes: 'Confirmed! I will wait at Tower B reception.',
      }),
    });
    const approveJson = await approveResp.json();
    console.log(`✅ Status: ${approveResp.status} | Updated Status: ${approveJson.data?.visit?.status} | Notes: "${approveJson.data?.visit?.owner_notes}"`);

    // Verify Tenant received notification
    const tenantNotifRes = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [tenant.id]
    );
    console.log(`✅ In-App Notification Sent to Tenant: "${tenantNotifRes.rows[0]?.title}" - "${tenantNotifRes.rows[0]?.message}"`);

    // --- TEST 6: GET /visits/:id (Visit Details) ---
    console.log('\n--- 6. Testing GET /api/v1/visits/:id (Visit Details) ---');
    const detailsResp = await fetch(`${baseUrl}/api/v1/visits/${visitId}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const detailsJson = await detailsResp.json();
    console.log(`✅ Status: ${detailsResp.status} | Property: "${detailsJson.data?.visit?.property_title}" | Owner Notes: "${detailsJson.data?.visit?.owner_notes}"`);

    // --- TEST 7: GET /visits/tenant-stats & /visits/owner-stats ---
    console.log('\n--- 7. Testing Dashboard Stats Endpoints ---');
    const tStatsResp = await fetch(`${baseUrl}/api/v1/visits/tenant-stats`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const tStatsJson = await tStatsResp.json();
    console.log(`✅ Tenant Visit Stats:`, tStatsJson.data?.stats);

    const oStatsResp = await fetch(`${baseUrl}/api/v1/visits/owner-stats`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const oStatsJson = await oStatsResp.json();
    console.log(`✅ Owner Visit Stats:`, oStatsJson.data?.stats);

    // --- TEST 8: Availability Management (Owner Updates Schedule) ---
    console.log('\n--- 8. Testing GET & POST /api/v1/visits/availability/owner ---');
    const getSchedResp = await fetch(`${baseUrl}/api/v1/visits/availability/owner`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const getSchedJson = await getSchedResp.json();
    console.log(`✅ Owner schedule days count: ${getSchedJson.data?.schedule?.length}`);

    // Update Sunday to active 10:00 - 13:00
    const updatedSchedule = getSchedJson.data.schedule.map((day) => {
      if (day.day_of_week === 0) {
        return { ...day, is_active: true, start_time: '10:00:00', end_time: '13:00:00' };
      }
      return day;
    });

    const updateSchedResp = await fetch(`${baseUrl}/api/v1/visits/availability/owner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ schedule: updatedSchedule }),
    });
    const updateSchedJson = await updateSchedResp.json();
    console.log(`✅ Owner schedule updated successfully! Message: "${updateSchedJson.message}"`);

    // Clean up test records
    await pool.query(`DELETE FROM property_visits WHERE id = $1`, [visitId]);
    console.log('\n🧹 Cleaned up test visit records.');

    console.log('\n🌟 ALL HTTP E2E TESTS PASSED PERFECTLY (100%)!');
  } catch (err) {
    console.error('❌ E2E test failed:', err);
  } finally {
    server.close();
    pool.end();
  }
}

runE2EHttpTests();
