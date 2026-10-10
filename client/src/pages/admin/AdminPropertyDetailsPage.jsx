import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import PropertyMap from '../../components/property/PropertyMap';
import {
  Building,
  Bed,
  Bath,
  Maximize2,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Check,
  X,
  Calendar,
} from 'lucide-react';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';

export default function AdminPropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Feedback alerts
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await adminService.getPropertyDetails(id);
      if (res?.data?.property) {
        setProperty(res.data.property);
      } else {
        setErrorMsg('Property listing could not be found.');
      }
    } catch (err) {
      console.error('Failed to load property details:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch property details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const handleApprove = async () => {
    try {
      setSubmittingAction(true);
      setErrorMsg(null);
      await adminService.verifyProperty(id, { action: 'APPROVE' });
      setSuccessMsg('Property listing has been successfully approved and published live.');
      fetchProperty();
    } catch (err) {
      console.error('Approve error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to approve listing.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      setErrorMsg(null);
      await adminService.verifyProperty(id, {
        action: 'REJECT',
        rejectionReason: rejectionReason.trim(),
      });
      setSuccessMsg('Property listing has been declined with feedback note.');
      setRejectModalOpen(false);
      fetchProperty();
    } catch (err) {
      console.error('Reject error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to reject listing.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-warm-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-warm-600 text-sm font-medium">Loading property details...</p>
      </div>
    );
  }

  if (errorMsg || !property) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-brick-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-warm-900">Listing Unavailable</h2>
        <p className="text-xs text-warm-600 mb-6">{errorMsg || 'Could not find listing.'}</p>
        <Link to="/admin/properties" className="btn-secondary inline-flex items-center gap-2 text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Properties
        </Link>
      </div>
    );
  }

  const {
    title,
    description,
    property_type,
    furnishing,
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
    verification_status,
    rejection_reason,
    verified_at,
    created_at,
    owner,
  } = property;

  const imageList = Array.isArray(images) && images.length > 0 ? images : [FALLBACK_IMAGE];
  const isVerified = verification_status === 'verified' || status === 'published';
  const isPending = verification_status === 'pending_verification' || status === 'pending';
  const isRejected = verification_status === 'rejected' || status === 'rejected';

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/admin/properties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Property Queue</span>
          </Link>
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="p-4 bg-sage-50 border border-sage-200 rounded-xl flex items-center justify-between text-xs text-sage-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-sage-600 hover:text-sage-900 font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* Verification Status & Admin Action Bar */}
        <div className="card !p-5 bg-white border-warm-200 shadow-warm-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isVerified
                  ? 'bg-sage-100 text-sage-700'
                  : isPending
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-brick-100 text-brick-700'
              }`}
            >
              {isVerified ? <CheckCircle2 className="w-5 h-5" /> : isPending ? <Clock className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-warm-900">
                  Verification Status:
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    isVerified
                      ? 'bg-sage-50 text-sage-700 border-sage-200'
                      : isPending
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-brick-50 text-brick-700 border-brick-200'
                  }`}
                >
                  {isVerified ? '✓ Verified & Published' : isPending ? 'Pending Moderation' : 'Rejected'}
                </span>
              </div>
              <p className="text-[11px] text-warm-500 mt-0.5">
                Submitted on {new Date(created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {verified_at && ` • Moderated on ${new Date(verified_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </p>
              {isRejected && rejection_reason && (
                <p className="text-xs text-brick-700 font-medium mt-1 bg-brick-50 p-2 rounded-lg border border-brick-100">
                  Reason for rejection: {rejection_reason}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!isVerified && (
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleApprove}
                className="btn-primary !bg-sage-600 hover:!bg-sage-700 !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-warm-sm"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Approve & Publish</span>
              </button>
            )}

            {!isRejected && (
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => {
                  setRejectionReason('Address details or property photos require review.');
                  setRejectModalOpen(true);
                }}
                className="btn-secondary !text-brick-600 !border-brick-200 hover:!bg-brick-50 !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isVerified ? 'Revoke Approval' : 'Reject Listing'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Property Showcase & Review Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 2 Cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Photos */}
            <div className="card !p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-800 px-2.5 py-0.5 rounded">
                  {property_type}
                </span>
                <h1 className="text-xl font-bold text-warm-900 mt-2">{title}</h1>
                <p className="text-xs text-warm-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-500" />
                  <span>{address_line}, {locality ? `${locality}, ` : ''}{city}, {state} — {zip_code}</span>
                </p>
              </div>

              {/* Photos Gallery */}
              <div className="relative h-72 sm:h-96 rounded-xl overflow-hidden bg-warm-100 border border-warm-200">
                <img
                  src={imageList[selectedImageIndex] || imageList[0]}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>

              {imageList.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imageList.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 ${
                        selectedImageIndex === idx ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Overview Specs */}
            <div className="card !p-6">
              <h3 className="font-bold text-sm text-warm-900 mb-4">Specs Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-warm-50 border border-warm-100">
                  <Bed className="w-4 h-4 text-primary-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-warm-900">{bedrooms} BHK</p>
                  <p className="text-[10px] text-warm-500">Bedrooms</p>
                </div>
                <div className="p-3 rounded-xl bg-warm-50 border border-warm-100">
                  <Bath className="w-4 h-4 text-primary-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-warm-900">{bathrooms}</p>
                  <p className="text-[10px] text-warm-500">Bathrooms</p>
                </div>
                <div className="p-3 rounded-xl bg-warm-50 border border-warm-100">
                  <Building className="w-4 h-4 text-primary-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-warm-900 capitalize">{furnishing?.replace('_', ' ') || 'Unfurnished'}</p>
                  <p className="text-[10px] text-warm-500">Furnishing</p>
                </div>
                <div className="p-3 rounded-xl bg-warm-50 border border-warm-100">
                  <Maximize2 className="w-4 h-4 text-primary-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-warm-900">{area_sqft || '—'} sqft</p>
                  <p className="text-[10px] text-warm-500">Area</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card !p-6 space-y-2">
              <h3 className="font-bold text-sm text-warm-900">About Property</h3>
              <p className="text-xs sm:text-sm text-warm-700 leading-relaxed whitespace-pre-line">
                {description || 'No description provided.'}
              </p>
            </div>

            {/* Location Map */}
            <div className="card !p-6 space-y-3">
              <h3 className="font-bold text-sm text-warm-900">Map & Coordinates</h3>
              <p className="text-xs text-warm-500">
                Latitude: {latitude || 'N/A'}, Longitude: {longitude || 'N/A'}
              </p>
              <PropertyMap
                latitude={latitude}
                longitude={longitude}
                title={title}
                address={`${address_line}, ${city}`}
                price={rent_amount}
                height="280px"
                zoom={14}
              />
            </div>
          </div>

          {/* Right Col: Pricing & Owner Profile */}
          <div className="space-y-6">
            <div className="card !p-6 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-warm-400">Pricing Verification</h3>
              <div>
                <span className="text-2xl font-bold text-warm-900">
                  ₹{Number(rent_amount).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-warm-500"> / month</span>
              </div>
              {deposit_amount > 0 && (
                <p className="text-xs text-warm-600">
                  Security Deposit: <strong>₹{Number(deposit_amount).toLocaleString('en-IN')}</strong>
                </p>
              )}
            </div>

            {/* Owner Info Card */}
            <div className="card !p-6 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-warm-400">Owner Contact Profile</h3>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-base">
                  {owner?.full_name?.[0] || 'O'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-warm-900">{owner?.full_name}</h4>
                  <p className="text-xs text-warm-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sage-600" /> Identity Registered
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-warm-100 text-xs text-warm-700">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                  <span className="truncate">{owner?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                  <span>{owner?.phone || 'No phone number provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reject Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-warm-lg border border-warm-200">
              <div className="flex items-center justify-between pb-3 border-b border-warm-100 mb-4">
                <h3 className="font-bold text-sm text-brick-700">Reject Property Listing</h3>
                <button onClick={() => setRejectModalOpen(false)} className="p-1 text-warm-400 hover:text-warm-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-warm-900 mb-1">Rejection Reason</label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this listing is being declined..."
                    className="w-full text-xs p-2.5 rounded-lg border border-warm-300 focus:border-brick-500 outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-warm-100">
                  <button type="button" onClick={() => setRejectModalOpen(false)} className="btn-secondary !py-2 !px-4 text-xs">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction || !rejectionReason.trim()}
                    className="btn-primary !bg-brick-600 hover:!bg-brick-700 !py-2 !px-4 text-xs font-bold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
