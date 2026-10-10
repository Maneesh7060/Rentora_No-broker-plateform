import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Navigation,
  ArrowRight,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { getNearbySocieties } from '../../services/societyService';

const RADIUS_OPTIONS = [5, 10, 15];

export default function NearbySocietiesSection({
  locationCoordinates,
  locationName = '',
  selectedSocietyId = null,
  onSelectSociety,
  onSocietiesLoaded,
  onUseMyLocation,
  isDetectingLocation = false,
  locationError = null,
}) {
  const [radius, setRadius] = useState(10);
  const [societies, setSocieties] = useState([]);
  const [countsByRadius, setCountsByRadius] = useState({ '5km': 0, '10km': 0, '15km': 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  // Fetch nearby societies when coordinates or radius change
  useEffect(() => {
    if (!locationCoordinates?.latitude || !locationCoordinates?.longitude) {
      setSocieties([]);
      if (onSocietiesLoaded) {
        onSocietiesLoaded([]);
      }
      return;
    }

    const fetchSocieties = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getNearbySocieties({
          latitude: locationCoordinates.latitude,
          longitude: locationCoordinates.longitude,
          radius,
        });

        if (res?.data) {
          const list = res.data.societies || [];
          setSocieties(list);
          if (onSocietiesLoaded) {
            onSocietiesLoaded(list);
          }
          if (res.data.counts_by_radius) {
            setCountsByRadius(res.data.counts_by_radius);
          }
        }
      } catch (err) {
        console.error('Failed to fetch nearby societies:', err);
        setError('Unable to load nearby societies.');
      } finally {
        setLoading(false);
      }
    };

    fetchSocieties();
  }, [locationCoordinates?.latitude, locationCoordinates?.longitude, radius]);

  // Don't render section if no search location and no coordinates
  if (!locationCoordinates?.latitude || !locationCoordinates?.longitude) {
    return (
      <div className="bg-white rounded-xl p-4 border border-warm-200 shadow-warm-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-warm-900">Discover Housing Societies</h4>
            <p className="text-[11px] text-warm-500">
              Search a locality or use your current location to explore nearby gated communities.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={isDetectingLocation}
          className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          {isDetectingLocation ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-primary-500" />
          )}
          <span>{isDetectingLocation ? 'Detecting Location...' : 'Use My Location'}</span>
        </button>
      </div>
    );
  }

  const currentCount = countsByRadius[`${radius}km`] || societies.length;

  return (
    <div className="bg-white rounded-xl border border-warm-200 shadow-warm-sm p-4 sm:p-5 mb-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-warm-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-warm-900 flex items-center gap-1.5">
                <span>Nearby Housing Societies</span>
                {locationName && (
                  <span className="text-warm-500 font-normal">
                    near <strong className="text-warm-800 font-semibold">{locationName}</strong>
                  </span>
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Location & Radius Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Radius selector buttons */}
          <div className="flex items-center gap-1 bg-warm-50 p-1 rounded-lg border border-warm-200">
            <span className="text-[10px] font-semibold uppercase text-warm-400 px-1.5">Radius:</span>
            {RADIUS_OPTIONS.map((r) => {
              const count = countsByRadius[`${r}km`];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                    radius === r
                      ? 'bg-primary-500 text-white shadow-warm-sm'
                      : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100'
                  }`}
                >
                  <span>{r} km</span>
                  {count !== undefined && (
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        radius === r
                          ? 'bg-white/20 text-white'
                          : 'bg-warm-200 text-warm-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Use My Location Quick Button */}
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={isDetectingLocation}
            className="p-1.5 text-warm-500 hover:text-primary-600 hover:bg-warm-100 rounded-lg transition-colors border border-warm-200"
            title="Use current GPS location"
            aria-label="Use my location"
          >
            {isDetectingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Geolocation Denied Message */}
      {locationError && (
        <div className="mt-3 p-3 bg-brick-50 border border-brick-200 rounded-lg text-xs text-brick-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-brick-500 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Summary Count Bar */}
      <div className="py-2.5 flex items-center justify-between text-xs text-warm-600">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-[11px] sm:text-xs">
          <span>
            Within 5 km: <strong className="text-warm-900 font-bold">{countsByRadius['5km'] || 0}</strong> societies
          </span>
          <span className="text-warm-300">•</span>
          <span>
            Within 10 km: <strong className="text-warm-900 font-bold">{countsByRadius['10km'] || 0}</strong> societies
          </span>
          <span className="text-warm-300">•</span>
          <span>
            Within 15 km: <strong className="text-warm-900 font-bold">{countsByRadius['15km'] || 0}</strong> societies
          </span>
        </div>

        {societies.length > 3 && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="text-[11px] text-primary-600 hover:text-primary-700 font-semibold"
          >
            {collapsed ? `Show All (${societies.length})` : 'Show Less'}
          </button>
        )}
      </div>

      {/* Content States */}
      {loading ? (
        <div className="py-8 text-center text-xs text-warm-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
          <span>Finding nearby societies within {radius} km...</span>
        </div>
      ) : error ? (
        <div className="py-6 text-center text-xs text-brick-600 bg-brick-50/50 rounded-lg p-3">
          <p>{error}</p>
          <button
            onClick={() => setRadius((r) => r)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
          >
            <RotateCcw className="w-3 h-3" /> Retry
          </button>
        </div>
      ) : societies.length === 0 ? (
        <div className="py-6 text-center text-xs text-warm-500 bg-warm-50 rounded-lg p-4">
          <p className="font-semibold text-warm-700">No societies found within {radius} km.</p>
          <p className="text-[11px] text-warm-500 mt-0.5">Try expanding your search radius to explore farther.</p>
          {radius < 15 && (
            <button
              onClick={() => setRadius(15)}
              className="mt-2.5 px-3 py-1 bg-white border border-warm-300 text-warm-800 rounded-md text-xs font-semibold hover:bg-warm-100"
            >
              Try 15 km
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {(collapsed ? societies.slice(0, 3) : societies).map((soc) => {
            const isSelected = Boolean(selectedSocietyId) && Number(selectedSocietyId) === Number(soc.id);
            return (
              <div
                key={soc.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/50 ring-2 ring-primary-100 shadow-warm-sm'
                    : 'border-warm-200 hover:border-warm-300 bg-white hover:shadow-warm-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-warm-900 leading-snug line-clamp-1">
                      {soc.name}
                    </h4>
                    <span className="text-[10px] font-semibold text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded shrink-0">
                      {soc.distance_km} km
                    </span>
                  </div>

                  <div className="flex items-center text-[11px] text-warm-500 mt-1">
                    <MapPin className="w-3 h-3 text-warm-400 shrink-0 mr-1" />
                    <span className="truncate">
                      {soc.locality ? `${soc.locality}, ` : ''}{soc.city}
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-warm-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-warm-600">
                    <strong className="text-warm-900 font-bold">{soc.property_count}</strong> available {soc.property_count === 1 ? 'property' : 'properties'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectSociety && onSelectSociety(soc)}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'text-primary-600 hover:text-white bg-primary-50 hover:bg-primary-600'
                    }`}
                  >
                    <span>{isSelected ? 'Viewing' : 'View Properties'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
