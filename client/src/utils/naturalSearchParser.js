/**
 * Natural Language Search Query Parser (Deterministic, rule-based, no AI/LLM)
 * Extracts bedrooms, furnishing, property_type, price limits, and location from query strings.
 */

const KNOWN_CITIES = [
  'greater noida',
  'noida',
  'delhi',
  'gurgaon',
  'gurugram',
  'bangalore',
  'bengaluru',
  'mumbai',
  'navi mumbai',
  'pune',
  'hyderabad',
  'chennai',
  'kolkata',
  'chandigarh',
  'jaipur',
  'ahmedabad',
  'lucknow',
];

const KNOWN_LOCALITIES = [
  { name: 'gaur yamuna city', city: 'Greater Noida' },
  { name: 'indirapuram', city: 'Ghaziabad' },
  { name: 'cyber city', city: 'Gurgaon' },
  { name: 'golf course road', city: 'Gurgaon' },
  { name: 'whitefield', city: 'Bangalore' },
  { name: 'indiranagar', city: 'Bangalore' },
  { name: 'koramangala', city: 'Bangalore' },
  { name: 'bandra', city: 'Mumbai' },
  { name: 'andheri', city: 'Mumbai' },
  { name: 'powai', city: 'Mumbai' },
  { name: 'saket', city: 'Delhi' },
  { name: 'hauz khas', city: 'Delhi' },
  { name: 'dwarka', city: 'Delhi' },
];

export function parseNaturalSearch(rawQuery = '') {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return {
      rawQuery: '',
      cleanSearchTerm: '',
      bedrooms: '',
      furnishing: 'all',
      property_type: 'all',
      minRent: '',
      maxRent: '',
      location: '',
      city: '',
      hasExtractedFilters: false,
    };
  }

  let text = rawQuery.trim().toLowerCase();
  let extractedBedrooms = '';
  let extractedFurnishing = 'all';
  let extractedPropertyType = 'all';
  let extractedMinRent = '';
  let extractedMaxRent = '';
  let extractedCity = '';

  // 1. Extract Bedrooms (strictly '1 bhk', '2bhk', '3 bedrooms', '2 bed', etc. — NEVER default to 2)
  const bhkMatch = text.match(/\b(\d+)\s*(?:bhk|rk|b\.h\.k|bedroom|bedrooms|beds|bed)\b/i);
  if (bhkMatch) {
    extractedBedrooms = String(parseInt(bhkMatch[1], 10));
    text = text.replace(bhkMatch[0], ' ');
  }

  // 2. Extract Furnishing (strictly explicit keywords — NEVER default to unfurnished)
  if (/\b(?:fully[\s-_]*furnished|full[\s-_]*furnished)\b/i.test(text)) {
    extractedFurnishing = 'fully_furnished';
    text = text.replace(/\b(?:fully[\s-_]*furnished|full[\s-_]*furnished)\b/gi, ' ');
  } else if (/\b(?:semi[\s-_]*furnished|half[\s-_]*furnished)\b/i.test(text)) {
    extractedFurnishing = 'semi_furnished';
    text = text.replace(/\b(?:semi[\s-_]*furnished|half[\s-_]*furnished)\b/gi, ' ');
  } else if (/\b(?:un[\s-_]*furnished|non[\s-_]*furnished|not[\s-_]*furnished)\b/i.test(text)) {
    extractedFurnishing = 'unfurnished';
    text = text.replace(/\b(?:un[\s-_]*furnished|non[\s-_]*furnished|not[\s-_]*furnished)\b/gi, ' ');
  }

  // 3. Extract Property Type
  if (/\b(?:flat|flats|apartment|apartments|condo|condos)\b/i.test(text)) {
    extractedPropertyType = 'apartment';
    text = text.replace(/\b(?:flat|flats|apartment|apartments|condo|condos)\b/gi, ' ');
  } else if (/\b(?:independent\s*house|house|houses|duplex|bungalow|row\s*house)\b/i.test(text)) {
    extractedPropertyType = 'house';
    text = text.replace(/\b(?:independent\s*house|house|houses|duplex|bungalow|row\s*house)\b/gi, ' ');
  } else if (/\b(?:luxury\s*villa|villa|villas)\b/i.test(text)) {
    extractedPropertyType = 'villa';
    text = text.replace(/\b(?:luxury\s*villa|villa|villas)\b/gi, ' ');
  } else if (/\b(?:studio\s*apartment|studio\s*flat|studio|loft)\b/i.test(text)) {
    extractedPropertyType = 'studio';
    text = text.replace(/\b(?:studio\s*apartment|studio\s*flat|studio|loft)\b/gi, ' ');
  } else if (/\b(?:commercial\s*space|commercial\s*office|commercial|office\s*space|office|shop)\b/i.test(text)) {
    extractedPropertyType = 'commercial';
    text = text.replace(/\b(?:commercial\s*space|commercial\s*office|commercial|office\s*space|office|shop)\b/gi, ' ');
  }

  // 4. Extract Rent/Budget (e.g. 'under 30000', 'below 40k', 'under 30k', 'between 20k and 40k', '20000 to 40000')
  const rangeMatch = text.match(/(?:between\s+)?(\d+)(k)?\s*(?:to|-|and)\s*(\d+)(k)?/i);
  if (rangeMatch) {
    let min = parseInt(rangeMatch[1], 10) * (rangeMatch[2] ? 1000 : 1);
    let max = parseInt(rangeMatch[3], 10) * (rangeMatch[4] ? 1000 : 1);
    if (min < 100) min *= 1000;
    if (max < 100) max *= 1000;
    extractedMinRent = String(min);
    extractedMaxRent = String(max);
    text = text.replace(rangeMatch[0], ' ');
  } else {
    const underMatch = text.match(/(?:under|below|less\s*than|max|budget\s*of)\s*₹?\s*(\d+)(k)?/i);
    if (underMatch) {
      let max = parseInt(underMatch[1], 10) * (underMatch[2] ? 1000 : 1);
      if (max < 100) max *= 1000;
      extractedMaxRent = String(max);
      text = text.replace(underMatch[0], ' ');
    }
  }

  // 5. Clean up connector words from location string
  text = text
    .replace(/\b(?:in|at|near|around|for\s*rent|on\s*rent|to\s*rent|rent|for|with|furnished|available|property|properties)\b/gi, ' ')
    .replace(/[,\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 6. Check if text contains known locality names first, then known city names
  for (const loc of KNOWN_LOCALITIES) {
    if (text.includes(loc.name)) {
      extractedCity = loc.city;
      break;
    }
  }

  if (!extractedCity) {
    for (const knownCity of KNOWN_CITIES) {
      if (text.includes(knownCity)) {
        extractedCity = knownCity.replace(/\b\w/g, (c) => c.toUpperCase());
        break;
      }
    }
  }

  // Proper Title Case for extracted location
  const cleanSearchTerm = text ? text.replace(/\b\w/g, (c) => c.toUpperCase()) : '';

  const hasExtractedFilters =
    Boolean(extractedBedrooms) ||
    extractedFurnishing !== 'all' ||
    extractedPropertyType !== 'all' ||
    Boolean(extractedMinRent) ||
    Boolean(extractedMaxRent);

  return {
    rawQuery,
    cleanSearchTerm,
    location: cleanSearchTerm,
    city: extractedCity,
    bedrooms: extractedBedrooms,
    furnishing: extractedFurnishing,
    property_type: extractedPropertyType,
    minRent: extractedMinRent,
    maxRent: extractedMaxRent,
    hasExtractedFilters,
  };
}
