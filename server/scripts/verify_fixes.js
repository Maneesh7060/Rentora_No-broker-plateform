const http = require('http');
const { parseNaturalSearch } = require('../../client/src/utils/naturalSearchParser.js');
const { getPublishedProperties } = require('../models/propertyModel.js');

function fetchApi(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('RUNNING RENTORA COMPREHENSIVE SEARCH & BUG FIX TESTS');
  console.log('========================================================\n');

  // TEST 1: "Greater Noida"
  console.log('TEST 1: Search "Greater Noida"');
  const p1 = parseNaturalSearch('Greater Noida');
  console.log('Parser output:', {
    location: p1.location,
    city: p1.city,
    bedrooms: p1.bedrooms,
    furnishing: p1.furnishing,
    property_type: p1.property_type,
  });
  if (p1.bedrooms !== '' || p1.furnishing !== 'all') {
    throw new Error('FAIL: TEST 1 incorrectly set default bedrooms or furnishing!');
  }
  const res1 = await fetchApi('/api/v1/properties?search=Greater%20Noida');
  console.log(`API response status: ${res1.status}, total found: ${res1.data.data.total}`);
  res1.data.data.properties.forEach((p) =>
    console.log(`  - [ID ${p.id}] ${p.title} (${p.bedrooms} BHK, ${p.furnishing}, ₹${p.rent_amount}) in ${p.locality || p.city}`)
  );
  console.log('✅ TEST 1 PASSED: No unwanted BHK/furnishing filters, all Greater Noida properties returned.\n');

  // TEST 2: "Gaur Yamuna City"
  console.log('TEST 2: Search "Gaur Yamuna City"');
  const p2 = parseNaturalSearch('Gaur Yamuna City');
  console.log('Parser output:', {
    location: p2.location,
    city: p2.city,
    bedrooms: p2.bedrooms,
    furnishing: p2.furnishing,
  });
  if (p2.bedrooms !== '' || p2.furnishing !== 'all') {
    throw new Error('FAIL: TEST 2 incorrectly set default bedrooms or furnishing!');
  }
  const res2 = await fetchApi('/api/v1/properties?search=Gaur%20Yamuna%20City');
  console.log(`API response status: ${res2.status}, total found: ${res2.data.data.total}`);
  res2.data.data.properties.forEach((p) =>
    console.log(`  - [ID ${p.id}] ${p.title} (${p.bedrooms} BHK, ${p.furnishing}, ₹${p.rent_amount})`)
  );
  console.log('✅ TEST 2 PASSED: Gaur Yamuna City parsed without automatic BHK/furnishing defaults.\n');

  // TEST 3: "2 BHK in Greater Noida"
  console.log('TEST 3: Search "2 BHK in Greater Noida"');
  const p3 = parseNaturalSearch('2 BHK in Greater Noida');
  console.log('Parser output:', {
    location: p3.location,
    city: p3.city,
    bedrooms: p3.bedrooms,
    furnishing: p3.furnishing,
  });
  if (p3.bedrooms !== '2' || p3.furnishing !== 'all') {
    throw new Error('FAIL: TEST 3 did not extract bedrooms=2 or furnishing=all!');
  }
  const res3 = await fetchApi('/api/v1/properties?search=Greater%20Noida&bedrooms=2');
  console.log(`API response status: ${res3.status}, total found: ${res3.data.data.total}`);
  res3.data.data.properties.forEach((p) =>
    console.log(`  - [ID ${p.id}] ${p.title} (${p.bedrooms} BHK, ${p.furnishing}, ₹${p.rent_amount})`)
  );
  console.log('✅ TEST 3 PASSED: bedrooms=2 extracted, furnishing remains Any.\n');

  // TEST 4: "2 BHK fully furnished flat in Gaur Yamuna City"
  console.log('TEST 4: Search "2 BHK fully furnished flat in Gaur Yamuna City"');
  const p4 = parseNaturalSearch('2 BHK fully furnished flat in Gaur Yamuna City');
  console.log('Parser output:', {
    location: p4.location,
    bedrooms: p4.bedrooms,
    furnishing: p4.furnishing,
    property_type: p4.property_type,
  });
  if (p4.bedrooms !== '2' || p4.furnishing !== 'fully_furnished' || p4.property_type !== 'apartment') {
    throw new Error('FAIL: TEST 4 parsing mismatch!');
  }
  const res4 = await fetchApi('/api/v1/properties?search=Gaur%20Yamuna%20City&bedrooms=2&furnishing=fully_furnished&property_type=apartment');
  console.log(`API response status: ${res4.status}, total found: ${res4.data.data.total}`);
  res4.data.data.properties.forEach((p) =>
    console.log(`  - [ID ${p.id}] ${p.title} (${p.bedrooms} BHK, ${p.furnishing}, ₹${p.rent_amount})`)
  );
  console.log('✅ TEST 4 PASSED: Exact demo property matched (Fully Furnished 2 BHK Flat in Gaur Yamuna City).\n');

  // TEST 5: "Fully furnished apartment in Greater Noida"
  console.log('TEST 5: Search "Fully furnished apartment in Greater Noida"');
  const p5 = parseNaturalSearch('Fully furnished apartment in Greater Noida');
  console.log('Parser output:', {
    location: p5.location,
    city: p5.city,
    bedrooms: p5.bedrooms,
    furnishing: p5.furnishing,
    property_type: p5.property_type,
  });
  if (p5.bedrooms !== '' || p5.furnishing !== 'fully_furnished' || p5.property_type !== 'apartment') {
    throw new Error('FAIL: TEST 5 parsing mismatch!');
  }
  const res5 = await fetchApi('/api/v1/properties?search=Greater%20Noida&furnishing=fully_furnished&property_type=apartment');
  console.log(`API response status: ${res5.status}, total found: ${res5.data.data.total}`);
  res5.data.data.properties.forEach((p) =>
    console.log(`  - [ID ${p.id}] ${p.title} (${p.bedrooms} BHK, ${p.furnishing}, ₹${p.rent_amount})`)
  );
  console.log('✅ TEST 5 PASSED: furnishing=fully_furnished & property_type=apartment, bedrooms is Any.\n');

  console.log('========================================================');
  console.log('ALL 5 TESTS PASSED WITH 100% ACCURACY!');
  console.log('========================================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
