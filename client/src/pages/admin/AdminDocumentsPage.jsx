import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import documentService from '../../services/documentService';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Building,
  User,
  X,
  Check,
} from 'lucide-react';

const DOC_TYPES = [
  { value: 'all', label: 'All Document Types' },
  { value: 'IDENTITY', label: 'Identity Proof (Aadhaar/Passport)' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof' },
  { value: 'INCOME_PROOF', label: 'Income / Salary Slips' },
  { value: 'PROPERTY_DOCUMENT', label: 'Property Ownership Proof' },
  { value: 'RENTAL_DOCUMENT', label: 'Rental Agreement / NOC' },
  { value: 'OTHER', label: 'Other Document' },
];

const DOC_TYPE_LABELS = {
  IDENTITY: 'Identity Proof',
  ADDRESS_PROOF: 'Address Proof',
  INCOME_PROOF: 'Income / Salary',
  PROPERTY_DOCUMENT: 'Property Ownership',
  RENTAL_DOCUMENT: 'Rental Document',
  OTHER: 'Other Document',
};

export default function AdminDocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('document_type') || 'all');
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Alerts
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await adminService.getDocuments({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        documentType: typeFilter !== 'all' ? typeFilter : undefined,
        search: search.trim() || undefined,
        page: pagination.page,
        limit: 15,
      });

      if (res?.data) {
        setDocuments(res.data.documents || []);
        setPagination(res.data.pagination || { total: 0, page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch admin documents:', err);
      setErrorMsg('Failed to load documents list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, typeFilter, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchDocuments();
  };

  const handleApprove = async (doc) => {
    try {
      setSubmittingAction(true);
      setErrorMsg(null);
      await adminService.verifyDocument(doc.id, { status: 'VERIFIED' });
      setSuccessMsg(`Document "${doc.file_name}" has been marked as VERIFIED.`);
      fetchDocuments();
    } catch (err) {
      console.error('Document approval error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to approve document.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenRejectModal = (doc) => {
    setSelectedDoc(doc);
    setRejectionReason('Document image is blurred or details cannot be verified.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;

    try {
      setSubmittingAction(true);
      setErrorMsg(null);
      await adminService.verifyDocument(selectedDoc.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      });
      setSuccessMsg(`Document rejected with feedback reason.`);
      setRejectModalOpen(false);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error('Document reject error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to reject document.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      await documentService.downloadDocument(doc.id, doc.file_name);
    } catch (err) {
      console.error('Download error:', err);
      setErrorMsg('Could not download document file.');
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
              <span className="text-xs font-semibold text-warm-800">Document Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Document Compliance & Verification
            </h1>
            <p className="text-warm-600 text-sm mt-1">
              Review and verify identity proofs, income statements, and landlord ownership documents.
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

        {/* Filters and Search Bar */}
        <div className="card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-warm-100 p-1 rounded-lg">
              {[
                { key: 'all', label: 'All Statuses' },
                { key: 'PENDING', label: 'Pending Review' },
                { key: 'VERIFIED', label: 'Verified' },
                { key: 'REJECTED', label: 'Rejected' },
              ].map((tab) => {
                const isSelected = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      isSelected ? 'bg-white text-warm-900 shadow-warm-sm' : 'text-warm-600 hover:text-warm-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-xs py-1.5 px-3 rounded-lg border border-warm-300 bg-white font-medium text-warm-800 outline-none focus:border-primary-500"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-warm-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search file, user name, property..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-warm-300 bg-white outline-none focus:border-primary-500"
              />
            </div>
            <button type="submit" className="btn-secondary !py-2 !px-3 text-xs font-semibold">
              Search
            </button>
          </form>
        </div>

        {/* Documents Table */}
        <div className="card overflow-hidden !p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-warm-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-16 text-center text-warm-500">
              <FileText className="w-10 h-10 mx-auto text-warm-300 mb-2" />
              <p className="font-semibold text-sm text-warm-800">No documents found</p>
              <p className="text-xs text-warm-500 mt-1">Try changing the status or document type filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-warm-700">
                <thead className="bg-warm-50/80 border-b border-warm-200 text-warm-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Document / File</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Uploader</th>
                    <th className="py-3 px-4">Associated Listing</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {documents.map((doc) => {
                    const isVerified = doc.status === 'VERIFIED';
                    const isPending = doc.status === 'PENDING';
                    const isRejected = doc.status === 'REJECTED';

                    return (
                      <tr key={doc.id} className="hover:bg-warm-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="w-8 h-8 rounded-lg bg-warm-100 border border-warm-200 flex items-center justify-center text-warm-600 shrink-0">
                              <FileText className="w-4 h-4 text-primary-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-warm-900 truncate">{doc.file_name}</p>
                              <span className="text-[10px] text-warm-400">
                                {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'PDF / Image'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-warm-100 text-warm-800 border border-warm-200">
                            {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-semibold text-warm-900">{doc.user_name}</p>
                          <p className="text-[10px] text-warm-500 capitalize">{doc.user_role}</p>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {doc.property_title ? (
                            <span className="font-medium text-warm-800 line-clamp-1 max-w-[160px]">
                              {doc.property_title}
                            </span>
                          ) : (
                            <span className="text-warm-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                                isVerified
                                  ? 'bg-sage-50 text-sage-700 border-sage-200'
                                  : isPending
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-brick-50 text-brick-700 border-brick-200'
                              }`}
                            >
                              {isVerified && <CheckCircle2 className="w-3 h-3 text-sage-600" />}
                              {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                              {isRejected && <XCircle className="w-3 h-3 text-brick-600" />}
                              <span>{doc.status}</span>
                            </span>
                            {isRejected && doc.rejection_reason && (
                              <p className="text-[10px] text-brick-600 mt-0.5 max-w-[150px] truncate" title={doc.rejection_reason}>
                                {doc.rejection_reason}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-warm-500 text-[11px]">
                          {new Date(doc.uploaded_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            className="btn-secondary !py-1.5 !px-2.5 text-[11px] inline-flex items-center gap-1 font-semibold"
                            title="Download/Preview Document"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={submittingAction}
                                onClick={() => handleApprove(doc)}
                                className="btn-primary !bg-sage-600 hover:!bg-sage-700 !py-1.5 !px-2.5 text-[11px] font-semibold inline-flex items-center gap-1"
                                title="Approve document"
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify</span>
                              </button>

                              <button
                                type="button"
                                disabled={submittingAction}
                                onClick={() => handleOpenRejectModal(doc)}
                                className="btn-secondary !text-brick-600 !border-brick-200 hover:!bg-brick-50 !py-1.5 !px-2.5 text-[11px] font-semibold inline-flex items-center gap-1"
                                title="Reject with reason"
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-warm-200 flex items-center justify-between text-xs text-warm-600">
              <span>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} documents)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  className="btn-secondary !py-1 !px-2 text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  className="btn-secondary !py-1 !px-2 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {rejectModalOpen && selectedDoc && (
          <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-warm-lg border border-warm-200 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-warm-100 mb-4">
                <div className="flex items-center gap-2 text-brick-600">
                  <XCircle className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-warm-900">Decline Document Verification</h3>
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
                Provide a reason for rejecting <strong>&quot;{selectedDoc.file_name}&quot;</strong>. The uploader will receive a notification with this feedback.
              </p>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-warm-900 mb-1">Rejection Feedback Reason</label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Image is blurry, name does not match user account profile, or expiry date has passed."
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
