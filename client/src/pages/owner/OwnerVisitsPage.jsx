import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import visitService from '../../services/visitService';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Settings,
  MessageSquare,
  FileText,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';

const STATUS_BADGES = {
  PENDING: { label: 'Pending Action', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  APPROVED: { label: 'Confirmed', bg: 'bg-sage-50', text: 'text-sage-700', border: 'border-sage-200' },
  REJECTED: { label: 'Declined', bg: 'bg-brick-50', text: 'text-brick-700', border: 'border-brick-200' },
  CANCELLED: { label: 'Tenant Cancelled', bg: 'bg-warm-100', text: 'text-warm-700', border: 'border-warm-200' },
  COMPLETED: { label: 'Tour Completed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

export default function OwnerVisitsPage() {
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, completed: 0, rejected: 0, upcoming: 0 });
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'completed' | 'rejected'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review Modal state
  const [selectedVisitForReview, setSelectedVisitForReview] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVED' | 'REJECTED'
  const [ownerNotes, setOwnerNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchReceivedVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await visitService.getReceivedVisits({
        status: activeTab === 'all' ? undefined : activeTab,
      });

      if (res?.data) {
        setVisits(res.data.visits || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load owner visits:', err);
      setError('Unable to load received visits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivedVisits();
  }, [activeTab]);

  const handleOpenReview = (visit, type) => {
    setSelectedVisitForReview(visit);
    setActionType(type);
    setOwnerNotes(type === 'APPROVED' ? 'Looking forward to meeting you at the property.' : '');
  };

  const handleConfirmAction = async () => {
    if (!selectedVisitForReview || !actionType) return;
    setSubmittingAction(true);

    try {
      await visitService.updateVisitStatus(selectedVisitForReview.id, {
        status: actionType,
        ownerNotes: ownerNotes.trim(),
      });

      setSelectedVisitForReview(null);
      setActionType(null);
      fetchReceivedVisits();
    } catch (err) {
      console.error('Failed to update visit status:', err);
      alert(err.response?.data?.message || 'Failed to update visit status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Property Visit Requests
            </h1>
            <p className="text-warm-600 text-xs sm:text-sm mt-1">
              Review and manage upcoming in-person tour appointments for your listed properties.
            </p>
          </div>

          <Link
            to="/owner/visit-availability"
            className="btn-secondary inline-flex items-center gap-2 self-start sm:self-auto text-xs font-semibold shadow-warm-sm bg-white hover:bg-warm-100"
          >
            <Settings className="w-4 h-4 text-primary-600" />
            <span>Configure Availability Schedule</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-warm-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-warm-900">{stats.total || 0}</p>
              <p className="text-xs text-warm-500 font-medium">Total Inquiries</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-warm-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-warm-900">{stats.pending || 0}</p>
              <p className="text-xs text-warm-500 font-medium">Pending Action</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-warm-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-sage-100 text-sage-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-warm-900">{stats.approved || 0}</p>
              <p className="text-xs text-warm-500 font-medium">Confirmed Upcoming</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-warm-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-warm-900">{stats.completed || 0}</p>
              <p className="text-xs text-warm-500 font-medium">Completed Tours</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 border-b border-warm-200 pb-3 mb-6 overflow-x-auto scrollbar-thin">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: 'Pending Action' },
            { id: 'approved', label: 'Confirmed' },
            { id: 'completed', label: 'Completed' },
            { id: 'rejected', label: 'Declined' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-warm-sm'
                  : 'bg-white text-warm-700 border border-warm-200 hover:bg-warm-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List Content */}
        {loading ? (
          <div className="py-16 text-center text-xs text-warm-500 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-warm-200">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span>Loading visit requests...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center bg-brick-50 border border-brick-200 rounded-2xl p-6 max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-brick-600 mx-auto mb-2" />
            <p className="text-xs text-brick-800 font-bold mb-3">{error}</p>
            <button onClick={fetchReceivedVisits} className="btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-warm-200 p-12 text-center max-w-lg mx-auto shadow-warm-sm">
            <div className="w-14 h-14 rounded-2xl bg-warm-100 text-warm-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-warm-900 mb-1">No visit requests received</h3>
            <p className="text-xs text-warm-500 mb-6 max-w-sm mx-auto leading-relaxed">
              {activeTab === 'all'
                ? 'When prospective tenants request in-person property tours, they will appear here for your review and approval.'
                : `No visit requests matching the "${activeTab}" filter.`}
            </p>
            <Link
              to="/owner/visit-availability"
              className="btn-secondary !py-2 !px-4 text-xs inline-flex items-center gap-1.5 shadow-warm-sm"
            >
              <Settings className="w-3.5 h-3.5 text-primary-600" />
              <span>Verify Availability Schedule</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => {
              const statusCfg = STATUS_BADGES[visit.status] || STATUS_BADGES.PENDING;
              const img = visit.property_images && visit.property_images[0] ? visit.property_images[0] : FALLBACK_IMAGE;
              const formattedDate = new Date(visit.visit_date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={visit.id}
                  className="bg-white rounded-2xl border border-warm-200 p-4 sm:p-5 shadow-warm-sm hover:shadow-warm-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Property & Tenant Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <img
                      src={img}
                      alt={visit.property_title}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-warm-200"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                          {statusCfg.label}
                        </span>
                        <span className="text-[11px] text-warm-400 font-medium">
                          Request #{visit.id}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-warm-900 leading-snug line-clamp-1">
                        <Link to={`/properties/${visit.property_id}`} className="hover:text-primary-600 transition-colors">
                          {visit.property_title}
                        </Link>
                      </h3>

                      <p className="text-xs text-warm-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="truncate">
                          {visit.property_locality ? `${visit.property_locality}, ` : ''}{visit.property_city}
                        </span>
                      </p>

                      {/* Scheduled Tour Time */}
                      <div className="mt-2.5 flex items-center gap-3 text-xs flex-wrap">
                        <div className="flex items-center gap-1.5 font-semibold text-warm-800 bg-warm-50 px-2.5 py-1 rounded-lg border border-warm-100">
                          <Calendar className="w-3.5 h-3.5 text-primary-600" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100">
                          <Clock className="w-3.5 h-3.5 text-primary-600" />
                          <span>{visit.start_time.substring(0, 5)} - {visit.end_time.substring(0, 5)}</span>
                        </div>
                      </div>

                      {/* Tenant Message */}
                      {visit.tenant_message && (
                        <p className="mt-2.5 text-xs text-warm-600 bg-warm-50 p-2.5 rounded-lg border border-warm-100 italic">
                          "{visit.tenant_message}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Tenant Contact Card */}
                  <div className="bg-warm-50 p-3.5 rounded-xl border border-warm-100 text-xs text-warm-700 min-w-[200px] shrink-0 space-y-1.5">
                    <div className="flex items-center gap-2 mb-2 font-bold text-warm-900">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[11px]">
                        {visit.tenant_name ? visit.tenant_name[0] : <User className="w-3 h-3" />}
                      </div>
                      <span className="truncate">{visit.tenant_name}</span>
                    </div>

                    {visit.tenant_phone && (
                      <div className="flex items-center gap-1.5 text-warm-600">
                        <Phone className="w-3 h-3 text-warm-400 shrink-0" />
                        <span className="font-semibold">{visit.tenant_phone}</span>
                      </div>
                    )}

                    {visit.tenant_email && (
                      <div className="flex items-center gap-1.5 text-warm-600 truncate">
                        <Mail className="w-3 h-3 text-warm-400 shrink-0" />
                        <span className="truncate">{visit.tenant_email}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-warm-100">
                    {visit.status === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(visit, 'APPROVED')}
                          className="btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5 bg-sage-600 hover:bg-sage-700 shadow-warm-sm flex-1 lg:flex-initial lg:w-full justify-center"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Visit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReview(visit, 'REJECTED')}
                          className="py-2 px-3.5 rounded-xl border border-brick-200 text-brick-700 hover:bg-brick-50 font-bold text-xs transition-colors flex-1 lg:flex-initial lg:w-full text-center"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs text-warm-400 block font-medium">Status Updated</span>
                        <span className="text-xs font-bold text-warm-700">{statusCfg.label}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal (Approve or Reject with Notes) */}
      {selectedVisitForReview && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-warm-lg border border-warm-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-warm-100 mb-4">
              <h3 className="font-bold text-base text-warm-900 flex items-center gap-2">
                {actionType === 'APPROVED' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-sage-600" />
                    <span>Confirm Property Visit</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-brick-600" />
                    <span>Decline Visit Request</span>
                  </>
                )}
              </h3>

              <button
                onClick={() => setSelectedVisitForReview(null)}
                className="p-1 text-warm-400 hover:text-warm-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-warm-600 mb-4 leading-relaxed">
              {actionType === 'APPROVED'
                ? `You are confirming the visit for ${selectedVisitForReview.tenant_name} on ${new Date(selectedVisitForReview.visit_date).toLocaleDateString('en-IN')} (${selectedVisitForReview.start_time.substring(0, 5)}). The tenant will be notified immediately.`
                : `You are declining the visit request for ${selectedVisitForReview.tenant_name}. You can optionally include a note with reason or alternative suggestions.`}
            </p>

            <div className="mb-5">
              <label className="font-bold text-xs text-warm-800 block mb-1.5">
                Note for Tenant (Optional)
              </label>
              <textarea
                rows={3}
                value={ownerNotes}
                onChange={(e) => setOwnerNotes(e.target.value)}
                placeholder={
                  actionType === 'APPROVED'
                    ? 'e.g. Please ring bell #402 at the main gate upon arrival.'
                    : 'e.g. Currently unavailable at this hour. Please select an afternoon slot.'
                }
                className="w-full text-xs p-3 rounded-xl border border-warm-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none bg-white"
                maxLength={250}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
              <button
                type="button"
                onClick={() => setSelectedVisitForReview(null)}
                disabled={submittingAction}
                className="btn-secondary !py-2 !px-4 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={submittingAction}
                className={`btn-primary !py-2 !px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-warm-sm ${
                  actionType === 'APPROVED'
                    ? 'bg-sage-600 hover:bg-sage-700'
                    : 'bg-brick-600 hover:bg-brick-700'
                }`}
              >
                {submittingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : actionType === 'APPROVED' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Notify Tenant</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Decline Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
