import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import propertyService from '../../services/propertyService';
import { getOwnerDashboardStats } from '../../services/applicationService';
import visitService from '../../services/visitService';
import PropertyFormModal from '../../components/property/PropertyFormModal';
import {
  Building2,
  Plus,
  FileText,
  TrendingUp,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Clock,
  Inbox,
  Loader2,
  Calendar,
} from 'lucide-react';

const STATUS_BADGES = {
  published: { label: 'Published', bg: 'bg-sage-50 text-sage-700 border-sage-200' },
  draft: { label: 'Draft', bg: 'bg-warm-100 text-warm-700 border-warm-200' },
  pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  rented: { label: 'Rented', bg: 'bg-primary-50 text-primary-700 border-primary-200' },
  rejected: { label: 'Rejected', bg: 'bg-brick-50 text-brick-700 border-brick-200' },
};

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [appStats, setAppStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [visitStats, setVisitStats] = useState({ total: 0, pending: 0, approved: 0, completed: 0 });
  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [propsRes, appsRes, vStatsRes] = await Promise.all([
        propertyService.getMyProperties({ limit: 4 }).catch(() => null),
        getOwnerDashboardStats().catch(() => null),
        visitService.getOwnerVisitStats().catch(() => null),
      ]);

      if (propsRes && propsRes.data) {
        setRecentProperties(propsRes.data.properties?.slice(0, 4) || []);
        setStats(propsRes.data.stats || null);
      }
      if (appsRes?.data) {
        setAppStats(appsRes.data);
      }
      if (vStatsRes?.data?.stats) {
        setVisitStats(vStatsRes.data.stats);
      }
    } catch (err) {
      console.error('Fetch owner dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateProperty = async (formData) => {
    setIsSubmitting(true);
    try {
      await propertyService.createProperty(formData);
      setIsModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error('Create property error:', err);
      alert(err.response?.data?.message || 'Failed to create property.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statCards = [
    {
      icon: Building2,
      label: 'My Properties',
      value: stats ? stats.total_properties : '—',
      color: 'text-primary-600 bg-primary-100',
      link: '/owner/properties',
    },
    {
      icon: Calendar,
      label: 'Visit Requests',
      value: visitStats.pending > 0 ? `${visitStats.pending} new` : visitStats.total || 0,
      color: 'text-primary-700 bg-primary-50',
      link: '/owner/visits',
    },
    {
      icon: Inbox,
      label: 'Pending Inquiries',
      value: appStats.pending,
      color: 'text-amber-600 bg-amber-100',
      link: '/owner/applications',
    },
    {
      icon: CheckCircle2,
      label: 'Published Live',
      value: stats ? stats.published_count : '—',
      color: 'text-sage-600 bg-sage-100',
      link: '/owner/properties',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-warm-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-warm-600 text-sm font-medium">Loading your owner dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Owner'} 👋
            </h1>
            <p className="text-warm-600 text-sm mt-1">
              Manage your rental listings, coordinate property visit requests, and review tenant applications.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              to="/owner/visits"
              className="btn-secondary !py-2.5 text-xs inline-flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-warm-500" />
              <span>Visits ({visitStats.pending} pending)</span>
            </Link>
            <Link
              to="/owner/visit-availability"
              className="btn-secondary !py-2.5 text-xs inline-flex items-center gap-1.5"
              title="Configure weekly visiting hours"
            >
              <Clock className="w-4 h-4 text-warm-500" />
              <span>Set Availability</span>
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary !py-2.5 text-xs inline-flex items-center gap-1.5 shadow-warm-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Property</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => {
            const Content = (
              <div className="card flex flex-col items-center text-center !p-5 transition-all hover:border-warm-300 h-full justify-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-bold text-warm-900">{stat.value}</p>
                <p className="text-xs text-warm-500 font-medium mt-1">{stat.label}</p>
              </div>
            );

            return stat.link ? (
              <Link key={stat.label} to={stat.link} className="block">
                {Content}
              </Link>
            ) : (
              <div key={stat.label}>{Content}</div>
            );
          })}
        </div>

        {/* Pending Visits Alert Banner */}
        {visitStats.pending > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-600 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-primary-950">
                  You have {visitStats.pending} pending visit request{visitStats.pending > 1 ? 's' : ''} from prospective tenants
                </h4>
                <p className="text-xs text-primary-800 mt-0.5">
                  Confirm or reschedule in-person property walkthrough slots.
                </p>
              </div>
            </div>
            <Link to="/owner/visits" className="btn-primary !py-2 text-xs">
              Manage Visits
            </Link>
          </div>
        )}

        {/* Applications Alert Banner if pending */}
        {appStats.pending > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900">
                  You have {appStats.pending} pending rental application{appStats.pending > 1 ? 's' : ''} waiting for review
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Review applicant profiles, monthly income, and move-in dates.
                </p>
              </div>
            </div>
            <Link to="/owner/applications" className="btn-primary !bg-amber-600 hover:!bg-amber-700 text-xs !py-2">
              Review Now
            </Link>
          </div>
        )}

        {/* Recent Properties Section */}
        <div className="card !p-6 sm:!p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-warm-900">Recent Property Listings</h2>
              <p className="text-xs text-warm-500">Your latest uploaded properties and their statuses</p>
            </div>
            <Link
              to="/owner/properties"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All ({stats?.total_properties || 0}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentProperties.map((prop) => {
                const badge = STATUS_BADGES[prop.status] || STATUS_BADGES.draft;
                return (
                  <div
                    key={prop.id}
                    className="p-4 rounded-xl border border-warm-200 bg-warm-50/50 hover:bg-warm-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] uppercase text-warm-500 font-medium">
                          {prop.property_type}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-warm-900 truncate">{prop.title}</h4>
                      <p className="text-xs text-warm-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-primary-500" /> {prop.city}, {prop.state}
                      </p>
                      <p className="text-xs font-bold text-primary-600 mt-1.5">
                        ₹{Number(prop.rent_amount).toLocaleString('en-IN')}/mo
                      </p>
                    </div>

                    <Link
                      to={`/properties/${prop.id}`}
                      target="_blank"
                      className="p-2 text-warm-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors shrink-0 border border-transparent hover:border-warm-200"
                      title="View Listing Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-warm-50 rounded-xl border border-dashed border-warm-300">
              <Building2 className="w-8 h-8 text-warm-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-warm-700">No properties uploaded yet</p>
              <p className="text-xs text-warm-500 mt-1 mb-4">
                Get started by publishing your first property rental listing.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary !py-2 !px-4 text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Property Now
              </button>
            </div>
          )}
        </div>

        {/* Property Form Modal */}
        <PropertyFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateProperty}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
