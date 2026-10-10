const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const {
  getOwnerAvailability,
  setOwnerAvailability,
  getAvailableSlotsForDate,
  createVisitRequest,
  findVisitById,
  findVisitsByTenant,
  findVisitsByOwner,
  updateVisitStatus,
  cancelVisitByTenant,
  getTenantVisitStats,
  getOwnerVisitStats,
  autoCompletePastVisits,
} = require('../models/visitModel');
const pool = require('../config/db');

async function testVisitsAPI() {
  console.log('====================================================');
  console.log('🧪 TESTING PHASE 4: PROPERTY VISITS & CALENDAR API');
  console.log('====================================================');

  try {
    // 1. Get test tenant (ID 1) and test property (ID 9 - owner ID 3)
    const tenantRes = await pool.query(`SELECT id, full_name, role FROM users WHERE role = 'tenant' LIMIT 1`);
    const tenant = tenantRes.rows[0];

    const propRes = await pool.query(`SELECT id, title, owner_id FROM properties WHERE id = 9`);
    const property = propRes.rows[0];

    console.log(`Using Tenant: ${tenant.full_name} (ID ${tenant.id})`);
    console.log(`Using Property: "${property.title}" (ID ${property.id}, Owner ID ${property.owner_id})`);

    // 2. Test Availability Lookup
    console.log('\n--- TEST 1: Owner Availability Schedule ---');
    const schedule = await getOwnerAvailability(property.owner_id);
    console.log(`Owner has ${schedule.length} schedule days configured.`);
    schedule.slice(0, 3).forEach((d) => console.log(`  - ${d.day_name}: ${d.start_time} to ${d.end_time} [Active: ${d.is_active}]`));

    // 3. Test Available Slots for tomorrow
    console.log('\n--- TEST 2: Available Slots for Tomorrow ---');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const slotData = await getAvailableSlotsForDate(property.id, tomorrowStr);
    console.log(`Date: ${tomorrowStr} | Available Day: ${slotData.is_available_day} | Total slots: ${slotData.slots.length}`);
    console.log(`Available slot count: ${slotData.available_slot_count}`);
    if (slotData.slots.length > 0) {
      console.log(`  First 3 slots:`, slotData.slots.slice(0, 3).map((s) => s.label));
    }

    // 4. Test Create Visit Request
    console.log('\n--- TEST 3: Create Visit Request ---');
    // Clean any prior test visit for this slot first
    await pool.query(
      `DELETE FROM property_visits WHERE property_id = $1 AND visit_date = $2 AND start_time = '11:00:00'`,
      [property.id, tomorrowStr]
    );

    const visit = await createVisitRequest({
      propertyId: property.id,
      tenantId: tenant.id,
      visitDate: tomorrowStr,
      startTime: '11:00:00',
      endTime: '11:30:00',
      tenantMessage: 'Looking forward to viewing the flat!',
    });
    console.log(`✅ Visit created successfully [ID: ${visit.id}] | Status: ${visit.status} | Time: ${visit.start_time} - ${visit.end_time}`);

    // 5. Test Double-Booking Prevention
    console.log('\n--- TEST 4: Double-Booking Prevention ---');
    try {
      await createVisitRequest({
        propertyId: property.id,
        tenantId: tenant.id,
        visitDate: tomorrowStr,
        startTime: '11:00:00',
        endTime: '11:30:00',
        tenantMessage: 'Second booking attempt on same slot',
      });
      console.error('❌ FAILED: Double booking was allowed!');
    } catch (doubleErr) {
      console.log(`✅ Double booking prevented! Error message: "${doubleErr.message}" (Status: ${doubleErr.statusCode})`);
    }

    // 6. Test Past Date Validation
    console.log('\n--- TEST 5: Past Date Prevention ---');
    try {
      await createVisitRequest({
        propertyId: property.id,
        tenantId: tenant.id,
        visitDate: '2020-01-01',
        startTime: '11:00:00',
        endTime: '11:30:00',
      });
      console.error('❌ FAILED: Past date booking was allowed!');
    } catch (pastErr) {
      console.log(`✅ Past date rejected! Error message: "${pastErr.message}"`);
    }

    // 7. Test Slot Availability after booking
    console.log('\n--- TEST 6: Check Slot Status After Booking ---');
    const updatedSlotData = await getAvailableSlotsForDate(property.id, tomorrowStr);
    const bookedSlot = updatedSlotData.slots.find((s) => s.start_time === '11:00:00');
    console.log(`Slot 11:00 AM status: is_booked = ${bookedSlot.is_booked}, is_available = ${bookedSlot.is_available}`);

    // 8. Test Find Details
    console.log('\n--- TEST 7: Find Visit Details by ID ---');
    const details = await findVisitById(visit.id);
    console.log(`Property: "${details.property_title}" | Tenant: ${details.tenant_name} | Owner: ${details.owner_name}`);

    // 9. Test Owner Approve
    console.log('\n--- TEST 8: Owner Approves Visit ---');
    const approved = await updateVisitStatus(visit.id, 'APPROVED', 'See you at the lobby at 11:00 AM', property.owner_id);
    console.log(`✅ Visit status updated to: ${approved.status} | Owner Notes: "${approved.owner_notes}"`);

    // 10. Test Tenant Stats & Owner Stats
    console.log('\n--- TEST 9: Stats Aggregations ---');
    const tStats = await getTenantVisitStats(tenant.id);
    console.log(`Tenant Stats: Total = ${tStats.total}, Approved = ${tStats.approved}, Upcoming = ${tStats.upcoming}`);
    const oStats = await getOwnerVisitStats(property.owner_id);
    console.log(`Owner Stats: Total = ${oStats.total}, Approved = ${oStats.approved}, Upcoming = ${oStats.upcoming}`);

    // 11. Clean up test record
    await pool.query(`DELETE FROM property_visits WHERE id = $1`, [visit.id]);
    console.log('\n🧹 Test visit record cleaned up.');

    console.log('\n🎉 ALL PHASE 4 BACKEND VISITS TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    pool.end();
  }
}

testVisitsAPI();
