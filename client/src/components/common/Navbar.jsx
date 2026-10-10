import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import { getMediaUrl } from '../../utils/mediaUtils';
import {
  Home,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Heart,
  FileText,
  Building,
  Calendar,
  Settings,
  ShieldCheck,
  Users,
  Shield,
  FolderOpen,
} from 'lucide-react';

const ROLE_DASHBOARD_ROUTES = {
  tenant: '/tenant/dashboard',
  owner: '/owner/dashboard',
  agent: '/agent/dashboard',
  maintenance: '/maintenance/dashboard',
  admin: '/admin/dashboard',
};

const ROLE_PROFILE_ROUTES = {
  tenant: '/tenant/profile',
  owner: '/owner/profile',
};

const ROLE_LABELS = {
  tenant: 'Tenant',
  owner: 'Property Owner',
  agent: 'Agent',
  maintenance: 'Maintenance',
  admin: 'Administrator',
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Reset avatar error when user changes or user.avatar_url changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar_url, user?.id]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dashboardRoute = user ? ROLE_DASHBOARD_ROUTES[user.role] || '/' : '/';
  const profileRoute = user ? ROLE_PROFILE_ROUTES[user.role] || '/settings' : '/settings';
  const avatarUrl = getMediaUrl(user?.avatar_url);

  const isActive = (path) => location.pathname === path;

  // Render safe avatar element (photo or styled initials)
  const renderAvatar = (sizeClass = 'w-7 h-7 text-xs') => {
    if (avatarUrl && !avatarError) {
      return (
        <img
          src={avatarUrl}
          alt={user?.full_name || 'User Avatar'}
          className="w-full h-full object-cover"
          onError={() => setAvatarError(true)}
        />
      );
    }
    if (user?.full_name) {
      return <span>{user.full_name.charAt(0).toUpperCase()}</span>;
    }
    return <User className="w-3.5 h-3.5 text-primary-700" />;
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-warm-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center group-hover:bg-primary-600 transition-colors shadow-warm-sm">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-warm-900">
              Rent<span className="text-primary-500">ora</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-primary-600 font-semibold' : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              Home
            </Link>

            <Link
              to="/properties"
              className={`text-sm font-medium transition-colors ${
                isActive('/properties') ? 'text-primary-600 font-semibold' : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              Find Homes
            </Link>

            {isAuthenticated && user?.role === 'tenant' && (
              <>
                <Link
                  to="/tenant/applications"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/tenant/applications')
                      ? 'text-primary-600 font-semibold'
                      : 'text-warm-600 hover:text-warm-900'
                  }`}
                >
                  My Applications
                </Link>

                <Link
                  to="/tenant/visits"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/tenant/visits')
                      ? 'text-primary-600 font-semibold'
                      : 'text-warm-600 hover:text-warm-900'
                  }`}
                >
                  My Visits
                </Link>

                <Link
                  to="/tenant/wishlist"
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                    isActive('/tenant/wishlist')
                      ? 'text-primary-600 font-semibold'
                      : 'text-warm-600 hover:text-warm-900'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-warm-400" />
                  <span>Saved</span>
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'owner' && (
              <>
                <Link
                  to="/owner/properties"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/owner/properties')
                      ? 'text-primary-600 font-semibold'
                      : 'text-warm-600 hover:text-warm-900'
                  }`}
                >
                  My Listings
                </Link>

                <Link
                  to="/owner/applications"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/owner/applications')
                      ? 'text-primary-600 font-semibold'
                      : 'text-warm-600 hover:text-warm-900'
                  }`}
                >
                  Applications
                </Link>

                <Link
                  to="/owner/visits"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/owner/visits')
                      ? 'text-primary-600 font-semibold'
                      : 'text-warm-600 hover:text-warm-900'
                  }`}
                >
                  Visits
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                    isActive('/admin/dashboard')
                      ? 'text-primary-600 font-semibold'
                      : 'text-warm-600 hover:text-warm-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-primary-500" />
                  <span>Admin Hub</span>
                </Link>

                <Link
                  to="/admin/properties"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/admin/properties')
                      ? 'text-primary-600 font-semibold'
                      : 'text-warm-600 hover:text-warm-900'
                  }`}
                >
                  Verification
                </Link>

                <Link
                  to="/admin/users"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/admin/users')
                      ? 'text-primary-600 font-semibold'
                      : 'text-warm-600 hover:text-warm-900'
                  }`}
                >
                  Users
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-warm-200">
                {/* Notification Bell */}
                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 text-warm-700 hover:text-warm-900 transition-colors p-1.5 rounded-lg hover:bg-warm-100"
                    aria-label="User menu"
                  >
                    <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden border border-primary-200 shrink-0">
                      {renderAvatar('w-7 h-7 text-xs')}
                    </div>
                    <span className="font-semibold text-xs max-w-[120px] truncate text-warm-900">
                      {user?.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-warm-400" />
                  </button>

                  {profileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-warm-lg border border-warm-200 py-1.5 z-20 overflow-hidden animate-fadeIn">
                        {/* Dropdown User Header */}
                        <div className="px-4 py-3 border-b border-warm-100 bg-warm-50/50 flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden border border-primary-200 shrink-0">
                            {renderAvatar('w-9 h-9 text-xs')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-warm-900 truncate">
                              {user?.full_name}
                            </p>
                            <p className="text-[11px] text-warm-500 truncate">{user?.email}</p>
                            <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-warm-200 text-warm-800 uppercase tracking-wide">
                              {ROLE_LABELS[user?.role] || user?.role}
                            </span>
                          </div>
                        </div>

                        {/* Dropdown Role Links */}
                        {user?.role === 'tenant' && (
                          <>
                            <Link
                              to="/tenant/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <User className="w-3.5 h-3.5 text-warm-400" />
                              <span>Profile</span>
                            </Link>

                            <Link
                              to="/tenant/applications"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-warm-400" />
                              <span>Applications</span>
                            </Link>

                            <Link
                              to="/tenant/visits"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <Calendar className="w-3.5 h-3.5 text-warm-400" />
                              <span>Visits</span>
                            </Link>

                            <Link
                              to="/tenant/wishlist"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <Heart className="w-3.5 h-3.5 text-warm-400" />
                              <span>Wishlist</span>
                            </Link>

                            <Link
                              to="/tenant/profile#documents"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-warm-400" />
                              <span>Documents</span>
                            </Link>
                          </>
                        )}

                        {user?.role === 'owner' && (
                          <>
                            <Link
                              to="/owner/properties"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <Building className="w-3.5 h-3.5 text-warm-400" />
                              <span>My Properties</span>
                            </Link>

                            <Link
                              to="/owner/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <User className="w-3.5 h-3.5 text-warm-400" />
                              <span>Profile</span>
                            </Link>

                            <Link
                              to="/owner/applications"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-warm-400" />
                              <span>Applications</span>
                            </Link>

                            <Link
                              to="/owner/visits"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <Calendar className="w-3.5 h-3.5 text-warm-400" />
                              <span>Visits</span>
                            </Link>

                            <Link
                              to="/owner/visit-availability"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <Calendar className="w-3.5 h-3.5 text-warm-400" />
                              <span>Weekly Availability</span>
                            </Link>

                            <Link
                              to="/owner/profile#documents"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-warm-400" />
                              <span>Documents</span>
                            </Link>
                          </>
                        )}

                        {user?.role === 'admin' && (
                          <>
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <Shield className="w-3.5 h-3.5 text-warm-400" />
                              <span>Dashboard</span>
                            </Link>

                            <Link
                              to="/admin/properties"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-warm-400" />
                              <span>Properties</span>
                            </Link>

                            <Link
                              to="/admin/users"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <Users className="w-3.5 h-3.5 text-warm-400" />
                              <span>Users</span>
                            </Link>

                            <Link
                              to="/admin/documents"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-warm-400" />
                              <span>Documents</span>
                            </Link>
                          </>
                        )}

                        {/* Other roles fallback */}
                        {user?.role !== 'tenant' && user?.role !== 'owner' && user?.role !== 'admin' && (
                          <Link
                            to={dashboardRoute}
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                          >
                            <Home className="w-3.5 h-3.5 text-warm-400" />
                            <span>Dashboard</span>
                          </Link>
                        )}

                        <div className="border-t border-warm-100 my-1" />

                        <Link
                          to="/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-warm-700 hover:bg-warm-50 transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5 text-warm-400" />
                          <span>Settings</span>
                        </Link>

                        <div className="border-t border-warm-100 my-1" />

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-brick-600 hover:bg-brick-50 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login" className="btn-secondary !py-1.5 !px-3.5 text-xs">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary !py-1.5 !px-3.5 text-xs">
                  Join Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-warm-600 hover:text-warm-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-warm-200 px-4 py-4 space-y-2 animate-fadeIn">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
          >
            Home
          </Link>

          <Link
            to="/properties"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
          >
            Find Homes
          </Link>

          {isAuthenticated ? (
            <>
              {user?.role === 'tenant' && (
                <>
                  <Link
                    to="/tenant/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Profile
                  </Link>

                  <Link
                    to="/tenant/applications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Applications
                  </Link>

                  <Link
                    to="/tenant/visits"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Visits
                  </Link>

                  <Link
                    to="/tenant/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Wishlist
                  </Link>

                  <Link
                    to="/tenant/profile#documents"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Documents
                  </Link>
                </>
              )}

              {user?.role === 'owner' && (
                <>
                  <Link
                    to="/owner/properties"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    My Properties
                  </Link>

                  <Link
                    to="/owner/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Profile
                  </Link>

                  <Link
                    to="/owner/applications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Applications
                  </Link>

                  <Link
                    to="/owner/visits"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Visits
                  </Link>

                  <Link
                    to="/owner/visit-availability"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Weekly Availability
                  </Link>

                  <Link
                    to="/owner/profile#documents"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Documents
                  </Link>
                </>
              )}

              {user?.role === 'admin' && (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/admin/properties"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Properties
                  </Link>

                  <Link
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Users
                  </Link>

                  <Link
                    to="/admin/documents"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
                  >
                    Documents
                  </Link>
                </>
              )}

              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-warm-700 hover:text-primary-600 font-medium py-1.5 text-sm"
              >
                Settings
              </Link>

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 text-brick-600 font-semibold py-2 text-xs border-t border-warm-100 mt-2 pt-3"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-3 border-t border-warm-100">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-secondary text-center text-xs"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary text-center text-xs"
              >
                Join Free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
