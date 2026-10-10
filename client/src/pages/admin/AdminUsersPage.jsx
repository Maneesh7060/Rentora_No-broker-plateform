import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { getMediaUrl } from '../../utils/mediaUtils';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Check,
} from 'lucide-react';

const ROLE_LABELS = {
  tenant: 'Tenant',
  owner: 'Property Owner',
  agent: 'Agent',
  maintenance: 'Maintenance',
  admin: 'Administrator',
};

const ROLE_COLORS = {
  tenant: 'bg-primary-50 text-primary-700 border-primary-200',
  owner: 'bg-amber-50 text-amber-800 border-amber-200',
  agent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  maintenance: 'bg-teal-50 text-teal-700 border-teal-200',
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('account_status') || 'all');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUserModal, setViewUserModal] = useState(false);
  const [confirmStatusModal, setConfirmStatusModal] = useState(false);
  const [statusTargetUser, setStatusTargetUser] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Alerts
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await adminService.getUsers({
        role: roleFilter !== 'all' ? roleFilter : undefined,
        account_status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
        page: pagination.page,
        limit: 15,
      });

      if (res?.data) {
        setUsers(res.data.users || []);
        setPagination(res.data.pagination || { total: 0, page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load users for admin:', err);
      setErrorMsg('Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleOpenStatusModal = (user) => {
    setStatusTargetUser(user);
    setConfirmStatusModal(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusTargetUser) return;
    const newStatus = statusTargetUser.account_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    try {
      setSubmittingAction(true);
      setErrorMsg(null);
      await adminService.updateUserStatus(statusTargetUser.id, { status: newStatus });
      setSuccessMsg(
        `User "${statusTargetUser.full_name}" is now ${newStatus.toLowerCase()}.`
      );
      setConfirmStatusModal(false);
      setStatusTargetUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Update status error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenViewModal = (user) => {
    setSelectedUser(user);
    setViewUserModal(true);
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
              <span className="text-xs font-semibold text-warm-800">User Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              User Accounts & Role Moderation
            </h1>
            <p className="text-warm-600 text-sm mt-1">
              Manage platform users, inspect profile completion, and manage account statuses.
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
          {/* Role & Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-warm-100 p-1 rounded-lg">
              {[
                { key: 'all', label: 'All Roles' },
                { key: 'tenant', label: 'Tenants' },
                { key: 'owner', label: 'Owners' },
                { key: 'admin', label: 'Admins' },
              ].map((tab) => {
                const isSelected = roleFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setRoleFilter(tab.key);
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-xs py-1.5 px-3 rounded-lg border border-warm-300 bg-white font-medium text-warm-800 outline-none focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
            </select>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-warm-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, city..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-warm-300 bg-white outline-none focus:border-primary-500"
              />
            </div>
            <button type="submit" className="btn-secondary !py-2 !px-3 text-xs font-semibold">
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden !p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-warm-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span>Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-warm-500">
              <Users className="w-10 h-10 mx-auto text-warm-300 mb-2" />
              <p className="font-semibold text-sm text-warm-800">No users found</p>
              <p className="text-xs text-warm-500 mt-1">Try adjusting the filter criteria or search keyword.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-warm-700">
                <thead className="bg-warm-50/80 border-b border-warm-200 text-warm-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Phone & City</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {users.map((u) => {
                    const isSuspended = u.account_status === 'SUSPENDED';
                    const isSelf = currentAdmin?.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-warm-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-warm-200 border border-warm-300 flex items-center justify-center font-bold text-warm-700 text-xs overflow-hidden shrink-0">
                              {getMediaUrl(u.avatar_url) ? (
                                <img
                                  src={getMediaUrl(u.avatar_url)}
                                  alt={u.full_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                u.full_name?.charAt(0)?.toUpperCase() || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-warm-900 truncate">{u.full_name}</span>
                                {u.is_verified && (
                                  <span className="text-[10px] text-sage-700 font-bold bg-sage-50 border border-sage-200 px-1 rounded">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-warm-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                              ROLE_COLORS[u.role] || 'bg-warm-100 text-warm-700 border-warm-200'
                            }`}
                          >
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="text-warm-800 font-medium">{u.phone || '—'}</p>
                          <p className="text-[10px] text-warm-500">
                            {[u.city, u.state].filter(Boolean).join(', ') || 'Location not set'}
                          </p>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                              isSuspended
                                ? 'bg-brick-50 text-brick-700 border-brick-200'
                                : 'bg-sage-50 text-sage-700 border-sage-200'
                            }`}
                          >
                            {isSuspended ? (
                              <>
                                <XCircle className="w-3 h-3 text-brick-600" />
                                <span>Suspended</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-sage-600" />
                                <span>Active</span>
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-warm-500 text-[11px]">
                          {new Date(u.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(u)}
                            className="btn-secondary !py-1.5 !px-2.5 text-[11px] inline-flex items-center gap-1 font-semibold"
                            title="Inspect user profile"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleOpenStatusModal(u)}
                            className={`!py-1.5 !px-2.5 text-[11px] font-semibold inline-flex items-center gap-1 rounded-lg border transition-colors ${
                              isSelf
                                ? 'opacity-40 cursor-not-allowed bg-warm-100 text-warm-400 border-warm-200'
                                : isSuspended
                                ? 'bg-sage-50 text-sage-700 border-sage-200 hover:bg-sage-100'
                                : 'bg-brick-50 text-brick-700 border-brick-200 hover:bg-brick-100'
                            }`}
                            title={isSelf ? 'Cannot modify your own active account' : isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                          >
                            {isSuspended ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            <span>{isSuspended ? 'Reactivate' : 'Suspend'}</span>
                          </button>
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
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
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

        {/* View User Modal */}
        {viewUserModal && selectedUser && (
          <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-warm-lg border border-warm-200 animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-warm-100 mb-4">
                <h3 className="font-bold text-base text-warm-900">User Account Profile</h3>
                <button
                  type="button"
                  onClick={() => setViewUserModal(false)}
                  className="p-1 text-warm-400 hover:text-warm-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-warm-50 p-4 rounded-xl border border-warm-200">
                  <div className="w-14 h-14 rounded-full bg-warm-200 border-2 border-white shadow-warm-sm flex items-center justify-center font-bold text-warm-800 text-lg overflow-hidden shrink-0">
                    {getMediaUrl(selectedUser.avatar_url) ? (
                      <img
                        src={getMediaUrl(selectedUser.avatar_url)}
                        alt={selectedUser.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      selectedUser.full_name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-warm-900 text-base">{selectedUser.full_name}</h4>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${ROLE_COLORS[selectedUser.role]}`}>
                        {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-warm-500 mt-0.5">{selectedUser.email}</p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        selectedUser.account_status === 'SUSPENDED'
                          ? 'bg-brick-50 text-brick-700 border-brick-200'
                          : 'bg-sage-50 text-sage-700 border-sage-200'
                      }`}
                    >
                      {selectedUser.account_status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-warm-200">
                    <span className="text-[10px] text-warm-400 block uppercase font-semibold">Phone</span>
                    <span className="font-semibold text-warm-800">{selectedUser.phone || 'Not provided'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-warm-200">
                    <span className="text-[10px] text-warm-400 block uppercase font-semibold">Location</span>
                    <span className="font-semibold text-warm-800">
                      {[selectedUser.city, selectedUser.state].filter(Boolean).join(', ') || 'Not set'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-warm-200 col-span-2">
                    <span className="text-[10px] text-warm-400 block uppercase font-semibold">Full Address</span>
                    <span className="font-semibold text-warm-800">{selectedUser.address || 'Not provided'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-warm-200 col-span-2">
                    <span className="text-[10px] text-warm-400 block uppercase font-semibold">About / Bio</span>
                    <p className="text-warm-700 mt-0.5 whitespace-pre-wrap">{selectedUser.bio || 'No biography written.'}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-warm-200 col-span-2">
                    <span className="text-[10px] text-warm-400 block uppercase font-semibold">Registered On</span>
                    <span className="font-semibold text-warm-800">
                      {new Date(selectedUser.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewUserModal(false)}
                  className="btn-secondary !py-2 !px-4 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Suspend/Reactivate Modal */}
        {confirmStatusModal && statusTargetUser && (
          <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-warm-lg border border-warm-200 animate-fadeIn">
              <div className="flex items-center gap-3 pb-3 border-b border-warm-100 mb-4">
                {statusTargetUser.account_status === 'ACTIVE' ? (
                  <div className="w-10 h-10 rounded-xl bg-brick-100 text-brick-700 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-warm-900">
                    {statusTargetUser.account_status === 'ACTIVE' ? 'Suspend User Account?' : 'Reactivate User Account?'}
                  </h3>
                  <p className="text-[11px] text-warm-500">{statusTargetUser.full_name} ({statusTargetUser.email})</p>
                </div>
              </div>

              <p className="text-xs text-warm-600 mb-4">
                {statusTargetUser.account_status === 'ACTIVE'
                  ? 'Suspended users will immediately lose access to authenticated endpoints and cannot log in or manage listings until reactivated.'
                  : 'Reactivating this user will immediately restore full platform access.'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-warm-100">
                <button
                  type="button"
                  onClick={() => setConfirmStatusModal(false)}
                  disabled={submittingAction}
                  className="btn-secondary !py-2 !px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={handleConfirmToggleStatus}
                  className={`btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5 ${
                    statusTargetUser.account_status === 'ACTIVE'
                      ? '!bg-brick-600 hover:!bg-brick-700'
                      : '!bg-sage-600 hover:!bg-sage-700'
                  }`}
                >
                  {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {statusTargetUser.account_status === 'ACTIVE' ? 'Confirm Suspension' : 'Confirm Reactivation'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
