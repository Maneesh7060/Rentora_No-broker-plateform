import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitApplication } from '../../services/applicationService';

export default function ApplicationModal({ property, isOpen, onClose, onSuccess }) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    applicantName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    monthlyIncome: '',
    employmentStatus: 'employed',
    occupation: '',
    occupants: 1,
    moveInDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // default 1 week from now
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !property) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.applicantName || !formData.phone || !formData.email || !formData.monthlyIncome || !formData.moveInDate) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    const income = parseFloat(formData.monthlyIncome);
    if (isNaN(income) || income <= 0) {
      setError('Please enter a valid monthly income.');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitApplication({
        propertyId: property.id,
        applicantName: formData.applicantName,
        phone: formData.phone,
        email: formData.email,
        monthlyIncome: income,
        employmentStatus: formData.employmentStatus,
        occupation: formData.occupation,
        occupants: parseInt(formData.occupants, 10) || 1,
        moveInDate: formData.moveInDate,
        message: formData.message,
      });

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1600);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (amount) => {
    if (!amount) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-warm-lg border border-warm-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-warm-200 flex items-start justify-between bg-warm-50/50">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mb-2">
              Rental Application
            </span>
            <h2 className="text-xl font-semibold text-warm-900 leading-snug">
              Apply for {property.title}
            </h2>
            <p className="text-sm text-warm-600 mt-0.5">
              {property.locality ? `${property.locality}, ` : ''}{property.city} • <span className="font-semibold text-primary-600">{formatPrice(property.rent_amount)}/mo</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-warm-400 hover:text-warm-700 hover:bg-warm-100 rounded-lg transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content / Form */}
        <div className="p-6">
          {success ? (
            <div className="py-10 text-center">
              <div className="w-14 h-14 bg-sage-50 text-sage-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-sage-100">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-warm-900">Application Submitted!</h3>
              <p className="text-sm text-warm-600 mt-1 max-w-sm mx-auto">
                Your rental application has been received. The property owner will review your details and contact you.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-brick-50 border border-brick-100 rounded-lg text-sm text-brick-700 flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-brick-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                    Full Name <span className="text-brick-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="applicantName"
                    value={formData.applicantName}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                    Phone Number <span className="text-brick-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                  Email Address <span className="text-brick-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="e.g. user@example.com"
                />
              </div>

              {/* Employment & Income */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                    Monthly Income (₹) <span className="text-brick-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    required
                    min="1"
                    className="input-field"
                    placeholder="e.g. 65000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                    Employment Status
                  </label>
                  <select
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleChange}
                    className="select-field"
                  >
                    <option value="employed">Employed (Salaried)</option>
                    <option value="self_employed">Self-Employed</option>
                    <option value="business">Business Owner</option>
                    <option value="student">Student</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                    Profession / Employer
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g. Software Engineer, TCS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                    Occupants
                  </label>
                  <select
                    name="occupants"
                    value={formData.occupants}
                    onChange={handleChange}
                    className="select-field"
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                    <option value="5">5+ People</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                  Proposed Move-in Date <span className="text-brick-500">*</span>
                </label>
                <input
                  type="date"
                  name="moveInDate"
                  value={formData.moveInDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                  Message to Owner (Optional)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Introduce yourself, mention lease duration, questions, etc."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-warm-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Application</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
