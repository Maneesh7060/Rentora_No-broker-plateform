import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Home,
  SlidersHorizontal,
  X,
  RotateCcw,
  Bed,
  Bath,
  Sofa,
  Sparkles,
  Check,
  Building,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import geocodingService from '../../services/geocodingService';
import { parseNaturalSearch } from '../../utils/naturalSearchParser';

const PROPERTY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'apartment', label: 'Apartment / Flat' },
  { value: 'house', label: 'Independent House' },
  { value: 'villa', label: 'Luxury Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'commercial', label: 'Commercial' },
];

const BEDROOM_OPTIONS = [
  { value: '', label: 'Any Beds' },
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4 BHK' },
  { value: '5', label: '5+ BHK' },
];

const FURNISHING_OPTIONS = [
  { value: 'all', label: 'All Furnishing' },
  { value: 'fully_furnished', label: 'Fully Furnished' },
  { value: 'semi_furnished', label: 'Semi Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Listed' },
  { value: 'rent_low', label: 'Rent: Low to High' },
  { value: 'rent_high', label: 'Rent: High to Low' },
  { value: 'distance', label: 'Closest to Location' },
  { value: 'bedrooms', label: 'Most Bedrooms' },
];

const POPULAR_AMENITIES = [
  'Covered Parking',
  'Elevator',
  'Gated Security',
  'Power Backup',
  'Gym / Fitness Centre',
  'Swimming Pool',
  'Balcony',
  'Air Conditioning',
  'Washing Machine',
  'High Speed WiFi',
  'Modular Kitchen',
];

