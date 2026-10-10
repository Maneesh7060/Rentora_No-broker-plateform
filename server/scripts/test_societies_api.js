const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../config/db');
const { findNearbySocieties, findSocietyById, listSocieties } = require('../models/societyModel');
const { getPublishedProperties } = require('../models/propertyModel');

async function testSocietiesAPI() {
  console.log('========================================');
  console.log('🧪 TESTING NEARBY SOCIETIES BACKEND API');
  console.log('========================================\n');

  try {
    // Gaur Yamuna City Coordinates: (28.3096, 77.5575)
    const lat = 28.3096;
    const lng = 77.5575;

    console.log(`Searching around Gaur Yamuna City (Lat: ${lat}, Lng: ${lng})...\n`);

    // 1. Radius = 5 km
    console.log('--- TEST 1: Radius = 5 km ---');
    const res5 = await findNearbySocieties({ latitude: lat, longitude: lng, radius: 5 });
    console.log(`Societies within 5 km: ${res5.total}`);
    console.log('Counts by radius:', res5.counts_by_radius);
    res5.societies.forEach((s) => {
      console.log(`  - [ID ${s.id}] ${s.name} (${s.locality}) | Distance: ${s.distance_km} km | Properties: ${s.property_count}`);
    });
    if (res5.total === 0) throw new Error('Expected societies within 5 km of Gaur Yamuna City');
    if (res5.societies[0].distance_km > 5) throw new Error('Returned society outside 5 km radius');

    // 2. Radius = 10 km
    console.log('\n--- TEST 2: Radius = 10 km ---');
    const res10 = await findNearbySocieties({ latitude: lat, longitude: lng, radius: 10 });
    console.log(`Societies within 10 km: ${res10.total}`);
    if (res10.total < res5.total) throw new Error('10km radius should have >= 5km count');

    // 3. Radius = 15 km
    console.log('\n--- TEST 3: Radius = 15 km ---');
    const res15 = await findNearbySocieties({ latitude: lat, longitude: lng, radius: 15 });
    console.log(`Societies within 15 km: ${res15.total}`);
    if (res15.total < res10.total) throw new Error('15km radius should have >= 10km count');

    // 4. Test Single Society Details + Properties
    console.log('\n--- TEST 4: Single Society Details ---');
    const gycSoc = res5.societies.find((s) => s.name === 'Gaur Yamuna City');
    if (!gycSoc) throw new Error('Gaur Yamuna City society not found in 5km results');
    const details = await findSocietyById(gycSoc.id);
    console.log(`Society "${details.name}" has ${details.properties?.length || 0} published properties linked.`);
    if (!details.properties || details.properties.length === 0) {
      console.warn('Warning: No properties linked to Gaur Yamuna City yet.');
    }

    // 5. Test Property Search filtering by society_id
    console.log('\n--- TEST 5: Property Search by society_id ---');
    const propRes = await getPublishedProperties({ society_id: gycSoc.id });
    console.log(`getPublishedProperties({ society_id: ${gycSoc.id} }) returned ${propRes.total} properties.`);
    propRes.properties.forEach((p) => {
      console.log(`  - [ID ${p.id}] ${p.title} | Rent: ₹${p.rent_amount} | Society: ${p.society_name}`);
    });
    if (propRes.total === 0) throw new Error('Expected properties for Gaur Yamuna City society');

    console.log('\n🎉 ALL NEARBY SOCIETIES BACKEND TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Society Test Error:', err);
    process.exit(1);
  }
}

testSocietiesAPI();
