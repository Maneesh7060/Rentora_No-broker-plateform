import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, ExternalLink, Bed, Bath, Maximize2, Loader2, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix for default Leaflet marker icon asset paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const FURNISHING_LABELS = {
  fully_furnished: 'Fully Furnished',
  semi_furnished: 'Semi Furnished',
  unfurnished: 'Unfurnished',
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

/**
 * Validate geographic coordinates
 */
function isValidCoord(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180 &&
    (nLat !== 0 || nLng !== 0)
  );
}

/**
 * Formats price into compact currency string (e.g. ₹28K, ₹1.2L)
 */
function formatPricePill(amount) {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return '₹';
  if (num >= 100000) {
    const lVal = (num / 100000).toFixed(1).replace(/\.0$/, '');
    return `₹${lVal}L`;
  }
  if (num >= 1000) {
    return `₹${Math.round(num / 1000)}K`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Creates custom price tag marker DivIcon for rental properties
 */
function createPriceIcon(price, isSelected = false) {
  const priceText = formatPricePill(price);
  const activeClass = isSelected
    ? 'bg-primary-500 text-white ring-4 ring-primary-100 scale-110 shadow-warm-md border-primary-600'
    : 'bg-white text-warm-900 border border-warm-300 shadow-warm-sm hover:bg-primary-500 hover:text-white hover:border-primary-500 hover:scale-105';

  return L.divIcon({
    className: 'rentora-price-marker-icon',
    html: `
      <div style="display:flex;align-items:center;justify-content:center;">
        <div class="px-2.5 py-1 rounded-full font-bold text-xs transition-all duration-150 cursor-pointer flex items-center justify-center whitespace-nowrap shadow-warm-sm ${activeClass}" style="letter-spacing: -0.01em;">
          ${priceText}
        </div>
      </div>
    `,
    iconSize: [54, 28],
    iconAnchor: [27, 14],
    popupAnchor: [0, -14],
  });
}

/**
 * Creates custom society marker icon (Terracotta building badge)
 */
function createSocietyIcon(name) {
  const truncated = name.length > 20 ? `${name.substring(0, 18)}…` : name;
  return L.divIcon({
    className: 'rentora-society-marker-icon',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;">
        <div style="background:#C45A3C;color:white;padding:3px 8px;border-radius:8px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:4px;box-shadow:0 2px 6px rgba(40,30,20,0.25);border:1.5px solid white;white-space:nowrap;letter-spacing:-0.01em;">
          🏢 ${truncated}
        </div>
        <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #C45A3C;margin-top:-1px;"></div>
      </div>
    `,
    iconSize: [120, 30],
    iconAnchor: [60, 30],
    popupAnchor: [0, -32],
  });
}

/**
 * Visually distinct search locality marker icon (Red Pin)
 */
const searchCenterIcon = L.divIcon({
  className: 'rentora-search-center-icon',
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="background:#dc2626;color:white;padding:4px 8px;border-radius:12px;font-size:10px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 4px 6px -1px rgba(0,0,0,0.25);display:flex;align-items:center;gap:3px;white-space:nowrap;border:2px solid white;">
        📍 Searched Area
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #dc2626;margin-top:-1px;"></div>
    </div>
  `,
  iconSize: [110, 36],
  iconAnchor: [55, 36],
  popupAnchor: [0, -38],
});

/**
 * Standard single property marker icon
 */
const singlePropertyIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Handles map click for coordinate selection (e.g. in owner property modal)
 */
function LocationPickerHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

/**
 * Auto-adjusts map bounds, handles invalidateSize, and manages viewports
 */
function MapController({
  center,
  zoom,
  properties = [],
  societies = [],
  searchLocation = null,
  singlePropertyCoord = null,
}) {
  const map = useMap();
  const prevSignatureRef = useRef('');

  // Handle container resize & visibility toggle
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 350);

    const container = map.getContainer();
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    const handleWindowResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [map]);

  // Adjust view / bounds only when relevant data changes
  useEffect(() => {
    const validProps = properties.filter((p) => isValidCoord(p.latitude, p.longitude));
    const validSocs = societies.filter((s) => isValidCoord(s.latitude, s.longitude));

    const propIds = validProps
      .map((p) => p.id)
      .sort()
      .join('-');
    const socIds = validSocs
      .map((s) => s.id)
      .sort()
      .join('-');

    const searchSig =
      searchLocation && isValidCoord(searchLocation.lat, searchLocation.lng)
        ? `${Number(searchLocation.lat).toFixed(4)},${Number(searchLocation.lng).toFixed(4)}`
        : '';
    const singleSig =
      singlePropertyCoord && isValidCoord(singlePropertyCoord[0], singlePropertyCoord[1])
        ? `${Number(singlePropertyCoord[0]).toFixed(4)},${Number(singlePropertyCoord[1]).toFixed(4)}`
        : '';

    const currentSignature = `${propIds}|${socIds}|${searchSig}|${singleSig}`;
    if (currentSignature === prevSignatureRef.current && prevSignatureRef.current !== '') {
      return;
    }
    prevSignatureRef.current = currentSignature;

    // 1. Single property view mode (Property Details Page)
    if (singlePropertyCoord && isValidCoord(singlePropertyCoord[0], singlePropertyCoord[1])) {
      map.setView([Number(singlePropertyCoord[0]), Number(singlePropertyCoord[1])], zoom || 14, {
        animate: true,
      });
      return;
    }

    // 2. Multiple coordinates (properties and/or societies)
    const allLatLngs = [];
    validProps.forEach((p) => allLatLngs.push([Number(p.latitude), Number(p.longitude)]));
    validSocs.forEach((s) => allLatLngs.push([Number(s.latitude), Number(s.longitude)]));

    if (searchLocation && isValidCoord(searchLocation.lat, searchLocation.lng)) {
      allLatLngs.push([Number(searchLocation.lat), Number(searchLocation.lng)]);
    }

    if (allLatLngs.length > 1) {
      const bounds = L.latLngBounds(allLatLngs);
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
      });
      return;
    }

    // 3. Exactly one point found
    if (allLatLngs.length === 1) {
      map.setView(allLatLngs[0], zoom || 14, { animate: true });
      return;
    }

    // 4. Fallback to center
    if (center && isValidCoord(center[0], center[1])) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [properties, societies, searchLocation, singlePropertyCoord, zoom, center, map]);

  return null;
}

