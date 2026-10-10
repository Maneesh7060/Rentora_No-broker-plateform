import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import visitService from '../../services/visitService';
import {
  Calendar as CalendarIcon,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Send,
  Building2,
  ChevronRight,
  ShieldCheck,
  Info,
} from 'lucide-react';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

export default function ScheduleVisitModal({ property, isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Tomorrow as default date string (YYYY-MM-DD)
  const getTomorrowDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTomorrowDateStr());
  const [slotsData, setSlotsData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tenantMessage, setTenantMessage] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Generate next 14 days quick selector pills
  const nextDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i + 1));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('en-IN', { month: 'short' });
    return { dateStr, dayName, dayNum, monthName };
  });

  // Fetch slots whenever selectedDate or property changes
  useEffect(() => {
    if (!isOpen || !property?.id || !selectedDate) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const res = await visitService.getAvailableSlots({
          propertyId: property.id,
          date: selectedDate,
        });

        if (isMounted && res?.data) {
          setSlotsData(res.data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load slots:', err);
          setError(err.response?.data?.message || 'Unable to fetch available time slots.');
          setSlotsData(null);
        }
      } finally {
        if (isMounted) {
          setLoadingSlots(false);
        }
      }
    };

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [isOpen, property?.id, selectedDate]);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(getTomorrowDateStr());
      setSelectedSlot(null);
      setTenantMessage('');
      setError(null);
      setSuccessData(null);
    }
  }, [isOpen]);

  if (!isOpen || !property) return null;

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setError(null);
  };

  const handleSlotSelect = (slot) => {
    if (!slot.is_available) return;
    setSelectedSlot(slot);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onClose();
      navigate('/login', { state: { from: `/properties/${property.id}` } });
      return;
    }

    if (!selectedDate) {
      setError('Please select a visit date.');
      return;
    }

    if (!selectedSlot) {
      setError('Please select an available time slot.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await visitService.requestVisit({
        propertyId: property.id,
        visitDate: selectedDate,
        startTime: selectedSlot.start_time,
        endTime: selectedSlot.end_time,
        tenantMessage: tenantMessage.trim(),
      });

      if (res?.data?.visit) {
        setSuccessData(res.data.visit);
        if (onSuccess) onSuccess(res.data.visit);
      }
    } catch (err) {
      console.error('Submit visit request error:', err);
      setError(
        err.response?.data?.message || 'Failed to submit visit request. Please try another slot.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const displayImage =
    property.images && property.images.length > 0 ? property.images[0] : FALLBACK_IMAGE;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-warm-lg border border-warm-200 overflow-hidden flex flex-col max-h-[92vh] transition-all">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-warm-100 flex items-center justify-between bg-warm-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-warm-900 leading-tight">
                Schedule an In-Person Visit
              </h3>
              <p className="text-[11px] text-warm-500 mt-0.5">
                Choose an available slot for an on-site property tour
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-warm-400 hover:text-warm-700 hover:bg-warm-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-left">
          {/* Success State */}
          {successData ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sage-100 text-sage-600 flex items-center justify-center mx-auto shadow-warm-sm animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-warm-900">Visit Request Submitted!</h4>
                <p className="text-xs text-warm-600 max-w-sm mx-auto mt-1">
                  Your request has been forwarded to the property owner. You will receive an in-app notification once the owner confirms.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-warm-50 rounded-xl p-4 border border-warm-200 text-xs text-left space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-warm-500">Property:</span>
                  <span className="font-bold text-warm-900 text-right truncate max-w-[200px]">
                    {property.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-500">Scheduled Date:</span>
                  <span className="font-bold text-warm-900">
                    {new Date(successData.visit_date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-500">Time Slot:</span>
                  <span className="font-bold text-primary-600">
                    {selectedSlot?.label || `${successData.start_time} - ${successData.end_time}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-500">Status:</span>
                  <span className="font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    PENDING OWNER CONFIRMATION
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/tenant/visits');
                  }}
                  className="btn-primary !py-2 !px-4 text-xs inline-flex items-center gap-1.5"
                >
                  <span>View My Visits</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary !py-2 !px-4 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Property Snapshot */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-50 border border-warm-200">
                <img
                  src={displayImage}
                  alt={property.title}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-warm-900 truncate">
                    {property.title}
                  </h4>
                  <p className="text-[11px] text-warm-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
                    <span className="truncate">
                      {property.locality ? `${property.locality}, ` : ''}{property.city}
                    </span>
                  </p>
                  <p className="text-xs font-bold text-primary-600 mt-1">
                    ₹{Number(property.rent_amount).toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] text-warm-400 font-normal">/month</span>
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-brick-50 border border-brick-200 rounded-xl text-xs text-brick-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-brick-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Date Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-xs text-warm-900 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-primary-600" />
                    <span>1. Select Visit Date</span>
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    className="text-xs font-medium text-warm-700 bg-white border border-warm-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-primary-500 outline-none"
                  />
                </div>

                {/* Quick Date Pills (Horizontal scroll on mobile) */}
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                  {nextDays.slice(0, 7).map((item) => {
                    const isSelected = selectedDate === item.dateStr;
                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => handleDateSelect(item.dateStr)}
                        className={`px-3 py-2 rounded-xl text-center shrink-0 transition-all border ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-warm-sm ring-2 ring-primary-100'
                            : 'bg-white text-warm-700 border-warm-200 hover:border-warm-300 hover:bg-warm-50'
                        }`}
                      >
                        <span className="block text-[10px] uppercase font-semibold opacity-80">
                          {item.dayName}
                        </span>
                        <span className="block text-sm font-bold">{item.dayNum}</span>
                        <span className="block text-[9px] opacity-75">{item.monthName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Time Slots Grid */}
              <div>
                <label className="font-bold text-xs text-warm-900 flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-primary-600" />
                  <span>2. Select 30-Minute Time Slot</span>
                </label>

                {loadingSlots ? (
                  <div className="py-8 text-center text-xs text-warm-500 bg-warm-50/50 rounded-xl border border-warm-200 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    <span>Checking owner availability & booked slots...</span>
                  </div>
                ) : !slotsData?.is_available_day ? (
                  <div className="py-6 text-center text-xs text-warm-500 bg-warm-50 rounded-xl border border-warm-200 p-4">
                    <Info className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                    <p className="font-semibold text-warm-800">
                      {slotsData?.reason || 'Owner is not available for visits on this day.'}
                    </p>
                    <p className="text-[11px] text-warm-500 mt-1">
                      Please pick another day from the calendar above.
                    </p>
                  </div>
                ) : slotsData?.slots?.length === 0 ? (
                  <div className="py-6 text-center text-xs text-warm-500 bg-warm-50 rounded-xl border border-warm-200">
                    <p>No available slots for this date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {slotsData.slots.map((slot) => {
                      const isSelected = selectedSlot?.start_time === slot.start_time;
                      const isAvailable = slot.is_available;

                      return (
                        <button
                          key={slot.start_time}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => handleSlotSelect(slot)}
                          className={`p-2.5 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center border text-center ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-600 shadow-warm-sm ring-2 ring-primary-100'
                              : isAvailable
                              ? 'bg-white text-warm-800 border-warm-200 hover:border-primary-400 hover:bg-primary-50/40'
                              : 'bg-warm-100/60 text-warm-400 border-warm-100 cursor-not-allowed line-through'
                          }`}
                        >
                          <span>{slot.start_label}</span>
                          <span
                            className={`text-[10px] font-normal ${
                              isSelected ? 'text-white/80' : 'text-warm-400'
                            }`}
                          >
                            {!isAvailable ? (slot.is_booked ? 'Booked' : 'Passed') : '30 min'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Optional Message */}
              <div>
                <label className="font-bold text-xs text-warm-900 block mb-1.5">
                  3. Note for Owner (Optional)
                </label>
                <textarea
                  rows={2}
                  value={tenantMessage}
                  onChange={(e) => setTenantMessage(e.target.value)}
                  placeholder="e.g. Coming with family to inspect flat. Please confirm."
                  className="w-full text-xs p-3 rounded-xl border border-warm-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none bg-white"
                  maxLength={300}
                />
              </div>

              {/* Submit Row */}
              <div className="pt-2 border-t border-warm-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="btn-secondary !py-2.5 !px-4 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !selectedSlot || loadingSlots}
                  className="btn-primary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-warm-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Visit</span>
                    </>
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
