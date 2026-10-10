import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyApplications, withdrawApplication } from '../../services/applicationService';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  Building,
  MapPin,
  Calendar,
  AlertTriangle,
  Loader2,
  DollarSign,
  User,
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'all', label: 'All Applications' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Not Approved' },
  { key: 'withdrawn', label: 'Withdrawn' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { label: 'Approved', bg: 'bg-sage-50', text: 'text-sage-700', border: 'border-sage-200' },
  rejected: { label: 'Not Approved', bg: 'bg-brick-50', text: 'text-brick-700', border: 'border-brick-200' },
  withdrawn: { label: 'Withdrawn', bg: 'bg-warm-100', text: 'text-warm-700', border: 'border-warm-200' },
};

export default function TenantApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await getMyApplications({ status: activeTab !== 'all' ? activeTab : undefined });
      setApplications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const handleWithdrawConfirm = async () => {
    if (!withdrawTarget) return;
    try {
      setWithdrawing(true);
      await withdrawApplication(withdrawTarget.id);
      setFeedback({ type: 'success', message: 'Application withdrawn successfully.' });
      setWithdrawTarget(null);
      fetchApplications();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to withdraw application.',
      });
    } finally {
      setWithdrawing(false);
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
              <span>Applications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              My Rental Applications
            </h1>
            <p className="text-warm-600 text-sm mt-1">
              Review and track the progress of all applications submitted to property owners.
            </p>
          </div>

          <Link to="/properties" className="btn-primary inline-flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Find More Rentals</span>
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

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-warm-200">
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

        {/* Applications List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
            <p className="text-warm-500 text-sm font-medium">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="card !p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-warm-100 text-warm-400 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-warm-900">
              No {activeTab !== 'all' ? activeTab : ''} applications found
            </h3>
            <p className="text-xs text-warm-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'all'
                ? "You haven't submitted any rental applications yet. Explore available listings and apply directly."
                : `You currently have no applications with status '${activeTab}'.`}
            </p>
            <Link to="/properties" className="btn-primary mt-5 inline-flex text-xs !py-2.5">
              Explore Properties
            </Link>
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
                  className="card !p-5 hover:border-warm-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Property Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={thumbnail}
                      alt={app.property_title}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-warm-100 border border-warm-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          {statusConf.label}
                        </span>
                        <span className="text-xs text-warm-500">
                          Applied on{' '}
                          {new Date(app.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <Link
                        to={`/tenant/applications/${app.id}`}
                        className="text-base font-semibold text-warm-900 hover:text-primary-600 transition-colors line-clamp-1"
                      >
                        {app.property_title}
                      </Link>

                      <div className="flex items-center text-xs text-warm-600 mt-1 gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="truncate">
                          {app.locality ? `${app.locality}, ` : ''}{app.city}
                        </span>
                      </div>

                      {/* Specs summary */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-warm-600 mt-2.5 pt-2 border-t border-warm-100">
                        <span>
                          Rent: <strong className="text-warm-900 font-semibold">₹{Number(app.rent_amount).toLocaleString('en-IN')}</strong>/mo
                        </span>
                        <span>•</span>
                        <span>
                          Move-in:{' '}
                          <strong className="text-warm-900 font-semibold">
                            {new Date(app.move_in_date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Income:{' '}
                          <strong className="text-warm-900 font-semibold">₹{Number(app.monthly_income).toLocaleString('en-IN')}</strong>/mo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-warm-100">
                    <Link
                      to={`/tenant/applications/${app.id}`}
                      className="btn-secondary !py-2 text-xs inline-flex items-center gap-1.5"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {app.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => setWithdrawTarget(app)}
                        className="text-xs text-warm-500 hover:text-brick-600 font-medium transition-colors"
                      >
                        Withdraw Application
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Withdraw Confirmation Modal */}
        {withdrawTarget && (
          <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-warm-lg border border-warm-200">
              <div className="w-12 h-12 rounded-xl bg-brick-100 text-brick-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-warm-900 text-center mb-1">
                Withdraw Application?
              </h3>
              <p className="text-xs text-warm-600 text-center mb-6 leading-relaxed">
                Are you sure you want to withdraw your application for{' '}
                <strong>{withdrawTarget.property_title}</strong>? The owner will be notified.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setWithdrawTarget(null)}
                  className="btn-secondary text-xs !py-2"
                  disabled={withdrawing}
                >
                  Keep Application
                </button>
                <button
                  type="button"
                  onClick={handleWithdrawConfirm}
                  disabled={withdrawing}
                  className="px-4 py-2 bg-brick-600 text-white rounded-lg text-xs font-semibold hover:bg-brick-700 transition-colors flex items-center gap-2"
                >
                  {withdrawing ? 'Withdrawing...' : 'Yes, Withdraw'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
