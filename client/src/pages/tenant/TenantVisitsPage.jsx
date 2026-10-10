import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import visitService from '../../services/visitService';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  Search,
  User,
  Phone,
  RotateCcw,
} from 'lucide-react';

const STATUS_BADGES = {
  PENDING: { label: 'Pending Approval', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  APPROVED: { label: 'Visit Confirmed', bg: 'bg-sage-50', text: 'text-sage-700', border: 'border-sage-200' },
  REJECTED: { label: 'Declined by Owner', bg: 'bg-brick-50', text: 'text-brick-700', border: 'border-brick-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-warm-100', text: 'text-warm-700', border: 'border-warm-200' },
  COMPLETED: { label: 'Tour Completed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

export default function TenantVisitsPage() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, completed: 0, cancelled: 0 });
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'completed' | 'cancelled'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await visitService.getMyVisits({
        status: activeTab === 'all' ? undefined : activeTab,
      });

      if (res?.data) {
        setVisits(res.data.visits || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load visits:', err);
      setError('Unable to load your visits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              My Scheduled Property Visits
            </h1>
            <p className="text-warm-600 text-xs sm:text-sm mt-1">
              Track in-person property tours, check owner confirmations, and view meeting details.
            </p>
          </div>

          <Link to="/properties" className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto text-xs font-semibold">
            <Search className="w-4 h-4" />
            <span>Find More Homes</span>
          </Link>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-warm-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-warm-900">{stats.total || 0}</p>
              <p className="text-xs text-warm-500 font-medium">Total Requests</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-warm-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-warm-900">{stats.pending || 0}</p>
              <p className="text-xs text-warm-500 font-medium">Pending Confirmation</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-warm-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-sage-100 text-sage-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-warm-900">{stats.approved || 0}</p>
              <p className="text-xs text-warm-500 font-medium">Confirmed Upcoming</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-warm-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-warm-900">{stats.completed || 0}</p>
              <p className="text-xs text-warm-500 font-medium">Completed Tours</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-warm-200 pb-3 mb-6 overflow-x-auto scrollbar-thin">
          {[
            { id: 'all', label: 'All Visits' },
            { id: 'pending', label: 'Pending Approval' },
            { id: 'approved', label: 'Confirmed' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-warm-sm'
                  : 'bg-white text-warm-700 border border-warm-200 hover:bg-warm-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visits Content List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-warm-500 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-warm-200">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span>Loading scheduled visits...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center bg-brick-50 border border-brick-200 rounded-2xl p-6 max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-brick-600 mx-auto mb-2" />
            <p className="text-xs text-brick-800 font-bold mb-3">{error}</p>
            <button onClick={fetchVisits} className="btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-warm-200 p-12 text-center max-w-lg mx-auto shadow-warm-sm">
            <div className="w-14 h-14 rounded-2xl bg-warm-100 text-warm-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-warm-900 mb-1">No property visits found</h3>
            <p className="text-xs text-warm-500 mb-6 max-w-sm mx-auto leading-relaxed">
              {activeTab === 'all'
                ? "You haven't scheduled any in-person property visits yet. Browse verified listings and book a tour slot with the owner."
                : `No visits currently matching the "${activeTab}" filter.`}
            </p>
            <Link to="/properties" className="btn-primary !py-2 !px-4 text-xs inline-flex items-center gap-1.5 shadow-warm-sm">
              <Search className="w-3.5 h-3.5" />
              <span>Explore Rental Homes</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => {
              const statusCfg = STATUS_BADGES[visit.status] || STATUS_BADGES.PENDING;
              const img = visit.property_images && visit.property_images[0] ? visit.property_images[0] : FALLBACK_IMAGE;
              const formattedDate = new Date(visit.visit_date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={visit.id}
                  className="bg-white rounded-2xl border border-warm-200 p-4 sm:p-5 shadow-warm-sm hover:shadow-warm-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Property Info + Image */}
                  <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                    <img
                      src={img}
                      alt={visit.property_title}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-warm-200"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                          {statusCfg.label}
                        </span>
                        <span className="text-[11px] text-warm-400">
                          ID: #{visit.id}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-warm-900 leading-snug line-clamp-1">
                        <Link to={`/properties/${visit.property_id}`} className="hover:text-primary-600 transition-colors">
                          {visit.property_title}
                        </Link>
                      </h3>

                      <p className="text-xs text-warm-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="truncate">
                          {visit.property_locality ? `${visit.property_locality}, ` : ''}{visit.property_city}
                        </span>
                      </p>

                      {/* Scheduled Time Banner */}
                      <div className="mt-2.5 flex items-center gap-3 text-xs flex-wrap">
                        <div className="flex items-center gap-1.5 font-semibold text-warm-800 bg-warm-50 px-2.5 py-1 rounded-lg border border-warm-100">
                          <Calendar className="w-3.5 h-3.5 text-primary-600" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100">
                          <Clock className="w-3.5 h-3.5 text-primary-600" />
                          <span>{visit.start_time.substring(0, 5)} - {visit.end_time.substring(0, 5)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Details */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-warm-100 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-warm-400 block">Monthly Rent</span>
                      <span className="text-sm sm:text-base font-bold text-warm-900">
                        ₹{Number(visit.property_rent).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <Link
                      to={`/tenant/visits/${visit.id}`}
                      className="btn-secondary !py-2 !px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 shadow-warm-sm"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
