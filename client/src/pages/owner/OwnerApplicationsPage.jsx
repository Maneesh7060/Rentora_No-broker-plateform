import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReceivedApplications, updateApplicationStatus } from '../../services/applicationService';
import propertyService from '../../services/propertyService';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  Loader2,
  Filter,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'all', label: 'All Applications' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { label: 'Approved', bg: 'bg-sage-50', text: 'text-sage-700', border: 'border-sage-200' },
  rejected: { label: 'Rejected', bg: 'bg-brick-50', text: 'text-brick-700', border: 'border-brick-200' },
  withdrawn: { label: 'Withdrawn by Tenant', bg: 'bg-warm-100', text: 'text-warm-700', border: 'border-warm-200' },
};

export default function OwnerApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [ownerProperties, setOwnerProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewApp, setReviewApp] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, propsRes] = await Promise.all([
        getReceivedApplications({
          status: activeTab !== 'all' ? activeTab : undefined,
          propertyId: selectedPropertyId || undefined,
        }),
        propertyService.getMyProperties(),
      ]);

      setApplications(appsRes.data || []);
      setOwnerProperties(propsRes.data?.properties || []);
    } catch (err) {
      console.error('Failed to load owner applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedPropertyId]);

  const handleDecision = async (status) => {
    if (!reviewApp) return;
    try {
      setIsDeciding(true);
      await updateApplicationStatus(reviewApp.id, status, decisionNotes);
      setFeedback({
        type: 'success',
        message: `Application for ${reviewApp.applicant_name} marked as ${status}.`,
      });
      setReviewApp(null);
      setDecisionNotes('');
      fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update application status.',
      });
    } finally {
      setIsDeciding(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-warm-500 uppercase tracking-wider mb-1">
              <Link to="/owner/dashboard" className="hover:text-warm-700">
                Owner Dashboard
              </Link>
              <span>/</span>
              <span>Applications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Tenant Rental Applications
            </h1>
            <p className="text-warm-600 text-sm mt-1">
              Review applicant financials, move-in preferences, and approve or decline incoming rental requests.
            </p>
          </div>

          <Link to="/owner/properties" className="btn-secondary inline-flex items-center gap-2">
            <Building className="w-4 h-4 text-warm-500" />
            <span>Manage My Listings</span>
          </Link>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm ${
              feedback.type === 'success'
                ? 'bg-sage-50 border-sage-200 text-sage-800'
                : 'bg-brick-50 border-brick-200 text-brick-800'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="font-bold underline text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Controls Row: Status Tabs + Property Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-warm-200">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-warm-900 text-white shadow-warm-sm'
                    : 'bg-white text-warm-600 hover:bg-warm-100 hover:text-warm-900 border border-warm-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Property Dropdown Filter */}
          {ownerProperties.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-warm-600 whitespace-nowrap">Filter by listing:</span>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="select-field !py-1.5 !text-xs max-w-xs"
              >
                <option value="">All My Properties</option>
                {ownerProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
            <p className="text-warm-500 text-sm font-medium">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="card !p-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-warm-100 text-warm-400 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-warm-900">
              No applications found
            </h3>
            <p className="text-xs text-warm-500 mt-1 max-w-sm mx-auto">
              When prospective tenants apply to rent your properties, their complete submission will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
              const images = Array.isArray(app.property_images) ? app.property_images : [];
              const thumbnail =
                images[0] ||
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

              return (
                <div
                  key={app.id}
                  className="card !p-6 hover:border-warm-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left: Applicant details & property */}
                  <div className="flex-1 space-y-4">
                    {/* Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          {statusConf.label}
                        </span>
                        <span className="text-xs text-warm-500">
                          Received{' '}
                          {new Date(app.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md">
                        Listing: {app.property_title}
                      </span>
                    </div>

                    {/* Applicant details */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-warm-200 text-warm-800 flex items-center justify-center font-bold text-sm shrink-0">
                        {app.applicant_name ? app.applicant_name[0] : <User className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-warm-900 leading-snug">
                          {app.applicant_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-warm-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-warm-400" />
                            {app.email}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-warm-400" />
                            {app.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Applicant Profile Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-warm-50 rounded-xl border border-warm-100 text-xs">
                      <div>
                        <span className="text-warm-500 block text-[10px] uppercase font-semibold">Monthly Income</span>
                        <strong className="text-warm-900 text-xs font-bold">
                          ₹{Number(app.monthly_income).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-warm-500 block text-[10px] uppercase font-semibold">Employment</span>
                        <strong className="text-warm-900 text-xs font-bold capitalize">
                          {app.employment_status?.replace('_', ' ')}
                        </strong>
                        {app.occupation && (
                          <span className="text-[11px] text-warm-600 truncate block">{app.occupation}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-warm-500 block text-[10px] uppercase font-semibold">Occupants</span>
                        <strong className="text-warm-900 text-xs font-bold">{app.occupants} Person(s)</strong>
                      </div>
                      <div>
                        <span className="text-warm-500 block text-[10px] uppercase font-semibold">Move-In Date</span>
                        <strong className="text-warm-900 text-xs font-bold">
                          {new Date(app.move_in_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                    </div>

                    {/* Personal note if any */}
                    {app.message && (
                      <p className="text-xs text-warm-700 bg-white p-3 rounded-lg border border-warm-100 italic">
                        &ldquo;{app.message}&rdquo;
                      </p>
                    )}

                    {app.owner_notes && (
                      <div className="text-xs text-warm-700 bg-warm-100 p-2.5 rounded-lg">
                        <strong className="text-warm-900">Your Note:</strong> {app.owner_notes}
                      </div>
                    )}
                  </div>

                  {/* Right: Decision Actions */}
                  <div className="lg:w-48 shrink-0 flex flex-col justify-center gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-warm-100">
                    {app.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewApp(app);
                            setDecisionNotes('');
                          }}
                          className="btn-primary w-full !py-2.5 text-xs flex items-center justify-center gap-1.5"
                        >
                          <span>Review & Decide</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewApp(app);
                          setDecisionNotes(app.owner_notes || '');
                        }}
                        className="btn-secondary w-full !py-2 text-xs"
                      >
                        Change Status
                      </button>
                    )}

                    <Link
                      to={`/properties/${app.property_id}`}
                      className="text-xs text-center text-warm-500 hover:text-warm-800 py-1"
                    >
                      View Property
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Review & Decision Modal */}
        {reviewApp && (
          <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-warm-lg border border-warm-200">
              <div className="flex items-center justify-between border-b border-warm-100 pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-warm-900">Application Decision</h3>
                  <p className="text-xs text-warm-600 mt-0.5">
                    For {reviewApp.applicant_name} ({reviewApp.property_title})
                  </p>
                </div>
                <button
                  onClick={() => setReviewApp(null)}
                  className="text-warm-400 hover:text-warm-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                    Owner Note / Feedback (Optional)
                  </label>
                  <textarea
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="e.g. Approved. Please bring ID proofs for agreement signing on Saturday."
                  />
                  <p className="text-[11px] text-warm-400 mt-1">
                    This note will be visible to the tenant in their dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-warm-100">
                  <button
                    type="button"
                    onClick={() => handleDecision('rejected')}
                    disabled={isDeciding}
                    className="py-2.5 px-4 rounded-lg border border-brick-300 text-brick-700 hover:bg-brick-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Decline Application</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision('approved')}
                    disabled={isDeciding}
                    className="py-2.5 px-4 rounded-lg bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-warm-sm"
                  >
                    {isDeciding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Approve Application</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
