import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import visitService from '../../services/visitService';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Loader2,
  User,
  Phone,
  Mail,
  ShieldCheck,
  MessageSquare,
  FileText,
  AlertTriangle,
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Owner Review',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
    bannerDesc: 'The property owner has received your request and will confirm your appointment shortly.',
  },
  APPROVED: {
    label: 'Visit Confirmed 🎉',
    bg: 'bg-sage-50',
    text: 'text-sage-800',
    border: 'border-sage-200',
    icon: CheckCircle2,
    bannerDesc: 'Your visit has been approved by the owner. Please arrive at the scheduled time.',
  },
  REJECTED: {
    label: 'Visit Request Declined',
    bg: 'bg-brick-50',
    text: 'text-brick-800',
    border: 'border-brick-200',
    icon: XCircle,
    bannerDesc: 'The owner was unable to accommodate this time slot. You can select another available slot.',
  },
  CANCELLED: {
    label: 'Visit Cancelled',
    bg: 'bg-warm-100',
    text: 'text-warm-800',
    border: 'border-warm-200',
    icon: AlertCircle,
    bannerDesc: 'This visit request was cancelled.',
  },
  COMPLETED: {
    label: 'Tour Completed',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: CheckCircle2,
    bannerDesc: 'This property tour has concluded. Ready to submit a rental application?',
  },
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

