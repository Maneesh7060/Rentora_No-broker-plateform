/**
 * Geocoding Service using OpenStreetMap Nominatim with local fast-lookup caching
 */

const LOCALITY_CACHE = [
  {
    keywords: ['gaur yamuna city', 'gaur yamuna', 'gyc'],
    name: 'Gaur Yamuna City',
    displayName: 'Gaur Yamuna City, Yamuna Expressway, Greater Noida',
    locality: 'Gaur Yamuna City',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    lat: 28.3096,
    lon: 77.5575,
  },
  {
    keywords: ['greater noida', 'gr noida', 'gre noida'],
    name: 'Greater Noida',
    displayName: 'Greater Noida, Gautam Buddha Nagar, Uttar Pradesh',
    locality: 'Greater Noida',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    lat: 28.4744,
    lon: 77.5040,
  },
  {
    keywords: ['noida'],
    name: 'Noida',
    displayName: 'Noida, Gautam Buddha Nagar, Uttar Pradesh',
    locality: 'Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    lat: 28.5355,
    lon: 77.3910,
  },
  {
    keywords: ['delhi', 'new delhi', 'south delhi', 'saket'],
    name: 'Delhi NCR',
    displayName: 'Delhi, National Capital Territory of Delhi',
    locality: 'South Delhi',
    city: 'Delhi',
    state: 'Delhi',
    lat: 28.6139,
    lon: 77.2090,
  },
  {
    keywords: ['gurgaon', 'gurugram', 'golf course', 'cyber city'],
    name: 'Gurgaon',
    displayName: 'Gurugram (Gurgaon), Haryana',
    locality: 'Golf Course Extension',
    city: 'Gurgaon',
    state: 'Haryana',
    lat: 28.4595,
    lon: 77.0266,
  },
  {
    keywords: ['bangalore', 'bengaluru', 'whitefield', 'bellandur'],
    name: 'Bangalore',
    displayName: 'Bengaluru (Bangalore), Karnataka',
    locality: 'Bellandur',
    city: 'Bangalore',
    state: 'Karnataka',
    lat: 12.9716,
    lon: 77.5946,
  },
  {
    keywords: ['mumbai', 'navi mumbai', 'vashi'],
    name: 'Mumbai',
    displayName: 'Mumbai, Maharashtra',
    locality: 'Vashi',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0760,
    lon: 72.8777,
  },
];

let activeAbortController = null;

export const geocodingService = {
  /**
   * Search for locations / localities matching query text
   * @param {string} query
   * @returns {Promise<Array<{ name: string, displayName: string, lat: number, lon: number, city: string, state: string }>>}
   */
  async searchLocations(query) {
    if (!query || query.trim().length < 2) return [];

    const normalized = query.trim().toLowerCase();

    // 1. Check local instant cache first
    const cachedMatches = LOCALITY_CACHE.filter((item) =>
      item.keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized))
    );

    // If exact or strong local match, return instantly without network wait
    if (cachedMatches.length > 0) {
      return cachedMatches;
    }

    // 2. Fetch from OpenStreetMap Nominatim
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&addressdetails=1&limit=5&countrycodes=in`;

      const response = await fetch(url, {
        signal: activeAbortController.signal,
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) return cachedMatches;

      const data = await response.json();
      const results = (data || []).map((item) => {
        const addr = item.address || {};
        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.city_district ||
          addr.town ||
          addr.village ||
          item.name;

        const city =
          addr.city || addr.town || addr.county || addr.state_district || 'Greater Noida';
        const state = addr.state || 'Uttar Pradesh';

        return {
          name: item.name || locality,
          displayName: item.display_name,
          locality: locality || item.name,
          city,
          state,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        };
      });

      return [...cachedMatches, ...results];
    } catch (err) {
      if (err.name === 'AbortError') return [];
      return cachedMatches;
    }
  },

  /**
   * Geocode a specific query to get best center coordinates
   * @param {string} query
   * @returns {Promise<{ lat: number, lon: number, displayName: string } | null>}
   */
  async geocode(query) {
    const results = await this.searchLocations(query);
    if (results && results.length > 0) {
      return results[0];
    }
    return null;
  },

  /**
   * Reverse geocode latitude and longitude to get locality and city name
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<{ name: string, displayName: string, city: string, state: string, lat: number, lon: number }>}
   */
  async reverseGeocode(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        return {
          name: 'Current Location',
          displayName: 'Current Location',
          city: '',
          state: '',
          lat: parseFloat(lat),
          lon: parseFloat(lon),
        };
      }

      const data = await response.json();
      const addr = data.address || {};
      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.city_district ||
        addr.town ||
        addr.village ||
        addr.city;

      const city = addr.city || addr.town || addr.county || '';
      const state = addr.state || '';

      return {
        name: locality || data.display_name?.split(',')[0] || 'Current Location',
        displayName: data.display_name || 'Current Location',
        locality: locality || '',
        city,
        state,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      };
    } catch {
      return {
        name: 'Current Location',
        displayName: 'Current Location',
        city: '',
        state: '',
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      };
    }
  },
};

export default geocodingService;

