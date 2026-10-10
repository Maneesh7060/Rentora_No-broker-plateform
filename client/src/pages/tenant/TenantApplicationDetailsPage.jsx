import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getApplicationById, withdrawApplication } from '../../services/applicationService';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Building,
  MapPin,
  Calendar,
  User,
  DollarSign,
  Briefcase,
  Users,
  MessageSquare,
  Phone,
  Mail,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending Owner Review',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
    banner: 'Your application is currently under review by the property owner. You will be notified when a decision is made.',
  },
  approved: {
    label: 'Application Approved 🎉',
    bg: 'bg-sage-50',
    text: 'text-sage-800',
    border: 'border-sage-200',
    icon: CheckCircle2,
    banner: 'Congratulations! The owner has approved your rental application. Please contact them to arrange lease signing and move-in.',
  },
  rejected: {
    label: 'Application Not Approved',
    bg: 'bg-brick-50',
    text: 'text-brick-800',
    border: 'border-brick-200',
    icon: XCircle,
    banner: 'Thank you for your interest. The property owner was unable to accept this application at this time.',
  },
  withdrawn: {
    label: 'Application Withdrawn',
    bg: 'bg-warm-100',
    text: 'text-warm-800',
    border: 'border-warm-200',
    icon: Clock,
    banner: 'You withdrew this application. You can apply again if the property is still available.',
  },
};