export default function TenantVisitDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchVisitDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await visitService.getVisitDetails(id);
      if (res?.data?.visit) {
        setVisit(res.data.visit);
      } else {
        setError('Visit request not found.');
      }
    } catch (err) {
      console.error('Failed to load visit details:', err);
      setError(err.response?.data?.message || 'Unable to retrieve visit details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVisitDetails();
    }
  }, [id]);

  const handleCancelVisit = async () => {
    setCancelling(true);
    try {
      await visitService.cancelVisit(id);
      setShowCancelModal(false);
      fetchVisitDetails();
    } catch (err) {
      console.error('Cancel visit error:', err);
      alert(err.response?.data?.message || 'Failed to cancel visit request.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-warm-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-warm-600 text-sm font-medium">Loading visit details...</p>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="min-h-screen bg-warm-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-warm-200 p-8 text-center shadow-warm-sm">
          <AlertCircle className="w-10 h-10 text-brick-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-warm-900 mb-1">Visit Request Error</h2>
          <p className="text-xs text-warm-500 mb-6">{error || 'Visit request not found.'}</p>
          <Link to="/tenant/visits" className="btn-primary !py-2 !px-4 text-xs inline-flex items-center gap-1.5">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to My Visits
          </Link>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[visit.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;
  const img = visit.property_images && visit.property_images[0] ? visit.property_images[0] : FALLBACK_IMAGE;
  const formattedDate = new Date(visit.visit_date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to="/tenant/visits"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Visits</span>
        </Link>

        {/* Status Banner */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${statusCfg.bg} ${statusCfg.border} mb-6 flex items-start gap-3.5`}>
          <StatusIcon className={`w-6 h-6 ${statusCfg.text} shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`font-bold text-sm sm:text-base ${statusCfg.text}`}>
                {statusCfg.label}
              </h2>
              <span className="text-[11px] text-warm-500">
                (Visit ID #{visit.id})
              </span>
            </div>
            <p className="text-xs text-warm-700 mt-1 leading-relaxed">
              {statusCfg.bannerDesc}
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Property & Schedule Info (2 Cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Property Summary Card */}
            <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-warm-sm">
              <div className="relative h-48 sm:h-56 w-full bg-warm-100">
                <img src={img} alt={visit.property_title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-warm-900 shadow-warm-sm">
                  ₹{Number(visit.property_rent).toLocaleString('en-IN')}/month
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-base sm:text-lg text-warm-900 leading-snug mb-1">
                  <Link to={`/properties/${visit.property_id}`} className="hover:text-primary-600 transition-colors">
                    {visit.property_title}
                  </Link>
                </h3>

                <p className="text-xs text-warm-500 flex items-center gap-1 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                  <span>
                    {visit.property_address ? `${visit.property_address}, ` : ''}
                    {visit.property_locality ? `${visit.property_locality}, ` : ''}
                    {visit.property_city}
                  </span>
                </p>

                <div className="pt-4 border-t border-warm-100 flex items-center justify-between text-xs">
                  <Link
                    to={`/properties/${visit.property_id}`}
                    className="text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1"
                  >
                    <span>View Property Listing</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <span className="text-warm-400">•</span>
                    <span className="text-warm-700 font-medium">
                      {visit.bedrooms} BHK Flat
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visit Details & Notes */}
            <div className="bg-white rounded-2xl border border-warm-200 p-5 shadow-warm-sm space-y-4">
              <h4 className="font-bold text-sm text-warm-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                <span>Visit Schedule & Notes</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-warm-50 border border-warm-100">
                  <span className="text-warm-400 block text-[11px] mb-0.5">Date</span>
                  <span className="font-bold text-warm-900">{formattedDate}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-primary-50/60 border border-primary-100">
                  <span className="text-primary-600 block text-[11px] mb-0.5">Time Window</span>
                  <span className="font-bold text-primary-900">
                    {visit.start_time.substring(0, 5)} - {visit.end_time.substring(0, 5)} (30 mins)
                  </span>
                </div>
              </div>

              {visit.tenant_message && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-warm-700 block mb-1">Your Message:</span>
                  <p className="text-xs text-warm-600 bg-warm-50 p-3 rounded-xl border border-warm-100 italic">
                    "{visit.tenant_message}"
                  </p>
                </div>
              )}

              {visit.owner_notes && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-warm-700 block mb-1">Owner Notes / Instructions:</span>
                  <p className="text-xs text-warm-800 bg-sage-50/80 p-3 rounded-xl border border-sage-100">
                    {visit.owner_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Owner Profile & Actions (1 Col) */}
          <div className="space-y-6">
            {/* Owner Info Card */}
            <div className="bg-white rounded-2xl border border-warm-200 p-5 shadow-warm-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-warm-400 block mb-3">
                Property Owner
              </span>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                  {visit.owner_name ? visit.owner_name[0] : <User className="w-6 h-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-warm-900 truncate">
                    {visit.owner_name || 'Verified Owner'}
                  </h4>
                  <p className="text-xs text-sage-600 flex items-center gap-1 font-medium mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Identity Verified
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-warm-700 bg-warm-50 p-3 rounded-xl border border-warm-100">
                {visit.owner_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                    <span className="font-semibold">{visit.owner_phone}</span>
                  </div>
                )}
                {visit.owner_email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                    <span className="truncate">{visit.owner_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-2xl border border-warm-200 p-5 shadow-warm-sm space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-warm-400">
                Actions
              </h4>

              {visit.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-brick-300 text-brick-700 hover:bg-brick-50 font-bold text-xs transition-colors"
                >
                  Cancel Visit Request
                </button>
              )}

              {visit.status === 'APPROVED' && (
                <Link
                  to={`/properties/${visit.property_id}`}
                  className="btn-primary w-full !py-2.5 text-xs text-center block"
                >
                  Apply for this Property
                </Link>
              )}

              {visit.status === 'REJECTED' && (
                <Link
                  to={`/properties/${visit.property_id}`}
                  className="btn-primary w-full !py-2.5 text-xs text-center block"
                >
                  Reschedule for Another Time
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-warm-lg border border-warm-200 text-center">
            <div className="w-12 h-12 rounded-xl bg-brick-100 text-brick-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-warm-900 mb-1">Cancel Visit Request?</h3>
            <p className="text-xs text-warm-500 mb-6 leading-relaxed">
              Are you sure you want to cancel your scheduled tour for "{visit.property_title}"?
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="btn-secondary flex-1 !py-2.5 text-xs font-semibold"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleCancelVisit}
                disabled={cancelling}
                className="btn-primary bg-brick-600 hover:bg-brick-700 flex-1 !py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
