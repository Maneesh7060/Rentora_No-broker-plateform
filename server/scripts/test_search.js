const { getPublishedProperties } = require('../models/propertyModel');

async function testSearches() {
  console.log('Testing Property Search Engine...');

  // Test 1: Locality search for Gaur Yamuna City
  let res = await getPublishedProperties({ search: 'Gaur Yamuna City' });
  console.log('1. Search "Gaur Yamuna City" -> found:', res.total);
  res.properties.forEach(p => console.log(`   - [ID: ${p.id}] ${p.title} | ${p.furnishing} | ₹${p.rent_amount}`));

  // Test 2: 2 BHK + Fully Furnished + Gaur Yamuna City
  res = await getPublishedProperties({
    search: 'Gaur Yamuna City',
    bedrooms: 2,
    furnishing: 'fully_furnished'
  });
  console.log('2. Search 2 BHK + Fully Furnished + "Gaur Yamuna City" -> found:', res.total);
  res.properties.forEach(p => console.log(`   - [ID: ${p.id}] ${p.title} | ${p.furnishing} | ₹${p.rent_amount}`));

  // Test 3: City search Greater Noida
  res = await getPublishedProperties({ city: 'Greater Noida', bedrooms: 2 });
  console.log('3. Search 2 BHK in Greater Noida -> found:', res.total);

  // Test 4: Geo radius search around Gaur Yamuna City (28.3096, 77.5575)
  res = await getPublishedProperties({
    latitude: 28.3096,
    longitude: 77.5575,
    radius: 10,
    sort: 'distance'
  });
  console.log('4. Geo search (10km radius) -> found:', res.total);
  res.properties.forEach(p => console.log(`   - [ID: ${p.id}] ${p.title} | distance: ${p.distance_km} km`));

  process.exit(0);
}

testSearches();
