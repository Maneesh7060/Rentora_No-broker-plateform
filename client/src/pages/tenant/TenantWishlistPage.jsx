import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../../services/wishlistService';
import PropertyCard from '../../components/property/PropertyCard';
import ApplicationModal from '../../components/application/ApplicationModal';
import {
  Heart,
  Search,
  Trash2,
  Send,
  ArrowRight,
  Loader2,
  Building,
  MapPin,
  Bed,
  Bath,
  Maximize2,
} from 'lucide-react';

export default function TenantWishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyForApply, setSelectedPropertyForApply] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await getWishlist();
      setWishlist(res.data || []);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (propertyId, propertyTitle) => {
    try {
      await removeFromWishlist(propertyId);
      setWishlist((prev) => prev.filter((p) => p.id !== propertyId));
      setFeedback(`"${propertyTitle}" was removed from your wishlist.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-warm-500 uppercase tracking-wider mb-1">
              <Link to="/tenant/dashboard" className="hover:text-warm-700">
                Dashboard
              </Link>
              <span>/</span>
              <span>Saved Properties</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              My Saved Wishlist
            </h1>
            <p className="text-warm-600 text-sm mt-1">
              Keep track of rental properties you love and apply when you're ready.
            </p>
          </div>

          <Link to="/properties" className="btn-primary inline-flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Discover More Homes</span>
          </Link>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mb-6 p-4 rounded-xl bg-warm-100 border border-warm-200 text-warm-800 text-xs font-medium flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Wishlist Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
            <p className="text-warm-500 text-sm font-medium">Loading saved properties...</p>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="card !p-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-brick-50 text-brick-500 flex items-center justify-center mx-auto mb-4 border border-brick-100">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-warm-900">Your wishlist is empty</h3>
            <p className="text-xs text-warm-500 mt-1 max-w-sm mx-auto">
              Save properties as you browse to compare them side-by-side or apply later.
            </p>
            <Link to="/properties" className="btn-primary mt-5 inline-flex text-xs !py-2.5">
              Browse Available Rentals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-xl border border-warm-200 hover:border-warm-300 shadow-warm-sm overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-warm-100">
                    <img
                      src={
                        (Array.isArray(property.images) && property.images[0]) ||
                        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(property.id, property.title)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-brick-600 shadow-warm-sm transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-2.5 left-3 text-white">
                      <span className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                        ₹{Number(property.rent_amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-warm-200 font-medium ml-1">/ mo</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-warm-900 line-clamp-1 leading-snug">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-xs text-warm-600">
                      <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mr-1" />
                      <span className="truncate">
                        {property.locality ? `${property.locality}, ` : ''}{property.city}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-warm-100 text-xs text-warm-700 mt-2">
                      <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-warm-400" />
                        <span>{property.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-warm-400" />
                        <span>{property.bathrooms} Baths</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5 text-warm-400" />
                        <span>{property.area_sqft || '—'} sqft</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPropertyForApply(property)}
                    className="btn-primary flex-1 !py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Apply Now</span>
                  </button>

                  <Link
                    to={`/properties/${property.id}`}
                    className="btn-secondary !py-2 text-xs px-3"
                    title="View full listing details"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Application Modal */}
        {selectedPropertyForApply && (
          <ApplicationModal
            property={selectedPropertyForApply}
            isOpen={Boolean(selectedPropertyForApply)}
            onClose={() => setSelectedPropertyForApply(null)}
            onSuccess={() => {
              setFeedback(`Application submitted for ${selectedPropertyForApply.title}!`);
              setSelectedPropertyForApply(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
