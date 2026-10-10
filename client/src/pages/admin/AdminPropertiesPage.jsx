import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Check,
  X,
} from 'lucide-react';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80';

export default function AdminPropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('verification_status') || 'all';

  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Alerts
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await adminService.getProperties({
        verification_status: filter !== 'all' ? filter : undefined,
        search: search.trim() || undefined,
        page: pagination.page,
        limit: 15,
      });

      if (res?.data) {
        setProperties(res.data.properties || []);
        setPagination(res.data.pagination || { total: 0, page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load admin properties:', err);
      setErrorMsg('Failed to load properties for review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [filter, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProperties();
  };

  const handleApprove = async (property) => {
    try {
      setSubmittingAction(true);
      setErrorMsg(null);
      await adminService.verifyProperty(property.id, { action: 'APPROVE' });
      setSuccessMsg(`Property "${property.title}" has been verified and is now live.`);
      fetchProperties();
    } catch (err) {
      console.error('Approve error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to approve property.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenRejectModal = (property) => {
    setSelectedProperty(property);
    setRejectionReason('Property information is incomplete or address requires clarification.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedProperty) return;

    try {
      setSubmittingAction(true);
      setErrorMsg(null);
      await adminService.verifyProperty(selectedProperty.id, {
        action: 'REJECT',
        rejectionReason: rejectionReason.trim(),
      });
      setSuccessMsg(`Property listing declined with feedback note.`);
      setRejectModalOpen(false);
      setSelectedProperty(null);
      fetchProperties();
    } catch (err) {
      console.error('Reject error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to reject property.');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/admin/dashboard" className="text-xs text-warm-500 hover:text-primary-600 font-medium">
                Admin Dashboard
              </Link>
              <span className="text-xs text-warm-400">/</span>
              <span className="text-xs font-semibold text-warm-800">Property Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Property Verification & Moderation
            </h1>
            <p className="text-warm-600 text-sm mt-1">
              Review landlord listings, verify address compliance, and publish verified properties to the search catalog.
            </p>
          </div>
        </div>

        {/* Alerts */}
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

        {errorMsg && (
          <div className="p-4 bg-brick-50 border border-brick-200 rounded-xl flex items-center justify-between text-xs text-brick-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-brick-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-brick-600 hover:text-brick-900 font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: 'All Listings' },
              { key: 'pending_verification', label: 'Pending Review' },
              { key: 'verified', label: 'Verified / Active' },
              { key: 'rejected', label: 'Rejected' },
            ].map((tab) => {
              const isSelected = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFilter(tab.key);
                    setSearchParams(tab.key !== 'all' ? { verification_status: tab.key } : {});
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-warm-sm'
                      : 'text-warm-600 hover:bg-warm-100 hover:text-warm-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-warm-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, city, owner..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-warm-300 bg-white outline-none focus:border-primary-500"
              />
            </div>
            <button type="submit" className="btn-secondary !py-2 !px-3 text-xs font-semibold">
              Search
            </button>
          </form>
        </div>

        {/* Properties Table */}
        <div className="card overflow-hidden !p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-warm-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span>Loading properties...</span>
            </div>
          ) : properties.length === 0 ? (
            <div className="py-16 text-center text-warm-500">
              <Building2 className="w-10 h-10 mx-auto text-warm-300 mb-2" />
              <p className="font-semibold text-sm text-warm-800">No properties found</p>
              <p className="text-xs text-warm-500 mt-1">Try changing the status filter or search keywords.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-warm-700">
                <thead className="bg-warm-50/80 border-b border-warm-200 text-warm-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Rent</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {properties.map((prop) => {
                    const isVerified = prop.verification_status === 'verified' || prop.status === 'published';
                    const isPending = prop.verification_status === 'pending_verification' || prop.status === 'pending';
                    const isRejected = prop.verification_status === 'rejected' || prop.status === 'rejected';

                    const statusClass = isVerified
                      ? 'bg-sage-50 text-sage-700 border-sage-200'
                      : isPending
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-brick-50 text-brick-700 border-brick-200';

                    const firstImage = Array.isArray(prop.images) && prop.images.length > 0 ? prop.images[0] : FALLBACK_IMAGE;

                    return (
                      <tr key={prop.id} className="hover:bg-warm-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <img
                              src={firstImage}
                              alt={prop.title}
                              className="w-12 h-12 rounded-lg object-cover bg-warm-100 shrink-0 border border-warm-200"
                            />
                            <div className="min-w-0">
                              <Link
                                to={`/admin/properties/${prop.id}`}
                                className="font-bold text-warm-900 hover:text-primary-600 line-clamp-1 block"
                              >
                                {prop.title}
                              </Link>
                              <span className="text-[10px] text-warm-500 capitalize">
                                {prop.bedrooms} BHK • {prop.property_type}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-semibold text-warm-900">{prop.owner?.full_name}</p>
                          <p className="text-[11px] text-warm-500">{prop.owner?.email}</p>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="text-warm-800">{prop.locality || prop.city}</p>
                          <p className="text-[10px] text-warm-500">{prop.state}</p>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-bold text-warm-900">
                          ₹{Number(prop.rent_amount).toLocaleString('en-IN')}
                          <span className="text-[10px] font-normal text-warm-400">/mo</span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${statusClass}`}>
                            {isVerified ? '✓ Verified' : isPending ? 'Pending Review' : 'Rejected'}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5">
                          <Link
                            to={`/admin/properties/${prop.id}`}
                            className="btn-secondary !py-1.5 !px-2.5 text-[11px] inline-flex items-center gap-1 font-semibold"
                            title="Inspect complete details"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </Link>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={submittingAction}
                                onClick={() => handleApprove(prop)}
                                className="btn-primary !bg-sage-600 hover:!bg-sage-700 !py-1.5 !px-2.5 text-[11px] font-semibold inline-flex items-center gap-1"
                                title="Approve & Publish"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                disabled={submittingAction}
                                onClick={() => handleOpenRejectModal(prop)}
                                className="btn-secondary !text-brick-600 !border-brick-200 hover:!bg-brick-50 !py-1.5 !px-2.5 text-[11px] font-semibold inline-flex items-center gap-1"
                                title="Decline with reason"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reject with Reason Modal */}
        {rejectModalOpen && selectedProperty && (
          <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-warm-lg border border-warm-200 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-warm-100 mb-4">
                <div className="flex items-center gap-2 text-brick-600">
                  <XCircle className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-warm-900">Decline Property Listing</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="p-1 text-warm-400 hover:text-warm-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-warm-600 mb-3">
                Provide a clear feedback reason for <strong>&quot;{selectedProperty.title}&quot;</strong>. The owner will see this feedback in their dashboard.
              </p>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-warm-900 mb-1">Rejection Feedback Reason</label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Address proof does not match listed locality. Please re-upload clearer photos."
                    className="w-full text-xs p-2.5 rounded-lg border border-warm-300 focus:border-brick-500 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-warm-100">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(false)}
                    disabled={submittingAction}
                    className="btn-secondary !py-2 !px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction || !rejectionReason.trim()}
                    className="btn-primary !bg-brick-600 hover:!bg-brick-700 !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Confirm Rejection</span>
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
