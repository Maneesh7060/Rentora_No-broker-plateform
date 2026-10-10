import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import documentService from '../../services/documentService';
import { getMediaUrl } from '../../utils/mediaUtils';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  UploadCloud,
  Trash2,
  Loader2,
  X,
  ShieldCheck,
  Building,
  Save,
} from 'lucide-react';

const DOC_TYPE_LABELS = {
  IDENTITY: 'Identity Proof (Aadhaar / Passport / Voter ID)',
  ADDRESS_PROOF: 'Current Address Proof (Utility Bill / Rent Agreement)',
  INCOME_PROOF: 'Income Proof (Salary Slip / Bank Statement)',
  RENTAL_DOCUMENT: 'Rental References / Prior Agreement',
  OTHER: 'Other Supporting Document',
};

export default function TenantProfilePage() {
  const { user: authUser, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState({ percentage: 0, missingFields: [] });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    city: '',
    state: '',
    address: '',
  });

  // Document upload state
  const [selectedDocType, setSelectedDocType] = useState('IDENTITY');
  const [docFile, setDocFile] = useState(null);

  // Alerts
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);
  const docFileInputRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, docRes] = await Promise.all([
        userService.getProfile().catch(() => null),
        documentService.getMyDocuments().catch(() => null),
      ]);

      if (profRes?.data?.user) {
        setProfile(profRes.data.user);
        setCompletion(profRes.data.completion || { percentage: 0, missingFields: [] });
        setFormData({
          full_name: profRes.data.user.full_name || '',
          phone: profRes.data.user.phone || '',
          bio: profRes.data.user.bio || '',
          city: profRes.data.user.city || '',
          state: profRes.data.user.state || '',
          address: profRes.data.user.address || '',
        });
      }

      if (docRes?.data?.documents) {
        setDocuments(docRes.data.documents);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
      setErrorMsg('Could not load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Please upload a valid image (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 5 MB.');
      return;
    }

    try {
      setUploadingAvatar(true);
      setErrorMsg(null);
      const data = new FormData();
      data.append('avatar', file);

      const res = await userService.uploadAvatar(data);
      if (res?.data?.user) {
        setProfile(res.data.user);
        setCompletion(res.data.completion);
        if (updateUser) updateUser(res.data.user);
        setSuccessMsg('Profile photo updated successfully!');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      const res = await userService.updateProfile(formData);
      if (res?.data?.user) {
        setProfile(res.data.user);
        setCompletion(res.data.completion);
        if (updateUser) updateUser(res.data.user);
        setIsEditing(false);
        setSuccessMsg('Profile details saved successfully!');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    try {
      setUploadingDoc(true);
      setErrorMsg(null);
      const data = new FormData();
      data.append('document', docFile);
      data.append('document_type', selectedDocType);

      const res = await documentService.uploadDocument(data);
      if (res?.data?.document) {
        setDocuments([res.data.document, ...documents]);
        setDocFile(null);
        if (docFileInputRef.current) docFileInputRef.current.value = '';
        setSuccessMsg('Document uploaded for verification review.');
      }
    } catch (err) {
      console.error('Doc upload error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    try {
      await documentService.deleteDocument(docId);
      setDocuments(documents.filter((d) => d.id !== docId));
      setSuccessMsg('Document deleted.');
    } catch (err) {
      console.error('Delete doc error:', err);
      setErrorMsg('Failed to delete document.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-warm-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-warm-600 text-sm font-medium">Loading your profile...</p>
      </div>
    );
  }

  const avatarSrc = getMediaUrl(profile?.avatar_url);

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Tenant Profile & Verification
            </h1>
            <p className="text-warm-600 text-sm mt-1">
              Manage your personal background, contact information, and rental verification records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/settings" className="btn-secondary !py-2.5 text-xs">
              Account Settings
            </Link>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-primary !py-2.5 text-xs inline-flex items-center gap-1.5 shadow-warm-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary !py-2.5 text-xs inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Editing</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Profile Completion Card */}
          <div className="space-y-6">
            {/* Identity Card */}
            <div className="card !p-6 text-center relative overflow-hidden">
              <div className="relative w-28 h-28 mx-auto mb-4 group">
                <div className="w-28 h-28 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-3xl overflow-hidden border-2 border-warm-200 shadow-warm-sm">
                  {avatarSrc && !avatarError ? (
                    <img
                      src={avatarSrc}
                      alt={profile?.full_name || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span>{profile?.full_name?.[0]?.toUpperCase() || 'T'}</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-warm-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                  title="Upload profile photo"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-semibold">Change Photo</span>
                    </>
                  )}
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              <h2 className="text-lg font-bold text-warm-900">{profile?.full_name}</h2>
              <p className="text-xs text-warm-500 mt-0.5">{profile?.email}</p>

              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-primary-50 text-primary-700 border border-primary-100">
                  <User className="w-3 h-3" /> Tenant
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-sage-50 text-sage-700 border border-sage-100">
                  <ShieldCheck className="w-3 h-3" /> {profile?.account_status || 'ACTIVE'}
                </span>
              </div>

              <div className="border-t border-warm-100 mt-5 pt-4 text-left space-y-2.5 text-xs text-warm-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                  <span>{profile?.phone || 'No phone number provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                  <span>
                    {profile?.city ? `${profile.city}, ${profile.state || 'India'}` : 'Location not set'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                  <span>
                    Joined {new Date(profile?.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Completion Card (Part 5) */}
            <div className="card !p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-warm-900">Profile Completion</h3>
                <span className="text-sm font-bold text-primary-600">{completion.percentage}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-warm-200 overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>

              {completion.missingFields?.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-warm-500 font-medium">To reach 100% complete, add:</p>
                  <ul className="space-y-1 text-xs text-warm-700">
                    {completion.missingFields.map((field, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-secondary w-full !py-2 text-xs mt-3 font-semibold"
                    >
                      Complete Profile
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-sage-50 rounded-xl border border-sage-200 text-xs text-sage-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                  <span>Your profile is fully completed!</span>
                </div>
              )}
            </div>
          </div>

          {/* Right 2 Columns: Edit Form / Overview & Documents */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Information / Edit Form */}
            <div className="card !p-6 sm:!p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-warm-100">
                <div>
                  <h2 className="text-lg font-bold text-warm-900">Personal Details</h2>
                  <p className="text-xs text-warm-500">
                    {isEditing ? 'Update your personal profile information' : 'Your public and contact profile details'}
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-warm-900 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-warm-300 focus:border-primary-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-warm-900 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full text-xs p-2.5 rounded-lg border border-warm-300 focus:border-primary-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-warm-900 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Noida / Greater Noida"
                        className="w-full text-xs p-2.5 rounded-lg border border-warm-300 focus:border-primary-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-warm-900 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="e.g. Uttar Pradesh"
                        className="w-full text-xs p-2.5 rounded-lg border border-warm-300 focus:border-primary-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-900 mb-1">Current Residential Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Flat 402, Tower B, Sector 62"
                      className="w-full text-xs p-2.5 rounded-lg border border-warm-300 focus:border-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-900 mb-1">Bio / About Me</label>
                    <textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Share a short introduction about yourself, your profession, and tenancy preferences."
                      className="w-full text-xs p-2.5 rounded-lg border border-warm-300 focus:border-primary-500 outline-none resize-none"
                      maxLength={500}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="btn-secondary !py-2 !px-4 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary !py-2 !px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-warm-sm"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Bio / Introduction</span>
                    <p className="text-sm text-warm-800 mt-1 leading-relaxed whitespace-pre-line">
                      {profile?.bio || 'No bio written yet. Add a short introduction to increase landlord approval speed.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-warm-100">
                    <div>
                      <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Email</span>
                      <p className="text-xs font-semibold text-warm-900 mt-0.5">{profile?.email}</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Phone Number</span>
                      <p className="text-xs font-semibold text-warm-900 mt-0.5">{profile?.phone || 'Not provided'}</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">City & State</span>
                      <p className="text-xs font-semibold text-warm-900 mt-0.5">
                        {profile?.city ? `${profile.city}, ${profile.state}` : 'Not provided'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Residential Address</span>
                      <p className="text-xs font-semibold text-warm-900 mt-0.5">{profile?.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Management & Verification Section (Part 20 & 21) */}
            <div id="documents" className="card !p-6 sm:!p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-warm-100">
                <div>
                  <h2 className="text-lg font-bold text-warm-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <span>Rental Documents & Verification</span>
                  </h2>
                  <p className="text-xs text-warm-500">
                    Upload identification and income proof documents to fast-track rental approvals.
                  </p>
                </div>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleUploadDoc} className="p-4 rounded-xl bg-warm-50/70 border border-warm-200 space-y-3">
                <h4 className="font-bold text-xs text-warm-900">Upload New Supporting Document</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-warm-600 mb-1">Document Type</label>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-warm-300 bg-white outline-none focus:border-primary-500"
                    >
                      {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-warm-600 mb-1">Select File (PDF, PNG, JPG)</label>
                    <input
                      type="file"
                      ref={docFileInputRef}
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="w-full text-xs p-1.5 rounded-lg border border-warm-300 bg-white outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={uploadingDoc || !docFile}
                    className="btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    <span>Upload Document</span>
                  </button>
                </div>
              </form>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-warm-900">Your Uploaded Documents ({documents.length})</h4>

                {documents.length === 0 ? (
                  <div className="text-center py-8 bg-warm-50/50 rounded-xl border border-dashed border-warm-200">
                    <FileText className="w-8 h-8 text-warm-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-warm-700">No documents uploaded yet</p>
                    <p className="text-[11px] text-warm-500 mt-0.5">
                      Upload your Aadhaar / Identity or Salary slip to verify your tenant profile.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-warm-100 border border-warm-200 rounded-xl overflow-hidden bg-white">
                    {documents.map((doc) => {
                      const isVerified = doc.status === 'VERIFIED';
                      const isRejected = doc.status === 'REJECTED';
                      const isPending = doc.status === 'PENDING';

                      const statusBadgeClass = isVerified
                        ? 'bg-sage-50 text-sage-700 border-sage-200'
                        : isRejected
                        ? 'bg-brick-50 text-brick-700 border-brick-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200';

                      const fileHref = doc.file_url?.startsWith('http')
                        ? doc.file_url
                        : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${doc.file_url}`;

                      return (
                        <div key={doc.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-warm-50/50 transition-colors">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <a
                                href={fileHref}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-xs text-warm-900 hover:text-primary-600 transition-colors truncate block"
                              >
                                {doc.file_name}
                              </a>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-warm-500 mt-0.5">
                                <span className="font-medium text-warm-700">{doc.document_type?.replace('_', ' ')}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                              {isRejected && doc.rejection_reason && (
                                <p className="text-[11px] text-brick-600 mt-1 font-medium bg-brick-50 p-1.5 rounded">
                                  Declined reason: {doc.rejection_reason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0 shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${statusBadgeClass}`}>
                              {doc.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-1.5 text-warm-400 hover:text-brick-600 rounded hover:bg-warm-100 transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
