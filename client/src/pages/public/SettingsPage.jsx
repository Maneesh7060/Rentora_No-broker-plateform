import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import { getMediaUrl } from '../../utils/mediaUtils';
import {
  User,
  Lock,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  ArrowRight,
  Eye,
  EyeOff,
  Building,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('security'); // 'profile' | 'account' | 'security'

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('All password fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await userService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccessMsg(res?.message || 'Password changed successfully! Please use your new password next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update password. Check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const profileRoute = user?.role === 'owner' ? '/owner/profile' : '/tenant/profile';

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
            Account & Security Settings
          </h1>
          <p className="text-warm-600 text-sm mt-1">
            Manage your account credentials, security access, and profile preferences.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-warm-200 gap-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-warm-500 hover:text-warm-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('account');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'account'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-warm-500 hover:text-warm-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Account Details</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-warm-500 hover:text-warm-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Quick View</span>
          </button>
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

        {/* TAB 1: Security & Password */}
        {activeTab === 'security' && (
          <div className="card !p-6 sm:!p-8 space-y-6">
            <div className="border-b border-warm-100 pb-4">
              <h2 className="text-base font-bold text-warm-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-primary-600" />
                <span>Change Account Password</span>
              </h2>
              <p className="text-xs text-warm-500 mt-0.5">
                Update your account password with standard encryption protection.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-warm-900 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full text-xs p-2.5 pr-9 rounded-lg border border-warm-300 focus:border-primary-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2.5 top-2.5 text-warm-400 hover:text-warm-700"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-900 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full text-xs p-2.5 pr-9 rounded-lg border border-warm-300 focus:border-primary-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2.5 top-2.5 text-warm-400 hover:text-warm-700"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-900 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full text-xs p-2.5 pr-9 rounded-lg border border-warm-300 focus:border-primary-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-2.5 text-warm-400 hover:text-warm-700"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="btn-primary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-warm-sm"
                >
                  {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Account Details */}
        {activeTab === 'account' && (
          <div className="card !p-6 sm:!p-8 space-y-6">
            <div className="border-b border-warm-100 pb-4">
              <h2 className="text-base font-bold text-warm-900">Account Overview</h2>
              <p className="text-xs text-warm-500 mt-0.5">Your Rentora authentication details and account status.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-warm-50 rounded-xl border border-warm-200">
                <span className="text-warm-500">Full Name</span>
                <p className="font-bold text-warm-900 mt-0.5 text-sm">{user?.full_name}</p>
              </div>

              <div className="p-3.5 bg-warm-50 rounded-xl border border-warm-200">
                <span className="text-warm-500">Registered Email</span>
                <p className="font-bold text-warm-900 mt-0.5 text-sm">{user?.email}</p>
              </div>

              <div className="p-3.5 bg-warm-50 rounded-xl border border-warm-200">
                <span className="text-warm-500">Platform Role</span>
                <p className="font-bold text-primary-600 mt-0.5 capitalize text-sm">{user?.role}</p>
              </div>

              <div className="p-3.5 bg-warm-50 rounded-xl border border-warm-200">
                <span className="text-warm-500">Account Status</span>
                <p className="font-bold text-sage-600 mt-0.5 text-sm">Active & Verified</p>
              </div>
            </div>

            <div className="pt-4 border-t border-warm-100 flex items-center justify-between">
              <span className="text-xs text-warm-500">Need to sign out of this device?</span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary !py-2 !px-4 text-xs text-brick-600 border-brick-200 hover:bg-brick-50 inline-flex items-center gap-1.5 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Profile Quick View */}
        {activeTab === 'profile' && (
          <div className="card !p-6 sm:!p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-warm-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-warm-900">Profile Management</h2>
                <p className="text-xs text-warm-500 mt-0.5">Quick access to your dedicated profile editing page.</p>
              </div>
              <Link to={profileRoute} className="btn-primary !py-2 !px-4 text-xs inline-flex items-center gap-1.5">
                <span>Open Full Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-warm-50 border border-warm-200">
              <div className="w-14 h-14 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 border border-primary-200">
                {getMediaUrl(user?.avatar_url) ? (
                  <img
                    src={getMediaUrl(user.avatar_url)}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{user?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-warm-900">{user?.full_name}</h3>
                <p className="text-xs text-warm-500">{user?.email}</p>
                <p className="text-[11px] text-primary-600 font-semibold mt-1 capitalize">
                  {user?.role === 'owner' ? 'Property Landlord' : 'Rental Tenant'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
