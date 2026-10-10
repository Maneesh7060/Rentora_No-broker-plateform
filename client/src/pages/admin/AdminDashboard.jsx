import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import {
  ShieldCheck,
  Building2,
  Users,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  FileCheck,
  Eye,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [statsRes, propsRes, docsRes] = await Promise.all([
          adminService.getStats().catch(() => null),
          adminService.getProperties({ verification_status: 'pending_verification', limit: 4 }).catch(() => null),
          adminService.getDocuments({ status: 'PENDING', limit: 4 }).catch(() => null),
        ]);

        if (statsRes?.data?.stats) {
          setStats(statsRes.data.stats);
        }
        if (propsRes?.data?.properties) {
          setPendingProperties(propsRes.data.properties);
        }
        if (docsRes?.data?.documents) {
          setPendingDocs(docsRes.data.documents);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-warm-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-warm-600 text-sm font-medium">Loading platform administration...</p>
      </div>
    );
  }

  const uStats = stats?.users || {};
  const pStats = stats?.properties || {};
  const aStats = stats?.applications || {};
  const vStats = stats?.visits || {};
  const dStats = stats?.documents || {};

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-primary-100 text-primary-800">
                Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Platform Moderation & Oversight
            </h1>
            <p className="text-warm-600 text-sm mt-1">
              Real-time platform metrics, property verification queues, user compliance, and document records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link to="/admin/properties" className="btn-secondary !py-2.5 text-xs inline-flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-warm-500" />
              <span>Properties ({pStats.pending_verification || 0} pending)</span>
            </Link>
            <Link to="/admin/users" className="btn-secondary !py-2.5 text-xs inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 text-warm-500" />
              <span>Users ({uStats.total_users || 0})</span>
            </Link>
            <Link to="/admin/documents" className="btn-primary !py-2.5 text-xs inline-flex items-center gap-1.5 shadow-warm-sm">
              <FileCheck className="w-4 h-4" />
              <span>Docs ({dStats.pending_documents || 0} pending)</span>
            </Link>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="card !p-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-warm-900">{uStats.total_users || 0}</p>
            <p className="text-xs font-medium text-warm-500 mt-0.5">Total Users</p>
            <p className="text-[11px] text-warm-400 mt-1">
              {uStats.total_tenants || 0} tenants • {uStats.total_owners || 0} owners
            </p>
          </div>

          <div className="card !p-4">
            <div className="w-10 h-10 rounded-xl bg-sage-50 text-sage-700 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-warm-900">{pStats.verified_properties || 0}</p>
            <p className="text-xs font-medium text-warm-500 mt-0.5">Verified Listings</p>
            <p className="text-[11px] text-warm-400 mt-1">
              {pStats.total_properties || 0} total properties
            </p>
          </div>

          <Link to="/admin/properties?verification_status=pending_verification" className="card !p-4 hover:border-primary-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-warm-900">{pStats.pending_verification || 0}</p>
            <p className="text-xs font-medium text-warm-500 mt-0.5">Pending Verification</p>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">
              Requires review →
            </p>
          </Link>

          <Link to="/admin/documents?status=PENDING" className="card !p-4 hover:border-primary-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brick-50 text-brick-700 flex items-center justify-center mb-3">
              <FileCheck className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-warm-900">{dStats.pending_documents || 0}</p>
            <p className="text-xs font-medium text-warm-500 mt-0.5">Pending Documents</p>
            <p className="text-[11px] text-brick-600 font-semibold mt-1">
              {dStats.total_documents || 0} total uploaded
            </p>
          </Link>

          <div className="card !p-4 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-warm-900">
              {(aStats.pending_applications || 0) + (vStats.pending_visits || 0)}
            </p>
            <p className="text-xs font-medium text-warm-500 mt-0.5">Active Inquiries</p>
            <p className="text-[11px] text-warm-400 mt-1">
              {aStats.total_applications || 0} apps • {vStats.total_visits || 0} visits
            </p>
          </div>
        </div>

        {/* Action Queues: Properties & Documents requiring moderation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. Pending Property Verification Queue */}
          <div className="card !p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-warm-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-600" />
                  <span>Properties Awaiting Verification</span>
                </h2>
                <p className="text-xs text-warm-500">Listings submitted by landlords awaiting review</p>
              </div>
              <Link
                to="/admin/properties?verification_status=pending_verification"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingProperties.length === 0 ? (
              <div className="text-center py-10 bg-warm-50/50 rounded-xl border border-dashed border-warm-200">
                <CheckCircle2 className="w-7 h-7 text-sage-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-warm-800">All property queues cleared</p>
                <p className="text-[11px] text-warm-500 mt-0.5">No properties are currently pending admin verification.</p>
              </div>
            ) : (
              <div className="divide-y divide-warm-100">
                {pendingProperties.map((prop) => (
                  <div key={prop.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/admin/properties/${prop.id}`}
                        className="font-semibold text-xs sm:text-sm text-warm-900 hover:text-primary-600 transition-colors truncate block"
                      >
                        {prop.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-warm-500 mt-0.5">
                        <span>{prop.city}, {prop.state}</span>
                        <span>•</span>
                        <span className="font-bold text-warm-700">₹{Number(prop.rent_amount).toLocaleString('en-IN')}/mo</span>
                        <span>•</span>
                        <span>By {prop.owner?.full_name}</span>
                      </div>
                    </div>

                    <Link
                      to={`/admin/properties/${prop.id}`}
                      className="btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Review</span>
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Pending Document Verification Queue */}
          <div className="card !p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-warm-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary-600" />
                  <span>Documents Awaiting Verification</span>
                </h2>
                <p className="text-xs text-warm-500">Identity and ownership proofs submitted by users</p>
              </div>
              <Link
                to="/admin/documents?status=PENDING"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingDocs.length === 0 ? (
              <div className="text-center py-10 bg-warm-50/50 rounded-xl border border-dashed border-warm-200">
                <CheckCircle2 className="w-7 h-7 text-sage-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-warm-800">All document queues cleared</p>
                <p className="text-[11px] text-warm-500 mt-0.5">No documents are currently pending verification.</p>
              </div>
            ) : (
              <div className="divide-y divide-warm-100">
                {pendingDocs.map((doc) => (
                  <div key={doc.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-xs sm:text-sm text-warm-900 truncate block">
                        {doc.file_name}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-warm-500 mt-0.5">
                        <span className="font-bold text-warm-700">{doc.document_type?.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{doc.user_name} ({doc.user_role})</span>
                      </div>
                    </div>

                    <Link
                      to="/admin/documents"
                      className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1 shrink-0 font-bold"
                    >
                      <span>Verify</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