export default function TenantApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getApplicationById(id);
      setApplication(res.data);
    } catch (err) {
      console.error('Failed to load application:', err);
      setError(err.response?.data?.message || 'Could not load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchApplication();
  }, [id]);

  const handleWithdraw = async () => {
    try {
      setIsWithdrawing(true);
      await withdrawApplication(id);
      setShowWithdrawConfirm(false);
      fetchApplication();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw application.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-warm-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-warm-600 text-sm font-medium">Loading application...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-brick-100 text-brick-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-warm-900 mb-2">Application Not Found</h2>
        <p className="text-warm-600 text-sm mb-6">{error || 'This application does not exist or you lack permission.'}</p>
        <Link to="/tenant/applications" className="btn-primary inline-flex text-xs !py-2.5">
          Back to Applications
        </Link>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConf.icon;
  const images = Array.isArray(application.property_images) ? application.property_images : [];
  const thumbnail =
    images[0] ||
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/tenant/applications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-warm-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>

          <span className="text-xs text-warm-500">
            Application #{application.id} • Submitted on{' '}
            {new Date(application.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Status Alert Banner */}
        <div
          className={`p-5 rounded-2xl border mb-8 flex items-start gap-4 ${statusConf.bg} ${statusConf.border}`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-warm-sm">
            <StatusIcon className={`w-5 h-5 ${statusConf.text}`} />
          </div>
          <div className="flex-1">
            <h2 className={`font-bold text-base ${statusConf.text}`}>{statusConf.label}</h2>
            <p className="text-xs text-warm-700 mt-1 leading-relaxed">{statusConf.banner}</p>

            {application.owner_notes && (
              <div className="mt-3 p-3 bg-white/90 rounded-xl border border-warm-200/80 text-xs text-warm-800">
                <span className="font-semibold text-warm-900 block mb-0.5">Note from Owner:</span>
                {application.owner_notes}
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info Column: Applicant Details Submitted */}
          <div className="md:col-span-2 space-y-6">
            <div className="card !p-6 space-y-6">
              <h3 className="text-base font-bold text-warm-900 border-b border-warm-100 pb-3">
                Submitted Application Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-warm-50 rounded-xl border border-warm-100">
                  <span className="text-warm-500 block mb-1 font-medium">Applicant Name</span>
                  <strong className="text-warm-900 text-sm">{application.applicant_name}</strong>
                </div>

                <div className="p-3.5 bg-warm-50 rounded-xl border border-warm-100">
                  <span className="text-warm-500 block mb-1 font-medium">Monthly Income</span>
                  <strong className="text-warm-900 text-sm">
                    ₹{Number(application.monthly_income).toLocaleString('en-IN')}
                  </strong>
                </div>

                <div className="p-3.5 bg-warm-50 rounded-xl border border-warm-100">
                  <span className="text-warm-500 block mb-1 font-medium">Employment Status</span>
                  <strong className="text-warm-900 text-sm capitalize">
                    {application.employment_status?.replace('_', ' ')}
                  </strong>
                  {application.occupation && (
                    <span className="text-warm-600 block mt-0.5">({application.occupation})</span>
                  )}
                </div>

                <div className="p-3.5 bg-warm-50 rounded-xl border border-warm-100">
                  <span className="text-warm-500 block mb-1 font-medium">Total Occupants</span>
                  <strong className="text-warm-900 text-sm">
                    {application.occupants} {application.occupants === 1 ? 'Person' : 'People'}
                  </strong>
                </div>

                <div className="p-3.5 bg-warm-50 rounded-xl border border-warm-100 sm:col-span-2">
                  <span className="text-warm-500 block mb-1 font-medium">Proposed Move-in Date</span>
                  <strong className="text-warm-900 text-sm">
                    {new Date(application.move_in_date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
              </div>

              {application.message && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-warm-700 uppercase tracking-wider mb-2">
                    Message to Property Owner
                  </h4>
                  <p className="p-4 bg-warm-50 rounded-xl border border-warm-100 text-xs text-warm-700 leading-relaxed italic">
                    &ldquo;{application.message}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Withdraw Action (if pending) */}
            {application.status === 'pending' && (
              <div className="card !p-5 bg-warm-50/70 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-warm-900">Change your mind?</h4>
                  <p className="text-[11px] text-warm-500 mt-0.5">
                    You can cancel this pending rental request anytime before owner review.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWithdrawConfirm(true)}
                  className="px-3 py-1.5 rounded-lg border border-brick-300 text-brick-700 hover:bg-brick-50 text-xs font-semibold transition-colors"
                >
                  Withdraw Application
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Property Snapshot & Owner Contact */}
          <div className="space-y-6">
            {/* Property Snapshot Card */}
            <div className="card !p-5 space-y-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-400 block">
                Target Property
              </span>

              <img
                src={thumbnail}
                alt={application.property_title}
                className="w-full h-36 rounded-xl object-cover border border-warm-200"
              />

              <div>
                <h4 className="font-semibold text-sm text-warm-900 leading-snug">
                  {application.property_title}
                </h4>
                <div className="flex items-center text-xs text-warm-600 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mr-1" />
                  <span className="truncate">
                    {application.locality ? `${application.locality}, ` : ''}
                    {application.city}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-warm-100 flex items-baseline justify-between">
                <span className="text-xs text-warm-500">Rent</span>
                <span className="text-base font-bold text-primary-600">
                  ₹{Number(application.rent_amount).toLocaleString('en-IN')}/mo
                </span>
              </div>

              <Link
                to={`/properties/${application.property_id}`}
                className="btn-secondary w-full !py-2 text-xs text-center block"
              >
                View Listing Page
              </Link>
            </div>

            {/* Owner Contact Card */}
            <div className="card !p-5 space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-400 block">
                Property Owner
              </span>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                  {application.owner_name ? application.owner_name[0] : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-warm-900">{application.owner_name}</h4>
                  <span className="text-[10px] text-sage-600 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Owner
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2 text-xs text-warm-700 border-t border-warm-100">
                {application.owner_email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                    <span className="truncate">{application.owner_email}</span>
                  </div>
                )}
                {application.owner_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                    <span>{application.owner_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Withdraw Confirm Modal */}
        {showWithdrawConfirm && (
          <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-warm-lg border border-warm-200">
              <div className="w-12 h-12 rounded-xl bg-brick-100 text-brick-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-warm-900 text-center mb-1">
                Confirm Withdrawal
              </h3>
              <p className="text-xs text-warm-600 text-center mb-6 leading-relaxed">
                Are you sure you want to withdraw this application? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawConfirm(false)}
                  className="btn-secondary text-xs !py-2"
                  disabled={isWithdrawing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="px-4 py-2 bg-brick-600 text-white rounded-lg text-xs font-semibold hover:bg-brick-700 transition-colors flex items-center gap-2"
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdraw'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
