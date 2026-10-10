import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bed,
  Bath,
  Maximize2,
  MapPin,
  ArrowRight,
  Heart,
  ShieldCheck,
  Sofa,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toggleWishlist } from '../../services/wishlistService';

const TYPE_LABELS = {
  apartment: 'Apartment',
  house: 'House',
  villa: 'Villa',
  studio: 'Studio',
  commercial: 'Commercial',
};

const FURNISHING_LABELS = {
  fully_furnished: 'Fully Furnished',
  semi_furnished: 'Semi Furnished',
  unfurnished: 'Unfurnished',
};

const FALLBACK_IMAGES = {
  apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  house: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
  villa: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
  studio: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  commercial: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
};

export default function PropertyCard({
  property,
  onHover,
  isSelected = false,
  isWishlisted = false,
  onWishlistChange,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(isWishlisted);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSaved(isWishlisted);
  }, [isWishlisted]);

  const {
    id,
    title,
    property_type,
    furnishing = 'unfurnished',
    rent_amount,
    deposit_amount,
    bedrooms,
    bathrooms,
    area_sqft,
    address_line,
    locality,
    city,
    images = [],
    distance_km,
  } = property;

  const displayImage =
    images && images.length > 0 && images[0]
      ? images[0]
      : FALLBACK_IMAGES[property_type] || FALLBACK_IMAGES.apartment;

  const locationDisplay = locality ? `${locality}, ${city}` : `${address_line || ''}, ${city}`;

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    const nextState = !saved;
    setSaved(nextState);
    if (onWishlistChange) onWishlistChange(id, nextState);

    try {
      setSaving(true);
      await toggleWishlist(id);
    } catch (err) {
      // Revert on error
      setSaved(!nextState);
      if (onWishlistChange) onWishlistChange(id, !nextState);
      console.error('Failed to toggle wishlist:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onMouseEnter={() => onHover && onHover(property)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`bg-white rounded-xl overflow-hidden border transition-all duration-200 flex flex-col group ${
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-100 shadow-warm-md'
          : 'border-warm-200 hover:border-warm-300 hover:shadow-warm-md'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-warm-100">
        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = FALLBACK_IMAGES[property_type] || FALLBACK_IMAGES.apartment;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-warm-950/80 via-warm-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide bg-white/95 text-warm-900 shadow-warm-sm">
            {TYPE_LABELS[property_type] || property_type}
          </span>
          {furnishing && furnishing !== 'unfurnished' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-warm-900/80 text-white backdrop-blur-sm shadow-warm-sm">
              <Sofa className="w-3 h-3 mr-1" />
              {FURNISHING_LABELS[furnishing] || furnishing}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={saving}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white flex items-center justify-center text-warm-600 hover:text-brick-600 shadow-warm-sm transition-all focus:outline-none"
          title={saved ? 'Remove from Saved' : 'Save Property'}
          aria-label={saved ? 'Remove from Saved' : 'Save Property'}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              saved ? 'fill-brick-500 text-brick-500' : ''
            }`}
          />
        </button>

        {/* Rent Tag on image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white">
          <div>
            <span className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
              ₹{Number(rent_amount).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-warm-200 font-medium ml-1">/ month</span>
          </div>
          {distance_km && (
            <span className="text-[11px] font-medium bg-primary-600/95 text-white px-2 py-0.5 rounded backdrop-blur">
              {distance_km} km away
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-4.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-semibold text-warm-900 text-[15px] leading-snug line-clamp-1 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center text-warm-600 text-xs mt-1 mb-3">
            <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mr-1" />
            <span className="truncate">{locationDisplay}</span>
          </div>

          {/* Specs Row */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-warm-100 text-warm-700 text-xs">
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-warm-400 shrink-0" />
              <span>
                <strong className="text-warm-900 font-semibold">{bedrooms}</strong> {bedrooms === 1 ? 'Bed' : 'Beds'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-warm-400 shrink-0" />
              <span>
                <strong className="text-warm-900 font-semibold">{bathrooms}</strong> {bathrooms === 1 ? 'Bath' : 'Baths'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-warm-400 shrink-0" />
              <span>
                <strong className="text-warm-900 font-semibold">{area_sqft || '—'}</strong> sq.ft
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 mt-1 flex items-center justify-between">
          {(property.verification_status === 'verified' || property.status === 'published' || property.is_verified) ? (
            <span className="text-[11px] text-sage-700 font-bold flex items-center gap-1 bg-sage-50 px-2 py-0.5 rounded border border-sage-200">
              <ShieldCheck className="w-3.5 h-3.5 text-sage-600" /> ✓ Verified
            </span>
          ) : (
            <span className="text-[11px] text-warm-500 font-medium capitalize">
              {property.furnishing?.replace('_', ' ') || 'Standard'}
            </span>
          )}

          <Link
            to={`/properties/${id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2.5 py-1.5 rounded-md transition-colors ml-auto"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
