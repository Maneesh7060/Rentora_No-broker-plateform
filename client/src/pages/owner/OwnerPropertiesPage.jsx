import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import propertyService from '../../services/propertyService';
import PropertyFormModal from '../../components/property/PropertyFormModal';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Home,
  MapPin,
  ShieldCheck,
  Send,
  AlertCircle,
  ImageIcon,
} from 'lucide-react';

const STATUS_BADGES = {
  published: { label: 'Live / Published', bg: 'bg-sage-50 text-sage-800 border-sage-200' },
  draft: { label: 'Draft', bg: 'bg-warm-100 text-warm-700 border-warm-200' },
  pending: { label: 'Pending Review', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  rented: { label: 'Rented', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
  rejected: { label: 'Declined', bg: 'bg-brick-50 text-brick-800 border-brick-200' },
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verification submitting state
  const [submittingVerificationId, setSubmittingVerificationId] = useState(null);

  // Alert Banner
  const [alert, setAlert] = useState(null);

  const fetchOwnerProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await propertyService.getMyProperties({
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      if (res && res.data) {
        setProperties(res.data.properties || []);
        setStats(res.data.stats || null);
      }
    } catch (err) {
      console.error('Fetch owner properties error:', err);
      setError(err.response?.data?.message || 'Failed to load your properties.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOwnerProperties();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOwnerProperties]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleOpenAdd = () => {
    setEditingProperty(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingProperty) {
        await propertyService.updateProperty(editingProperty.id, formData);
        showAlert('success', 'Property listing updated successfully.');
      } else {
        await propertyService.createProperty(formData);
        showAlert('success', 'New property listing created successfully.');
      }
      setIsModalOpen(false);
      setEditingProperty(null);
      fetchOwnerProperties();
    } catch (err) {
      console.error('Save property error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save property listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForVerification = async (property) => {
    try {
      setSubmittingVerificationId(property.id);
      await propertyService.submitVerification(property.id);
      showAlert('success', `"${property.title}" has been submitted for admin verification.`);
      fetchOwnerProperties();
    } catch (err) {
      console.error('Verification submission error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to submit property for verification.');
    } finally {
      setSubmittingVerificationId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await propertyService.deleteProperty(deleteTarget.id);
      showAlert('success', 'Property listing deleted successfully.');
      setDeleteTarget(null);
      fetchOwnerProperties();
    } catch (err) {
      console.error('Delete property error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to delete property.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <Building className="w-4 h-4" />
              <span>Owner Portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              My Property Listings
            </h1>
            <p className="text-sm text-warm-600 mt-1">
              Create, edit, manage photos, and track verification compliance for your properties.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-primary !py-2.5 !px-5 text-sm inline-flex items-center gap-2 self-start sm:self-auto shadow-warm-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Property
          </button>
        </div>

        {/* Alert Banner */}
        {alert && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between animate-fadeIn ${
              alert.type === 'success'
                ? 'bg-sage-50 text-sage-800 border-sage-200'
                : 'bg-brick-50 text-brick-800 border-brick-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {alert.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-brick-600 shrink-0" />}
              <span>{alert.message}</span>
            </div>
            <button onClick={() => setAlert(null)} className="text-xs opacity-70 hover:opacity-100 underline font-bold ml-3">
              Dismiss
            </button>
          </div>
        )}

        {/* Portfolio Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card !p-4">
              <span className="text-xs font-semibold text-warm-500">Total Listings</span>
              <p className="text-2xl font-bold text-warm-900 mt-1">{stats.total_properties || 0}</p>
            </div>
            <div className="card !p-4">
              <span className="text-xs font-semibold text-sage-600">Verified & Published</span>
              <p className="text-2xl font-bold text-sage-600 mt-1">{stats.published_count || 0}</p>
            </div>
            <div className="card !p-4">
              <span className="text-xs font-semibold text-primary-600">Currently Rented</span>
              <p className="text-2xl font-bold text-primary-600 mt-1">{stats.rented_count || 0}</p>
            </div>
            <div className="card !p-4">
              <span className="text-xs font-semibold text-warm-500">Drafts / In Review</span>
              <p className="text-2xl font-bold text-warm-700 mt-1">{stats.draft_count || 0}</p>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="card !p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-warm-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, city, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-warm-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['all', 'published', 'draft', 'pending', 'rented'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white shadow-warm-sm'
                    : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                }`}
              >
                {status === 'all' ? 'All Statuses' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
            <p className="text-xs text-warm-500 font-medium">Loading your listings...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-brick-50 border border-brick-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
            <AlertTriangle className="w-8 h-8 text-brick-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-brick-900">{error}</p>
            <button
              onClick={fetchOwnerProperties}
              className="mt-4 px-4 py-2 rounded-xl bg-brick-600 text-white text-xs font-semibold hover:bg-brick-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && properties.length === 0 && (
          <div className="card text-center py-16 px-6 max-w-md mx-auto shadow-warm-sm">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
              <Home className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-warm-900 mb-1">No Properties Found</h3>
            <p className="text-xs text-warm-500 mb-6">
              {search || statusFilter !== 'all'
                ? 'No properties match your current filter settings.'
                : 'You have not added any properties to your portfolio yet.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="btn-primary !py-2.5 !px-5 text-xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Your First Property
            </button>
          </div>
        )}

        {/* Properties List */}
        {!loading && !error && properties.length > 0 && (
          <div className="space-y-4">
            {properties.map((prop) => {
              const isVerified = prop.verification_status === 'verified' || prop.status === 'published';
              const isPending = prop.verification_status === 'pending_verification' || prop.status === 'pending';
              const isRejected = prop.verification_status === 'rejected' || prop.status === 'rejected';
              const isDraft = prop.verification_status === 'draft' || prop.status === 'draft';

              const imgUrl =
                prop.images && prop.images.length > 0 ? prop.images[0] : FALLBACK_IMAGE;

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-warm-200 p-4 sm:p-5 shadow-warm-sm hover:shadow-warm-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={imgUrl}
                        alt={prop.title}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-warm-100 border border-warm-200"
                      />
                      {Array.isArray(prop.images) && prop.images.length > 1 && (
                        <span className="absolute bottom-1 right-1 bg-warm-900/80 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 font-semibold">
                          <ImageIcon className="w-2.5 h-2.5" />
                          {prop.images.length}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {isVerified && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-sage-50 text-sage-800 border-sage-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-sage-600" /> Verified & Live
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Admin Review
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-brick-50 text-brick-800 border-brick-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-brick-600" /> Rejected
                          </span>
                        )}
                        {isDraft && !isPending && !isRejected && !isVerified && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-warm-100 text-warm-700 border-warm-200">
                            Draft
                          </span>
                        )}
                        <span className="text-[10px] font-semibold uppercase text-warm-600 bg-warm-100 px-2 py-0.5 rounded-md">
                          {prop.property_type}
                        </span>
                        {prop.furnishing && (
                          <span className="text-[10px] font-semibold capitalize text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                            {prop.furnishing.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-warm-900 text-base truncate max-w-lg">
                        {prop.title}
                      </h3>

                      <p className="text-xs text-warm-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="truncate">
                          {prop.address_line}{prop.locality ? `, ${prop.locality}` : ''}, {prop.city}, {prop.state}
                        </span>
                      </p>

                      <div className="flex items-center gap-3 text-xs text-warm-600 mt-2 font-medium">
                        <span className="text-primary-600 font-bold text-sm">
                          ₹{Number(prop.rent_amount).toLocaleString('en-IN')}/mo
                        </span>
                        <span>•</span>
                        <span>{prop.bedrooms} BHK</span>
                        <span>•</span>
                        <span>{prop.bathrooms} Baths</span>
                        {prop.area_sqft && (
                          <>
                            <span>•</span>
                            <span>{prop.area_sqft} sqft</span>
                          </>
                        )}
                      </div>

                      {/* Rejection reason box */}
                      {isRejected && prop.rejection_reason && (
                        <div className="mt-2.5 p-2 bg-brick-50 border border-brick-200 rounded-lg text-[11px] text-brick-800">
                          <strong>Admin Feedback:</strong> {prop.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-warm-100 w-full md:w-auto justify-end flex-wrap">
                    {/* Submit for verification if draft or rejected */}
                    {(isDraft || isRejected) && (
                      <button
                        type="button"
                        disabled={submittingVerificationId === prop.id}
                        onClick={() => handleSubmitForVerification(prop)}
                        className="btn-primary !py-1.5 !px-3 text-xs font-semibold inline-flex items-center gap-1.5"
                        title="Submit property to Rentora admin for verification"
                      >
                        {submittingVerificationId === prop.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Submit for Verification</span>
                      </button>
                    )}

                    <Link
                      to={`/properties/${prop.id}`}
                      target="_blank"
                      className="p-2 text-warm-600 hover:text-primary-600 hover:bg-warm-100 rounded-lg transition-colors"
                      title="View Live Listing"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prop)}
                      className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1 font-semibold"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(prop)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-brick-600 bg-brick-50 hover:bg-brick-100 rounded-lg border border-brick-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        <PropertyFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProperty(null);
          }}
          onSubmit={handleFormSubmit}
          property={editingProperty}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-warm-lg text-center animate-fadeIn border border-warm-200">
              <div className="w-12 h-12 rounded-2xl bg-brick-100 text-brick-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-warm-900 mb-2">Delete Property Listing?</h3>
              <p className="text-xs text-warm-600 mb-6 leading-relaxed">
                Are you sure you want to delete <strong>&quot;{deleteTarget.title}&quot;</strong>? This action cannot be undone.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="btn-secondary flex-1 !py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="btn-primary !bg-brick-600 hover:!bg-brick-700 text-white flex-1 !py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
