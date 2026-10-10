import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import propertyService from '../../services/propertyService';
import userService from '../../services/userService';
import { getMediaUrl } from '../../utils/mediaUtils';
import { toggleWishlist, getWishlistIds } from '../../services/wishlistService';
import { useAuth } from '../../context/AuthContext';
import PropertyMap from '../../components/property/PropertyMap';
import ApplicationModal from '../../components/application/ApplicationModal';
import ScheduleVisitModal from '../../components/visit/ScheduleVisitModal';
import {
  Bed,
  Bath,
  Maximize2,
  MapPin,
  Heart,
  Calendar,
  Send,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Share2,
  Building,
  Edit,
  Phone,
  Mail,
  Info,
  Sofa,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';

const TYPE_LABELS = {
  apartment: 'Apartment',
  house: 'Independent House',
  villa: 'Luxury Villa',
  studio: 'Studio Loft',
  commercial: 'Commercial Office Space',
};

const FURNISHING_LABELS = {
  fully_furnished: 'Fully Furnished',
  semi_furnished: 'Semi Furnished',
  unfurnished: 'Unfurnished',
};

const FALLBACK_IMAGES = {
  apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  house: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  villa: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
  studio: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  commercial: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
};

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Wishlist state
  const [isSaved, setIsSaved] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);

  // Application Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applicationSuccessAlert, setApplicationSuccessAlert] = useState(false);

  // Phase 4 Visit Modal state
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  // Phase 5 Public Owner Profile Modal state
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [loadingOwnerProfile, setLoadingOwnerProfile] = useState(false);

  const handleOpenOwnerModal = async () => {
    if (!property?.owner_id) return;
    setIsOwnerModalOpen(true);
    try {
      setLoadingOwnerProfile(true);
      const res = await userService.getPublicProfile(property.owner_id);
      if (res?.data?.user) {
        setOwnerProfile(res.data.user);
      }
    } catch (err) {
      console.error('Failed to load public owner profile:', err);
    } finally {
      setLoadingOwnerProfile(false);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await propertyService.getPropertyById(id);
        if (response && response.data?.property) {
          setProperty(response.data.property);
        } else {
          setError('Property not found.');
        }

        // Check if saved in wishlist
        if (user) {
          try {
            const resIds = await getWishlistIds();
            const ids = resIds.data || [];
            setIsSaved(ids.includes(parseInt(id, 10)));
          } catch (e) {
            // Ignore non-fatal wishlist check error
          }
        }
      } catch (err) {
        console.error('Fetch property detail error:', err);
        setError(
          err.response?.data?.message || 'Could not load property details. It may be unavailable.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id, user]);

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const nextState = !isSaved;
    setIsSaved(nextState);

    try {
      setSavingWishlist(true);
      await toggleWishlist(id);
    } catch (err) {
      setIsSaved(!nextState);
      console.error('Failed to toggle wishlist:', err);
    } finally {
      setSavingWishlist(false);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsApplyModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <p className="text-warm-500 font-medium text-sm">Loading property details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-brick-100 text-brick-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold text-warm-900 mb-2">Listing Unavailable</h2>
        <p className="text-warm-600 mb-6">{error || 'This property listing could not be found.'}</p>
        <Link to="/properties" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Properties
        </Link>
      </div>
    );
  }

  const {
    owner_id,
    title,
    description,
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
    state,
    zip_code,
    latitude,
    longitude,
    amenities = [],
    images = [],
    status,
    owner,
  } = property;

  const imageList =
    Array.isArray(images) && images.length > 0
      ? images
      : [FALLBACK_IMAGES[property_type] || FALLBACK_IMAGES.apartment];

  const parsedAmenities = Array.isArray(amenities) ? amenities : [];
  const isOwner = user && (user.id === owner_id || user.role === 'admin');

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 text-sm font-medium text-warm-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all listings
          </Link>

          <div className="flex items-center gap-2">
            {isOwner && (
              <Link
                to="/owner/properties"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3.5 py-1.5 rounded-lg transition-colors"
              >
                <Edit className="w-3.5 h-3.5" /> Manage Property
              </Link>
            )}
          </div>
        </div>

        {/* Application Success Feedback Banner */}
        {applicationSuccessAlert && (
          <div className="mb-6 p-4 bg-sage-50 border border-sage-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-sage-600 shrink-0" />
              <p className="text-sm font-medium text-sage-800">
                Your rental application has been submitted successfully! You can track its status under{' '}
                <Link to="/tenant/applications" className="underline font-bold">
                  My Applications
                </Link>
                .
              </p>
            </div>
            <button
              onClick={() => setApplicationSuccessAlert(false)}
              className="text-xs text-sage-700 hover:text-sage-900 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Rejection Warning Banner */}
        {isOwner && property.verification_status === 'rejected' && property.rejection_reason && (
          <div className="mb-6 p-4 bg-brick-50 border border-brick-200 rounded-xl flex items-start gap-3 text-xs text-brick-800 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-brick-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Listing Verification Declined</p>
              <p className="mt-1">Moderator feedback: {property.rejection_reason}</p>
              <p className="mt-1 text-brick-600">Please update the property details or documents from your listings page and resubmit for verification.</p>
            </div>
          </div>
        )}

        {/* Title & Location Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-warm-200 shadow-warm-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="uppercase text-[11px] font-semibold tracking-wider bg-primary-100 text-primary-800 px-3 py-1 rounded-md">
                  {TYPE_LABELS[property_type] || property_type}
                </span>

                {(property.verification_status === 'verified' || status === 'published') && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-md bg-sage-50 text-sage-700 border border-sage-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-sage-600" /> ✓ Verified Listing
                  </span>
                )}

                {property.verification_status === 'pending_verification' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    <Info className="w-3.5 h-3.5 text-amber-600" /> Verification Pending Review
                  </span>
                )}

                {property.verification_status === 'rejected' && isOwner && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-md bg-brick-50 text-brick-700 border border-brick-200">
                    <AlertCircle className="w-3.5 h-3.5 text-brick-600" /> Listing Rejected
                  </span>
                )}

                {furnishing && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-md bg-warm-100 text-warm-700 border border-warm-200">
                    <Sofa className="w-3.5 h-3.5" />
                    {FURNISHING_LABELS[furnishing] || furnishing}
                  </span>
                )}

                {status !== 'published' && property.verification_status !== 'pending_verification' && property.verification_status !== 'rejected' && (
                  <span className="uppercase text-xs font-semibold tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-md">
                    {status}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
                {title}
              </h1>
              <div className="flex items-center text-warm-600 text-sm mt-2">
                <MapPin className="w-4 h-4 text-primary-500 shrink-0 mr-1.5" />
                <span>
                  {address_line}, {locality ? `${locality}, ` : ''}{city}, {state} — {zip_code}
                </span>
              </div>
            </div>

            {/* Price Tag */}
            <div className="bg-warm-50 border border-warm-200 rounded-xl p-4 sm:p-5 flex lg:flex-col justify-between items-end lg:items-start shrink-0">
              <span className="text-xs font-semibold text-warm-500 uppercase tracking-wider">
                Monthly Rent
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-primary-600">
                  ₹{Number(rent_amount).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-warm-500 font-medium">/ month</span>
              </div>
              {deposit_amount > 0 && (
                <span className="text-xs text-warm-600 mt-1">
                  Security Deposit: <strong>₹{Number(deposit_amount).toLocaleString('en-IN')}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Photo Gallery Carousel */}
          <div className="space-y-3">
            <div className="relative h-[320px] sm:h-[460px] rounded-xl overflow-hidden bg-warm-100 border border-warm-200">
              <img
                src={imageList[selectedImageIndex] || imageList[0]}
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = FALLBACK_IMAGES[property_type] || FALLBACK_IMAGES.apartment;
                }}
              />
            </div>

            {/* Thumbnail selector */}
            {imageList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-primary-500 ring-2 ring-primary-100 scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Columns (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Specs Overview Card */}
            <div className="bg-white rounded-2xl p-6 border border-warm-200 shadow-warm-sm">
              <h2 className="text-base font-semibold text-warm-900 mb-4">Property Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="bg-warm-50 rounded-xl p-3.5 border border-warm-100">
                  <Bed className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-warm-900">{bedrooms} BHK</p>
                  <p className="text-xs text-warm-500">Bedrooms</p>
                </div>
                <div className="bg-warm-50 rounded-xl p-3.5 border border-warm-100">
                  <Bath className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-warm-900">{bathrooms}</p>
                  <p className="text-xs text-warm-500">Bathrooms</p>
                </div>
                <div className="bg-warm-50 rounded-xl p-3.5 border border-warm-100">
                  <Sofa className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-warm-900 truncate">
                    {FURNISHING_LABELS[furnishing] || 'Unfurnished'}
                  </p>
                  <p className="text-xs text-warm-500">Furnishing</p>
                </div>
                <div className="bg-warm-50 rounded-xl p-3.5 border border-warm-100">
                  <Maximize2 className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-warm-900">{area_sqft || '—'}</p>
                  <p className="text-xs text-warm-500">Sq. Ft Area</p>
                </div>
                <div className="bg-warm-50 rounded-xl p-3.5 border border-warm-100 col-span-2 sm:col-span-1">
                  <Building className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-warm-900 capitalize truncate">{property_type}</p>
                  <p className="text-xs text-warm-500">Type</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-warm-200 shadow-warm-sm">
              <h2 className="text-lg font-semibold text-warm-900 mb-3">About This Property</h2>
              <p className="text-warm-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {description || 'No additional description provided by the property owner.'}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-warm-200 shadow-warm-sm">
              <h2 className="text-lg font-semibold text-warm-900 mb-4">Amenities & Features</h2>
              {parsedAmenities.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {parsedAmenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-warm-50 border border-warm-100 text-warm-800 text-xs font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                      <span className="truncate">{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-warm-500">No specific amenities listed.</p>
              )}
            </div>

            {/* Map & Location */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-warm-200 shadow-warm-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-warm-900">Location & Neighborhood</h2>
                  <p className="text-xs text-warm-500">
                    {address_line}, {city}, {state} {zip_code}
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                  Interactive Map
                </span>
              </div>

              <PropertyMap
                latitude={latitude}
                longitude={longitude}
                title={title}
                address={`${address_line}, ${city}`}
                price={rent_amount}
                height="340px"
                zoom={14}
              />
            </div>
          </div>

          {/* Right Sidebar: Actions & Owner Info */}
          <div className="space-y-6">
            {/* Primary Action Card */}
            <div className="bg-white rounded-2xl p-6 border border-warm-200 shadow-warm-md sticky top-24">
              <div className="mb-6">
                <span className="text-xs font-semibold text-warm-500 uppercase tracking-wide">
                  Rental Pricing
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-warm-900">
                    ₹{Number(rent_amount).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-warm-500">/ month</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {isOwner ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-center font-medium">
                    You are the owner of this property listing.
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleApplyClick}
                      className="btn-primary w-full !py-3 flex items-center justify-center gap-2 text-sm shadow-warm-sm"
                    >
                      <Send className="w-4 h-4" />
                      Apply for Rent
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsVisitModalOpen(true)}
                      className="btn-secondary w-full !py-2.5 flex items-center justify-center gap-2 text-sm"
                    >
                      <Calendar className="w-4 h-4 text-warm-500" />
                      Schedule a Visit
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  disabled={savingWishlist}
                  className={`w-full py-2.5 px-4 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    isSaved
                      ? 'bg-brick-50 text-brick-600 border-brick-200'
                      : 'border-warm-300 text-warm-700 hover:bg-warm-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-brick-500 text-brick-500' : ''}`} />
                  {isSaved ? 'Saved in Wishlist' : 'Save to Wishlist'}
                </button>
              </div>

              {/* Owner Profile Card */}
              <div className="mt-8 pt-6 border-t border-warm-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-warm-400 block">
                    Listed By Property Owner
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenOwnerModal}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1"
                  >
                    <span>View Profile</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>

                <div
                  onClick={handleOpenOwnerModal}
                  className="flex items-center gap-3 p-3 rounded-xl bg-warm-50 hover:bg-warm-100/80 cursor-pointer border border-warm-200 transition-colors"
                  title="Click to view host profile"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-base overflow-hidden shrink-0 border border-primary-200">
                    {getMediaUrl(owner?.avatar_url) ? (
                      <img
                        src={getMediaUrl(owner.avatar_url)}
                        alt={owner.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : owner?.full_name ? (
                      owner.full_name[0]?.toUpperCase()
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-warm-900 text-sm truncate">
                      {owner?.full_name || 'Verified Owner'}
                    </h4>
                    <p className="text-xs text-sage-600 flex items-center gap-1 font-medium mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Identity Verified
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-warm-700 bg-warm-50/50 p-2.5 rounded-xl border border-warm-100">
                  {owner?.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                      <span className="truncate">{owner.email}</span>
                    </div>
                  )}
                  {owner?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                      <span>{owner.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Verified Guarantee */}
              <div className="mt-6 p-3.5 rounded-xl bg-sage-50/80 border border-sage-100 text-sage-800 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Rentora Protection:</strong> All property documents and owner identities are verified before listing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <ApplicationModal
        property={property}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => setApplicationSuccessAlert(true)}
      />

      {/* Schedule Visit Modal */}
      <ScheduleVisitModal
        property={property}
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
      />

      {/* Public Owner Profile Modal */}
      {isOwnerModalOpen && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-warm-lg border border-warm-200 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-warm-100 mb-4">
              <h3 className="font-bold text-sm text-warm-900">Landlord & Host Profile</h3>
              <button
                type="button"
                onClick={() => setIsOwnerModalOpen(false)}
                className="p-1 text-warm-400 hover:text-warm-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingOwnerProfile ? (
              <div className="py-12 text-center text-xs text-warm-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                <span>Loading owner details...</span>
              </div>
            ) : ownerProfile ? (
              <div className="space-y-5">
                {/* Host Hero */}
                <div className="flex items-center gap-4 bg-warm-50 p-4 rounded-xl border border-warm-200">
                  <div className="w-16 h-16 rounded-2xl bg-warm-200 border-2 border-white shadow-warm-sm flex items-center justify-center font-bold text-warm-800 text-xl overflow-hidden shrink-0">
                    {getMediaUrl(ownerProfile.avatar_url) ? (
                      <img
                        src={getMediaUrl(ownerProfile.avatar_url)}
                        alt={ownerProfile.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      ownerProfile.full_name?.charAt(0)?.toUpperCase() || 'O'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-warm-900 text-lg">{ownerProfile.full_name}</h4>
                      <span className="text-[10px] font-bold text-sage-700 bg-sage-50 border border-sage-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified Host
                      </span>
                    </div>
                    <p className="text-xs text-warm-500 mt-0.5">
                      {[ownerProfile.city, ownerProfile.state].filter(Boolean).join(', ') || 'India'}
                    </p>
                    <p className="text-[11px] text-warm-400 mt-1">
                      Member on Rentora since {new Date(ownerProfile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h5 className="text-xs font-bold text-warm-900 uppercase tracking-wide mb-1">About the Host</h5>
                  <p className="text-xs text-warm-700 leading-relaxed bg-white p-3 rounded-xl border border-warm-200 whitespace-pre-wrap">
                    {ownerProfile.bio || 'This owner has not added a detailed biography yet.'}
                  </p>
                </div>

                {/* Portfolio Summary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold text-warm-900 uppercase tracking-wide">
                      Active Listings ({ownerProfile.properties_count || 0})
                    </h5>
                  </div>

                  {Array.isArray(ownerProfile.properties) && ownerProfile.properties.length > 0 ? (
                    <div className="space-y-2">
                      {ownerProfile.properties.map((p) => (
                        <Link
                          key={p.id}
                          to={`/properties/${p.id}`}
                          onClick={() => setIsOwnerModalOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-warm-200 hover:border-primary-300 hover:bg-warm-50/50 transition-colors group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-xs text-warm-900 group-hover:text-primary-600 truncate">
                              {p.title}
                            </p>
                            <p className="text-[10px] text-warm-500">
                              {p.bedrooms} BHK • {p.locality || p.city}
                            </p>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-2">
                            <span className="font-bold text-xs text-warm-900">
                              ₹{Number(p.rent_amount).toLocaleString('en-IN')}
                              <span className="text-[9px] font-normal text-warm-400">/mo</span>
                            </span>
                            <ExternalLink className="w-3 h-3 text-warm-400 group-hover:text-primary-600" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-warm-500">No other public listings available.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-warm-500 text-center py-6">Could not load owner profile.</p>
            )}

            <div className="mt-6 pt-3 border-t border-warm-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOwnerModalOpen(false)}
                className="btn-secondary !py-2 !px-4 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