/**
 * PropertyMap Component
 */
export default function PropertyMap({
  properties = [],
  societies = [],
  searchLocation = null,
  hoveredProperty = null,
  onSelectSociety,
  latitude,
  longitude,
  title,
  price,
  address,
  isPicker = false,
  onLocationSelect,
  height = '100%',
  zoom = 13,
  className = '',
}) {
  // Default coordinates: Gaur Yamuna City, Greater Noida
  const defaultCenter = [28.3096, 77.5575];

  const hasSingleCoord = isValidCoord(latitude, longitude);
  const singlePropertyCoord = hasSingleCoord ? [Number(latitude), Number(longitude)] : null;

  // Filter out any invalid coordinates
  const validProperties = properties.filter((p) => isValidCoord(p.latitude, p.longitude));
  const validSocieties = societies.filter((s) => isValidCoord(s.latitude, s.longitude));

  // Determine initial center
  let initialCenter = defaultCenter;
  if (searchLocation && isValidCoord(searchLocation.lat, searchLocation.lng)) {
    initialCenter = [Number(searchLocation.lat), Number(searchLocation.lng)];
  } else if (hasSingleCoord) {
    initialCenter = singlePropertyCoord;
  } else if (validProperties.length > 0) {
    initialCenter = [Number(validProperties[0].latitude), Number(validProperties[0].longitude)];
  } else if (validSocieties.length > 0) {
    initialCenter = [Number(validSocieties[0].latitude), Number(validSocieties[0].longitude)];
  }

  return (
    <div
      style={{ height, minHeight: '380px' }}
      className={`relative w-full rounded-2xl overflow-hidden border border-warm-200 shadow-warm-sm z-0 bg-warm-100 ${className}`}
    >
      {/* Picker Guidance Banner */}
      {isPicker && (
        <div className="absolute top-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur px-3.5 py-2.5 rounded-xl text-xs font-semibold text-warm-900 shadow-warm-md border border-warm-200 flex items-center gap-2 animate-in fade-in duration-150">
          <Navigation className="w-4 h-4 text-primary-500 animate-pulse shrink-0" />
          <span>Click anywhere on the interactive map to pin property coordinates.</span>
        </div>
      )}

      <MapContainer
        center={initialCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '380px' }}
      >
        {/* OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Viewport, Resizing & Bounds Controller */}
        <MapController
          center={initialCenter}
          zoom={zoom}
          properties={validProperties}
          societies={validSocieties}
          searchLocation={searchLocation}
          singlePropertyCoord={singlePropertyCoord}
        />

        {/* Location Picker Click Listener */}
        {isPicker && <LocationPickerHandler onLocationSelect={onLocationSelect} />}

        {/* 1. Searched Location Center Marker (Red Pin) */}
        {searchLocation && isValidCoord(searchLocation.lat, searchLocation.lng) && (
          <Marker
            position={[Number(searchLocation.lat), Number(searchLocation.lng)]}
            icon={searchCenterIcon}
          >
            <Popup className="rentora-map-popup" offset={[0, -28]}>
              <div className="p-3 text-center min-w-[160px]">
                <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                  Searched Location
                </span>
                <p className="font-bold text-warm-900 text-xs sm:text-sm mt-1.5">
                  {searchLocation.name || 'Searched Area'}
                </p>
                <p className="text-[11px] text-warm-500 mt-0.5">
                  Showing available rentals and societies
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Nearby Society Markers (Terracotta Building Pins) */}
        {validSocieties.map((soc) => (
          <Marker
            key={`soc-${soc.id}`}
            position={[Number(soc.latitude), Number(soc.longitude)]}
            icon={createSocietyIcon(soc.name)}
            zIndexOffset={600}
          >
            <Popup className="rentora-map-popup" offset={[0, -18]}>
              <div className="p-3.5 max-w-[260px] text-left">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-primary-800 bg-primary-100 px-2 py-0.5 rounded-md">
                    Housing Society
                  </span>
                  {soc.distance_km !== undefined && (
                    <span className="text-[10px] font-semibold text-warm-500">
                      {soc.distance_km} km away
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-warm-900 text-sm leading-snug">
                  {soc.name}
                </h4>

                <p className="text-warm-500 text-xs flex items-center gap-1 mt-0.5 mb-2.5">
                  <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                  <span className="truncate">
                    {soc.locality ? `${soc.locality}, ` : ''}{soc.city}
                  </span>
                </p>

                <div className="pt-2 border-t border-warm-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-warm-700">
                    <strong className="text-warm-900 font-bold">{soc.property_count || 0}</strong>{' '}
                    {soc.property_count === 1 ? 'property' : 'properties'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectSociety && onSelectSociety(soc)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 px-2.5 py-1 rounded-md shadow-warm-sm transition-colors cursor-pointer"
                  >
                    <span>View Properties</span>
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 3. Single Property Marker Mode (Details Page & Picker) */}
        {hasSingleCoord && (
          <Marker position={singlePropertyCoord} icon={singlePropertyIcon}>
            <Popup className="rentora-map-popup" offset={[0, -28]}>
              <div className="p-3.5 max-w-[240px]">
                {title && (
                  <h4 className="font-bold text-warm-900 text-sm leading-snug mb-1">{title}</h4>
                )}
                {price && (
                  <p className="text-primary-600 font-bold text-base mb-1">
                    ₹{Number(price).toLocaleString('en-IN')}
                    <span className="text-warm-400 text-xs font-normal">/month</span>
                  </p>
                )}
                {address && (
                  <p className="text-warm-500 text-xs flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="truncate">{address}</span>
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* 4. Multi-Property Price Markers & Interactive Popups */}
        {validProperties.map((prop) => {
          const isSelected = hoveredProperty?.id === prop.id;
          const displayImage =
            prop.images && prop.images.length > 0 && prop.images[0]
              ? prop.images[0]
              : FALLBACK_IMAGE;

          return (
            <Marker
              key={prop.id}
              position={[Number(prop.latitude), Number(prop.longitude)]}
              icon={createPriceIcon(prop.rent_amount, isSelected)}
              zIndexOffset={isSelected ? 1000 : 100}
            >
              <Popup className="rentora-map-popup" offset={[0, -10]}>
                <div className="w-64 sm:w-72 overflow-hidden rounded-xl bg-white font-sans text-left">
                  {/* Thumbnail & Badges */}
                  <div className="relative h-28 w-full overflow-hidden bg-warm-100">
                    <img
                      src={displayImage}
                      alt={prop.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="rounded-md bg-white/95 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warm-900 shadow-warm-sm">
                        {prop.property_type}
                      </span>
                      {prop.furnishing && prop.furnishing !== 'unfurnished' && (
                        <span className="rounded-md bg-warm-900/85 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-white shadow-warm-sm">
                          {FURNISHING_LABELS[prop.furnishing] || prop.furnishing}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-3">
                    <h4 className="font-semibold text-warm-900 text-sm leading-snug line-clamp-1 mb-0.5">
                      {prop.title}
                    </h4>

                    <p className="text-warm-500 text-xs flex items-center gap-1 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      <span className="truncate">
                        {prop.locality
                          ? `${prop.locality}, ${prop.city}`
                          : `${prop.address_line || ''}, ${prop.city}`}
                      </span>
                    </p>

                    {/* Quick Specs */}
                    <div className="flex items-center justify-between py-1.5 px-2.5 bg-warm-50 rounded-lg text-xs font-medium text-warm-700 mb-3 border border-warm-100">
                      <span>
                        {prop.bedrooms} {prop.bedrooms === 1 ? 'Bed' : 'Beds'}
                      </span>
                      <span>•</span>
                      <span>
                        {prop.bathrooms} {prop.bathrooms === 1 ? 'Bath' : 'Baths'}
                      </span>
                      {prop.area_sqft && (
                        <>
                          <span>•</span>
                          <span>{prop.area_sqft} sqft</span>
                        </>
                      )}
                    </div>

                    {/* Rent & View Details Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-warm-100">
                      <div>
                        <span className="text-base font-bold text-primary-600">
                          ₹{Number(prop.rent_amount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-warm-400 font-medium">/mo</span>
                      </div>

                      <Link
                        to={`/properties/${prop.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 px-3 py-1.5 rounded-md shadow-warm-sm transition-colors"
                      >
                        View Details <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
