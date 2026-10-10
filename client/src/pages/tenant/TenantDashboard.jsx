import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTenantDashboardStats, getMyApplications } from '../../services/applicationService';
import visitService from '../../services/visitService';
import {
  Home,
  Heart,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  Building,
  MapPin,
  Loader2,
  Calendar,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { label: 'Approved', bg: 'bg-sage-50', text: 'text-sage-700', border: 'border-sage-200' },
  rejected: { label: 'Not Approved', bg: 'bg-brick-50', text: 'text-brick-700', border: 'border-brick-200' },
  withdrawn: { label: 'Withdrawn', bg: 'bg-warm-100', text: 'text-warm-700', border: 'border-warm-200' },
};

export default function TenantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    applications: { total: 0, pending: 0, approved: 0, rejected: 0, withdrawn: 0 },
    wishlistCount: 0,
  });
  const [visitStats, setVisitStats] = useState({ total: 0, pending: 0, approved: 0, completed: 0 });
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, appsRes, vStatsRes, vListRes] = await Promise.all([
          getTenantDashboardStats().catch(() => null),
          getMyApplications({ limit: 4 }).catch(() => null),
          visitService.getTenantVisitStats().catch(() => null),
          visitService.getMyVisits({ limit: 3 }).catch(() => null),
        ]);

        if (statsRes?.data) setStats(statsRes.data);
        if (appsRes?.data) setRecentApplications(appsRes.data);
        if (vStatsRes?.data?.stats) setVisitStats(vStatsRes.data.stats);
        if (vListRes?.data?.visits) setRecentVisits(vListRes.data.visits);
      } catch (err) {
        console.error('Failed to load tenant dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-warm-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-warm-600 text-sm font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Tenant'} 👋
            </h1>
            <p className="text-warm-600 text-sm mt-1">
              Manage your rental applications, saved homes, and property inquiries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/properties" className="btn-primary inline-flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Browse Properties</span>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card !p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-900">{stats.applications?.total || 0}</p>
              <p className="text-xs font-medium text-warm-500">Total Applications</p>
            </div>
          </div>

          <div className="card !p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-900">{stats.applications?.pending || 0}</p>
              <p className="text-xs font-medium text-warm-500">Pending Review</p>
            </div>
          </div>

          <Link to="/tenant/visits" className="card !p-5 flex items-center gap-4 hover:border-warm-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-900">
                {(visitStats.pending || 0) + (visitStats.approved || 0)}
              </p>
              <p className="text-xs font-medium text-warm-500">Scheduled Visits</p>
            </div>
          </Link>

          <Link to="/tenant/wishlist" className="card !p-5 flex items-center gap-4 hover:border-warm-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-brick-100 text-brick-700 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-900">{stats.wishlistCount || 0}</p>
              <p className="text-xs font-medium text-warm-500">Saved Homes</p>
            </div>
          </Link>
        </div>

        {/* Two Column Layout: Recent Applications & Quick Nav */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main: Recent Applications & Visits */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scheduled Visits Card */}
            {recentVisits.length > 0 && (
              <div className="card !p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-warm-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      <span>Upcoming Property Visits</span>
                    </h2>
                    <p className="text-xs text-warm-500">Your scheduled on-site property walkthroughs</p>
                  </div>
                  <Link
                    to="/tenant/visits"
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                  >
                    View All ({visitStats.total || recentVisits.length})
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-warm-100">
                  {recentVisits.map((visit) => {
                    const statusClass =
                      visit.status === 'APPROVED'
                        ? 'bg-sage-50 text-sage-700 border-sage-200'
                        : visit.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : visit.status === 'COMPLETED'
                        ? 'bg-primary-50 text-primary-700 border-primary-200'
                        : 'bg-warm-100 text-warm-600 border-warm-200';

                    return (
                      <div
                        key={visit.id}
                        className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-warm-50/50 p-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <Link
                              to={`/tenant/visits/${visit.id}`}
                              className="font-semibold text-sm text-warm-900 hover:text-primary-600 transition-colors line-clamp-1"
                            >
                              {visit.property_title}
                            </Link>
                            <div className="flex items-center text-xs text-warm-500 mt-0.5 gap-2">
                              <span>
                                {new Date(visit.visit_date).toLocaleDateString('en-IN', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                              <span>•</span>
                              <span>
                                {visit.start_time?.slice(0, 5)} - {visit.end_time?.slice(0, 5)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${statusClass}`}
                          >
                            {visit.status}
                          </span>
                          <Link
                            to={`/tenant/visits/${visit.id}`}
                            className="p-1.5 text-warm-400 hover:text-warm-800 hover:bg-warm-100 rounded-lg transition-colors"
                            title="View Visit Details"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card !p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-warm-900">Recent Applications</h2>
                  <p className="text-xs text-warm-500">Your most recent rental requests</p>
                </div>
                <Link
                  to="/tenant/applications"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                  View All ({stats.applications?.total || 0})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentApplications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-warm-100 text-warm-400 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-warm-800">No applications submitted yet</h3>
                  <p className="text-xs text-warm-500 mt-1 max-w-sm mx-auto">
                    Browse rental listings and click &apos;Apply for Rent&apos; on any home you like to get started.
                  </p>
                  <Link to="/properties" className="btn-primary mt-4 inline-flex text-xs !py-2">
                    Explore Properties
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-warm-100">
                  {recentApplications.map((app) => {
                    const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                    return (
                      <div
                        key={app.id}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-warm-50/50 p-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-warm-200 text-warm-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Building className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <Link
                              to={`/tenant/applications/${app.id}`}
                              className="font-semibold text-sm text-warm-900 hover:text-primary-600 transition-colors line-clamp-1"
                            >
                              {app.property_title}
                            </Link>
                            <div className="flex items-center text-xs text-warm-500 mt-0.5 gap-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-warm-400" />
                                {app.locality ? `${app.locality}, ` : ''}{app.city}
                              </span>
                              <span>•</span>
                              <span>₹{Number(app.rent_amount).toLocaleString('en-IN')}/mo</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                          >
                            {statusConf.label}
                          </span>
                          <Link
                            to={`/tenant/applications/${app.id}`}
                            className="p-1.5 text-warm-400 hover:text-warm-800 hover:bg-warm-100 rounded-lg transition-colors"
                            title="View Application Details"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Quick Shortcuts */}
          <div className="space-y-6">
            <div className="card !p-6 space-y-4">
              <h2 className="text-base font-bold text-warm-900">Quick Actions</h2>

              <Link
                to="/tenant/visits"
                className="flex items-center justify-between p-3.5 rounded-xl border border-warm-200 hover:border-warm-300 hover:bg-warm-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-warm-900">Scheduled Visits</h3>
                    <p className="text-[11px] text-warm-500">
                      {(visitStats.pending || 0) + (visitStats.approved || 0)} active visits
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-warm-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/tenant/wishlist"
                className="flex items-center justify-between p-3.5 rounded-xl border border-warm-200 hover:border-warm-300 hover:bg-warm-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brick-50 text-brick-600 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-brick-500 text-brick-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-warm-900">Saved Wishlist</h3>
                    <p className="text-[11px] text-warm-500">{stats.wishlistCount || 0} homes saved</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-warm-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/tenant/applications"
                className="flex items-center justify-between p-3.5 rounded-xl border border-warm-200 hover:border-warm-300 hover:bg-warm-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-warm-900">All Applications</h3>
                    <p className="text-[11px] text-warm-500">Track approvals & status</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-warm-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/properties"
                className="flex items-center justify-between p-3.5 rounded-xl border border-warm-200 hover:border-warm-300 hover:bg-warm-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sage-50 text-sage-600 flex items-center justify-center">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-warm-900">Find Rentals</h3>
                    <p className="text-[11px] text-warm-500">Explore verified listings</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-warm-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
