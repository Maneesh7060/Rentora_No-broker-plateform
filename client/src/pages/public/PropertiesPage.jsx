import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import propertyService from '../../services/propertyService';
import societyService from '../../services/societyService';
import geocodingService from '../../services/geocodingService';
import { getWishlistIds } from '../../services/wishlistService';
import { useAuth } from '../../context/AuthContext';
import PropertyCard from '../../components/property/PropertyCard';
import PropertyFilters from '../../components/property/PropertyFilters';
import PropertyMap from '../../components/property/PropertyMap';
import NearbySocietiesSection from '../../components/society/NearbySocietiesSection';
import {
  Building,
  Building2,
  Loader2,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  Sparkles,
  Map as MapIcon,
  List,
  Sofa,
  Bed,
  X,
} from 'lucide-react';

export default function PropertiesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map'
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [nearbySocieties, setNearbySocieties] = useState([]);
  const [activeSocietyFilter, setActiveSocietyFilter] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [hoveredProperty, setHoveredProperty] = useState(null);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  // Extract filter parameters from URL query string
  const societyIdParam = searchParams.get('society_id') || searchParams.get('societyId') || '';
  const searchParam = searchParams.get('search') || searchParams.get('keyword') || '';
  const locationParam = searchParams.get('location') || searchParams.get('locality') || '';
  const cityParam = searchParams.get('city') || '';
  const stateParam = searchParams.get('state') || '';
  const propertyTypeParam = searchParams.get('property_type') || searchParams.get('type') || 'all';
  const furnishingParam = searchParams.get('furnishing') || 'all';
  const minRentParam = searchParams.get('minRent') || '';
  const maxRentParam = searchParams.get('maxRent') || '';
  const bedroomsParam = searchParams.get('bedrooms') || '';
  const bathroomsParam = searchParams.get('bathrooms') || '';
  const amenitiesParam = useMemo(() => {
    const raw = searchParams.get('amenities');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;
  const latParam = searchParams.get('latitude') || searchParams.get('lat') || '';
  const lngParam = searchParams.get('longitude') || searchParams.get('lng') || '';

  // Synchronized filters object
  const filters = useMemo(
    () => ({
      search: searchParam,
      location: locationParam,
      city: cityParam,
      state: stateParam,
      property_type: propertyTypeParam,
      furnishing: furnishingParam,
      minRent: minRentParam,
      maxRent: maxRentParam,
      bedrooms: bedroomsParam,
      bathrooms: bathroomsParam,
      amenities: amenitiesParam,
      society_id: societyIdParam,
      latitude: latParam,
      longitude: lngParam,
      sort: sortParam,
      page: pageParam,
      limit: 12,
    }),
    [
      searchParam,
      locationParam,
      cityParam,
      stateParam,
      propertyTypeParam,
      furnishingParam,
      minRentParam,
      maxRentParam,
      bedroomsParam,
      bathroomsParam,
      amenitiesParam,
      societyIdParam,
      latParam,
      lngParam,
      sortParam,
      pageParam,
    ]
  );

  // Sync active society details when society_id parameter changes
  useEffect(() => {
    if (!societyIdParam) {
      setActiveSocietyFilter(null);
      return;
    }

    const sId = Number(societyIdParam);
    if (!isNaN(sId) && (!activeSocietyFilter || Number(activeSocietyFilter.id) !== sId)) {
      societyService
        .getSocietyById(sId)
        .then((res) => {
          const s = res?.data?.society || res?.data;
          if (s && s.id) {
            setActiveSocietyFilter(s);
            if (s.latitude && s.longitude) {
              setSelectedLocation((prev) => prev || {
                lat: parseFloat(s.latitude),
                lng: parseFloat(s.longitude),
                latitude: parseFloat(s.latitude),
                longitude: parseFloat(s.longitude),
                name: s.name,
              });
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load society details:', err);
        });
    }
  }, [societyIdParam, activeSocietyFilter]);

  // Fetch wishlisted property IDs for logged-in user
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setWishlistIds([]);
        return;
      }
      try {
        const res = await getWishlistIds();
        setWishlistIds(res.data || []);
      } catch (err) {
        console.error('Failed to load wishlist IDs:', err);
      }
    };
    fetchWishlist();
  }, [user]);

  // Geocode location search term if coordinates not yet present
  useEffect(() => {
    const term = locationParam || searchParam || cityParam;
    if (term && term.trim().length >= 2 && !selectedLocation && !latParam) {
      geocodingService
        .geocode(term.trim())
        .then((loc) => {
          if (loc) {
            setSelectedLocation({
              lat: loc.lat,
              lng: loc.lon,
              latitude: loc.lat,
              longitude: loc.lon,
              name: loc.locality || loc.name || term,
            });
          }
        })
        .catch(() => {});
    }
  }, [searchParam, locationParam, cityParam, selectedLocation, latParam]);

  // Fetch properties from backend with race condition prevention
  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    const executeFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await propertyService.getProperties(filters, {
          signal: controller.signal,
        });

        if (isCurrent && response && response.data) {
          setProperties(response.data.properties || []);
          setPagination({
            total: response.data.total || 0,
            page: response.data.page || 1,
            limit: response.data.limit || 12,
            totalPages: response.data.totalPages || 1,
          });
          setError(null);
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || !isCurrent) {
          return;
        }
        console.error('Fetch properties error:', err);
        setProperties([]);
        setPagination({ total: 0, page: 1, limit: 12, totalPages: 1 });
        setError(
          err.response?.data?.message || 'Unable to load properties. Please try again.'
        );
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(executeFetch, 150);

    return () => {
      isCurrent = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [filters, refreshKey]);

  const handleRetry = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleFilterChange = (newFilters) => {
    const nextParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        if (Array.isArray(val)) {
          if (val.length > 0) nextParams.set(key, val.join(','));
        } else {
          nextParams.set(key, String(val));
        }
      }
    });
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setSelectedLocation(null);
    setActiveSocietyFilter(null);
    setNearbySocieties([]);
    setLocationError(null);
    setSearchParams({});
  };

  const handleLocationFound = (loc) => {
    if (!loc) {
      setSelectedLocation(null);
      return;
    }
    const lat = loc.lat || loc.latitude;
    const lng = loc.lng || loc.lon || loc.longitude;
    setSelectedLocation({
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      name: loc.displayName || loc.locality || loc.name || filters.search || 'Searched Location',
    });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const geoData = await geocodingService.reverseGeocode(lat, lng);
          const locName = geoData?.name || geoData?.city || 'Current Location';

          const locObj = {
            latitude: lat,
            longitude: lng,
            lat,
            lng,
            name: locName,
          };

          setSelectedLocation(locObj);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('search', locName);
          nextParams.set('location', locName);
          if (geoData?.city) nextParams.set('city', geoData.city);
          nextParams.set('latitude', String(lat));
          nextParams.set('longitude', String(lng));
          nextParams.set('page', '1');
          setSearchParams(nextParams);
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          setSelectedLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: 'Current Location',
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        if (err.code === 1 /* PERMISSION_DENIED */) {
          setLocationError('Location access was denied. Please search for your locality manually.');
        } else {
          setLocationError('Unable to detect your location. Please try again or search manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectSociety = (soc) => {
    if (!soc) return;
    setActiveSocietyFilter(soc);
    if (soc.latitude && soc.longitude) {
      setSelectedLocation({
        lat: parseFloat(soc.latitude),
        lng: parseFloat(soc.longitude),
        latitude: parseFloat(soc.latitude),
        longitude: parseFloat(soc.longitude),
        name: soc.name,
      });
    }

    const nextParams = new URLSearchParams(searchParams);
    // Remove old search and location terms to prevent query conflict
    nextParams.delete('search');
    nextParams.delete('keyword');
    nextParams.delete('location');
    nextParams.delete('locality');
    nextParams.delete('city');
    nextParams.delete('latitude');
    nextParams.delete('longitude');
    nextParams.delete('lat');
    nextParams.delete('lng');

    nextParams.set('society_id', String(soc.id));
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleClearSocietyFilter = () => {
    setActiveSocietyFilter(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('society_id');
    nextParams.delete('societyId');
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('page', String(newPage));
      setSearchParams(nextParams);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWishlistChange = (propertyId, isSaved) => {
    setWishlistIds((prev) =>
      isSaved ? [...prev, propertyId] : prev.filter((id) => id !== propertyId)
    );
  };

  // Result Header computation
  const headerLocation =
    activeSocietyFilter?.name ||
    filters.location ||
    filters.search ||
    filters.city ||
    'All India';
  const headerBedrooms = filters.bedrooms ? `${filters.bedrooms} BHK ` : '';
  const headerFurnishing =
    filters.furnishing && filters.furnishing !== 'all'
      ? `${filters.furnishing.replace('_', ' ')} `
      : '';

  return (
    <div className="min-h-screen bg-warm-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-primary-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Rental Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
            Find Your Next Rental Home
          </h1>
        </div>

        {/* 1. Unified Natural Search & Filter Controls */}
        <PropertyFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          totalResults={pagination.total}
          onLocationFound={handleLocationFound}
        />

        {/* 2. Nearby Societies Discovery Section */}
        <NearbySocietiesSection
          locationCoordinates={
            selectedLocation
              ? {
                  latitude: selectedLocation.latitude || selectedLocation.lat,
                  longitude: selectedLocation.longitude || selectedLocation.lng,
                }
              : null
          }
          locationName={
            activeSocietyFilter?.name ||
            selectedLocation?.name ||
            filters.location ||
            filters.search ||
            ''
          }
          selectedSocietyId={activeSocietyFilter?.id || societyIdParam || null}
          onSelectSociety={handleSelectSociety}
          onSocietiesLoaded={setNearbySocieties}
          onUseMyLocation={handleUseMyLocation}
          isDetectingLocation={isDetectingLocation}
          locationError={locationError}
        />

        {/* 3. Search Result Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white rounded-xl p-4 border border-warm-200 shadow-warm-sm">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-warm-900 capitalize">
                {activeSocietyFilter
                  ? `Properties in ${activeSocietyFilter.name}`
                  : headerBedrooms || headerFurnishing
                  ? `${headerBedrooms}${headerFurnishing}Properties in ${headerLocation}`
                  : `Properties for Rent in ${headerLocation}`}
              </h2>

              {activeSocietyFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200">
                  <Building2 className="w-3 h-3 text-primary-600" />
                  <span>{activeSocietyFilter.name}</span>
                  <button
                    type="button"
                    onClick={handleClearSocietyFilter}
                    className="ml-0.5 p-0.5 hover:bg-primary-200 rounded-full transition-colors"
                    title="Clear society filter"
                  >
                    <X className="w-3 h-3 text-primary-800" />
                  </button>
                </span>
              )}
            </div>

            <p className="text-xs text-warm-500 mt-0.5">
              {loading
                ? 'Searching verified properties...'
                : error
                ? 'Error retrieving properties'
                : `Showing ${pagination.total} verified ${
                    pagination.total === 1 ? 'property' : 'properties'
                  } available`}
            </p>
          </div>

          {/* Mobile List / Map Switcher Buttons */}
          <div className="flex items-center gap-1 bg-warm-100 p-1 rounded-lg lg:hidden self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mobileView === 'list'
                  ? 'bg-white text-warm-900 shadow-warm-sm'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setMobileView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mobileView === 'map'
                  ? 'bg-white text-primary-600 shadow-warm-sm'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map View
            </button>
          </div>
        </div>

        {/* 4. Main Body: Split Desktop Layout (Left: Results, Right: Sticky Map) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Properties List (7 of 12 cols on desktop) */}
          <div
            className={`lg:col-span-7 space-y-6 ${
              mobileView === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-warm-200 overflow-hidden animate-pulse flex flex-col"
                  >
                    <div className="h-48 bg-warm-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-warm-200 rounded w-3/4" />
                      <div className="h-3 bg-warm-200 rounded w-1/2" />
                      <div className="h-8 bg-warm-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="bg-brick-50 border border-brick-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
                <AlertTriangle className="w-10 h-10 text-brick-600 mx-auto mb-2" />
                <h3 className="text-base font-bold text-brick-900 mb-1">Search Error</h3>
                <p className="text-xs text-brick-700 mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="btn-primary bg-brick-600 hover:bg-brick-700 !py-2 !px-4 text-xs inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Try Again
                </button>
              </div>
            )}

            {/* Empty State with Helpful Suggestions */}
            {!loading && !error && properties.length === 0 && (
              <div className="bg-white rounded-2xl border border-warm-200 text-center py-12 px-6 shadow-warm-sm">
                <div className="w-14 h-14 rounded-xl bg-warm-100 text-warm-500 flex items-center justify-center mx-auto mb-3">
                  <Home className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-warm-900 mb-1">
                  {activeSocietyFilter
                    ? 'No properties available in this society yet.'
                    : 'No Matching Properties Found'}
                </h3>
                <p className="text-xs text-warm-500 mb-6 max-w-md mx-auto">
                  {activeSocietyFilter
                    ? `There are currently no active rental listings for ${activeSocietyFilter.name}. You can explore other nearby societies or view all properties in ${headerLocation}.`
                    : `We couldn't find properties matching your exact search criteria in ${headerLocation}.`}
                </p>

                {/* Helpful Suggestions */}
                <div className="space-y-2 max-w-xs mx-auto text-xs">
                  {activeSocietyFilter && (
                    <button
                      onClick={handleClearSocietyFilter}
                      className="w-full py-2 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-warm-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear Society Filter
                    </button>
                  )}

                  {filters.furnishing && filters.furnishing !== 'all' && (
                    <button
                      onClick={() => handleFilterChange({ ...filters, furnishing: 'all' })}
                      className="w-full py-2 px-3 rounded-lg bg-warm-100 hover:bg-warm-200 font-semibold text-warm-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sofa className="w-3.5 h-3.5 text-primary-600" /> Remove Furnishing Filter
                    </button>
                  )}

                  {filters.bedrooms && (
                    <button
                      onClick={() => handleFilterChange({ ...filters, bedrooms: '' })}
                      className="w-full py-2 px-3 rounded-lg bg-warm-100 hover:bg-warm-200 font-semibold text-warm-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Bed className="w-3.5 h-3.5 text-primary-600" /> Show All Bedroom Types
                    </button>
                  )}

                  <button
                    onClick={handleResetFilters}
                    className="w-full py-2 px-3 rounded-lg bg-primary-50 hover:bg-primary-100 font-bold text-primary-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Property Cards Grid */}
            {!loading && !error && properties.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onHover={setHoveredProperty}
                      isSelected={hoveredProperty?.id === property.id}
                      isWishlisted={wishlistIds.includes(property.id)}
                      onWishlistChange={handleWishlistChange}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-warm-200">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-warm-300 bg-white text-warm-700 hover:bg-warm-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-warm-sm"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1).map((pNum) => (
                        <button
                          key={pNum}
                          onClick={() => handlePageChange(pNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                            pagination.page === pNum
                              ? 'bg-primary-600 text-white shadow-warm-sm'
                              : 'bg-white text-warm-700 border border-warm-300 hover:bg-warm-50'
                          }`}
                        >
                          {pNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-warm-300 bg-white text-warm-700 hover:bg-warm-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-warm-sm"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Sticky Interactive Leaflet Map (5 of 12 cols on desktop) */}
          <div
            className={`lg:col-span-5 lg:sticky lg:top-20 ${
              mobileView === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-warm-200 shadow-warm-sm">
              <div className="flex items-center justify-between mb-2.5 px-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  <h3 className="text-xs font-bold text-warm-900">
                    Interactive Map (
                    {
                      properties.filter(
                        (p) =>
                          p.latitude &&
                          p.longitude &&
                          !isNaN(Number(p.latitude)) &&
                          !isNaN(Number(p.longitude))
                      ).length
                    }{' '}
                    properties
                    {nearbySocieties.length > 0 ? `, ${nearbySocieties.length} societies` : ''})
                  </h3>
                </div>
                <span className="text-[11px] text-warm-400 font-medium">OpenStreetMap</span>
              </div>

              <PropertyMap
                properties={properties}
                societies={nearbySocieties}
                searchLocation={selectedLocation}
                hoveredProperty={hoveredProperty}
                onSelectSociety={handleSelectSociety}
                height="560px"
                zoom={13}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