export default function PropertyFilters({
  filters,
  onChange,
  onReset,
  totalResults = 0,
  onLocationFound,
}) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState(
    Array.isArray(filters.amenities) ? filters.amenities : []
  );

  const autocompleteRef = useRef(null);

  // Sync internal search input when filters change from outside
  useEffect(() => {
    if (filters.search !== undefined && filters.search !== searchInput) {
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  // Click outside to close autocomplete
  useEffect(() => {
    function handleClickOutside(event) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced location suggestions
  useEffect(() => {
    if (!searchInput || searchInput.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await geocodingService.searchLocations(searchInput);
      setLocationSuggestions(results || []);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle Natural Search Submission
  const handleExecuteSearch = (customQuery = null) => {
    const queryToParse = customQuery !== null ? customQuery : searchInput;
    const parsed = parseNaturalSearch(queryToParse);

    const updatedFilters = {
      ...filters,
      search: parsed.cleanSearchTerm || '',
      location: parsed.cleanSearchTerm || '',
      city: parsed.city || '',
      bedrooms: parsed.bedrooms || '',
      furnishing: parsed.furnishing || 'all',
      property_type: parsed.property_type || 'all',
      minRent: parsed.minRent || '',
      maxRent: parsed.maxRent || '',
      latitude: '',
      longitude: '',
      page: 1,
    };

    // If a clean location was extracted, geocode it to center the map
    const locToGeocode = parsed.cleanSearchTerm || parsed.city;
    if (locToGeocode) {
      geocodingService
        .geocode(locToGeocode)
        .then((loc) => {
          if (loc && onLocationFound) {
            onLocationFound({
              lat: loc.lat,
              lng: loc.lon,
              name: loc.displayName || loc.locality || locToGeocode,
            });
            updatedFilters.latitude = loc.lat;
            updatedFilters.longitude = loc.lon;
          }
          onChange(updatedFilters);
        })
        .catch(() => {
          onChange(updatedFilters);
        });
    } else {
      onChange(updatedFilters);
    }

    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (suggestion) => {
    const locName = suggestion.name || suggestion.locality || suggestion.displayName || '';
    setSearchInput(locName);
    setShowSuggestions(false);

    if (onLocationFound) {
      onLocationFound({
        lat: suggestion.lat,
        lng: suggestion.lon,
        name: suggestion.displayName || suggestion.name,
      });
    }

    onChange({
      ...filters,
      search: locName,
      location: locName,
      city: suggestion.city || '',
      bedrooms: '',
      furnishing: 'all',
      property_type: 'all',
      latitude: suggestion.lat || '',
      longitude: suggestion.lon || '',
      page: 1,
    });
  };

  const handleFilterUpdate = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  };

  const handleAmenityToggle = (amenity) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updated);
    onChange({
      ...filters,
      amenities: updated,
      page: 1,
    });
  };

  // Active filter chip helpers
  const activeChips = [];
  if (filters.search) {
    activeChips.push({
      label: `"${filters.search}"`,
      clear: () => {
        setSearchInput('');
        onChange({
          ...filters,
          search: '',
          location: '',
          city: '',
          latitude: '',
          longitude: '',
          page: 1,
        });
      },
    });
  }
  if (filters.bedrooms) {
    activeChips.push({
      label: `${filters.bedrooms} BHK`,
      clear: () => handleFilterUpdate('bedrooms', ''),
    });
  }
  if (filters.furnishing && filters.furnishing !== 'all') {
    const fLabel =
      FURNISHING_OPTIONS.find((f) => f.value === filters.furnishing)?.label || filters.furnishing;
    activeChips.push({
      label: fLabel,
      clear: () => handleFilterUpdate('furnishing', 'all'),
    });
  }
  if (filters.property_type && filters.property_type !== 'all') {
    const tLabel =
      PROPERTY_TYPES.find((t) => t.value === filters.property_type)?.label || filters.property_type;
    activeChips.push({
      label: tLabel,
      clear: () => handleFilterUpdate('property_type', 'all'),
    });
  }
  if (filters.minRent || filters.maxRent) {
    activeChips.push({
      label: `₹${filters.minRent || '0'} - ₹${filters.maxRent || 'Any'}`,
      clear: () => onChange({ ...filters, minRent: '', maxRent: '', page: 1 }),
    });
  }
  if (Array.isArray(filters.amenities) && filters.amenities.length > 0) {
    filters.amenities.forEach((a) => {
      activeChips.push({
        label: a,
        clear: () => handleAmenityToggle(a),
      });
    });
  }

  return (
    <div className="space-y-4 mb-6">
      {/* 1. Main Unified Search Hero Bar */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-4 sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteSearch();
          }}
          className="relative"
          ref={autocompleteRef}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Unified Search Input */}
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600 flex items-center gap-1.5 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>

              <input
                type="text"
                placeholder='Search locality, society, city or property (e.g. "2 BHK fully furnished flat in Gaur Yamuna City")'
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (locationSuggestions.length > 0) setShowSuggestions(true);
                }}
                className="w-full pl-12 pr-10 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-inner"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    handleFilterUpdate('search', '');
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Location Autocomplete Dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden divide-y divide-gray-100 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 bg-gray-50/80 text-[11px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-600" /> Suggested Localities & Places
                  </div>
                  {locationSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-3 hover:bg-primary-50/70 transition-colors flex items-start gap-2.5"
                    >
                      <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-gray-900 text-xs sm:text-sm">{item.name}</p>
                        <p className="text-[11px] text-gray-500 truncate max-w-sm sm:max-w-md">
                          {item.displayName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: Search Button + Filter Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="btn-primary !py-3.5 !px-7 text-sm font-bold shadow-md flex items-center justify-center gap-2 flex-1 sm:flex-initial"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
                className={`py-3.5 px-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  isFilterDrawerOpen || activeChips.length > 0
                    ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden md:inline">Filters</span>
                {activeChips.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeChips.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* 2. Quick Filter Pills Row (Desktop) */}
        <div className="mt-4 pt-3 border-t border-gray-100 hidden md:flex flex-wrap items-center gap-3 text-xs">
          {/* Bedrooms Quick Select */}
          <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200/80">
            <span className="px-2 text-gray-500 font-semibold flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" /> BHK:
            </span>
            {['', '1', '2', '3', '4'].map((bhk) => (
              <button
                key={bhk}
                type="button"
                onClick={() => handleFilterUpdate('bedrooms', bhk)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filters.bedrooms === bhk
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-200/60'
                }`}
              >
                {bhk === '' ? 'Any' : `${bhk} BHK`}
              </button>
            ))}
          </div>

          {/* Furnishing Quick Select */}
          <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200/80">
            <span className="px-2 text-gray-500 font-semibold flex items-center gap-1">
              <Sofa className="w-3.5 h-3.5" /> Furnishing:
            </span>
            {FURNISHING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFilterUpdate('furnishing', opt.value)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  (filters.furnishing || 'all') === opt.value
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-200/60'
                }`}
              >
                {opt.label.replace(' Furnished', '')}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-gray-500 font-semibold">Sort:</span>
            <select
              value={filters.sort || 'newest'}
              onChange={(e) => handleFilterUpdate('sort', e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-xs"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Collapsible Detailed Filter Drawer */}
        {isFilterDrawerOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Property Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-primary-600" /> Property Type
              </label>
              <select
                value={filters.property_type || 'all'}
                onChange={(e) => handleFilterUpdate('property_type', e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary-600" /> Price Range (₹/month)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min (₹)"
                  step="1000"
                  value={filters.minRent || ''}
                  onChange={(e) => handleFilterUpdate('minRent', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="number"
                  placeholder="Max (₹)"
                  step="1000"
                  value={filters.maxRent || ''}
                  onChange={(e) => handleFilterUpdate('maxRent', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5 text-primary-600" /> Bathrooms
              </label>
              <select
                value={filters.bathrooms || ''}
                onChange={(e) => handleFilterUpdate('bathrooms', e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="">Any Bathrooms</option>
                <option value="1">1+ Bath</option>
                <option value="2">2+ Baths</option>
                <option value="3">3+ Baths</option>
              </select>
            </div>

            {/* Reset All */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={onReset}
                className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            </div>

            {/* Amenities Multi-Select */}
            <div className="sm:col-span-2 lg:col-span-4 pt-3 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Popular Amenities & Features
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_AMENITIES.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => handleAmenityToggle(amenity)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Filters Chips Bar */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-150">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
            Active Filters:
          </span>
          {activeChips.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 bg-primary-50 border border-primary-200 text-primary-800 text-xs font-bold px-3 py-1 rounded-full shadow-xs"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.clear}
                className="w-4 h-4 rounded-full bg-primary-200/80 hover:bg-primary-300 text-primary-900 flex items-center justify-center transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-bold text-red-600 hover:text-red-700 underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
