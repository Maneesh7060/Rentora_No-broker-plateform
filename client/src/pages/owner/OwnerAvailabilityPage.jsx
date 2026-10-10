import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import visitService from '../../services/visitService';
import {
  Calendar,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Info,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const TIME_OPTIONS = [
  { value: '08:00:00', label: '08:00 AM' },
  { value: '08:30:00', label: '08:30 AM' },
  { value: '09:00:00', label: '09:00 AM' },
  { value: '09:30:00', label: '09:30 AM' },
  { value: '10:00:00', label: '10:00 AM' },
  { value: '10:30:00', label: '10:30 AM' },
  { value: '11:00:00', label: '11:00 AM' },
  { value: '11:30:00', label: '11:30 AM' },
  { value: '12:00:00', label: '12:00 PM' },
  { value: '12:30:00', label: '12:30 PM' },
  { value: '13:00:00', label: '01:00 PM' },
  { value: '13:30:00', label: '01:30 PM' },
  { value: '14:00:00', label: '02:00 PM' },
  { value: '14:30:00', label: '02:30 PM' },
  { value: '15:00:00', label: '03:00 PM' },
  { value: '15:30:00', label: '03:30 PM' },
  { value: '16:00:00', label: '04:00 PM' },
  { value: '16:30:00', label: '04:30 PM' },
  { value: '17:00:00', label: '05:00 PM' },
  { value: '17:30:00', label: '05:30 PM' },
  { value: '18:00:00', label: '06:00 PM' },
  { value: '18:30:00', label: '06:30 PM' },
  { value: '19:00:00', label: '07:00 PM' },
  { value: '19:30:00', label: '07:30 PM' },
  { value: '20:00:00', label: '08:00 PM' },
];

const DEFAULT_DAYS = [
  { day_of_week: 1, day_name: 'Monday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
  { day_of_week: 2, day_name: 'Tuesday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
  { day_of_week: 3, day_name: 'Wednesday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
  { day_of_week: 4, day_name: 'Thursday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
  { day_of_week: 5, day_name: 'Friday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
  { day_of_week: 6, day_name: 'Saturday', start_time: '10:00:00', end_time: '14:00:00', is_active: true },
  { day_of_week: 0, day_name: 'Sunday', start_time: '10:00:00', end_time: '14:00:00', is_active: false },
];

export default function OwnerAvailabilityPage() {
  const [schedule, setSchedule] = useState(DEFAULT_DAYS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await visitService.getOwnerAvailability();
        if (res?.data?.schedule && res.data.schedule.length > 0) {
          // Sort Mon (1) to Sat (6), then Sun (0)
          const sorted = [...res.data.schedule].sort((a, b) => {
            const aDay = a.day_of_week === 0 ? 7 : a.day_of_week;
            const bDay = b.day_of_week === 0 ? 7 : b.day_of_week;
            return aDay - bDay;
          });
          setSchedule(sorted);
        }
      } catch (err) {
        console.error('Failed to load availability:', err);
        setError('Failed to retrieve current schedule. Default template loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const handleToggleDay = (dayIndex) => {
    setSchedule((prev) =>
      prev.map((item, idx) =>
        idx === dayIndex ? { ...item, is_active: !item.is_active } : item
      )
    );
    setSaveSuccess(false);
  };

  const handleTimeChange = (dayIndex, field, value) => {
    setSchedule((prev) =>
      prev.map((item, idx) =>
        idx === dayIndex ? { ...item, [field]: value } : item
      )
    );
    setSaveSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await visitService.updateOwnerAvailability({ schedule });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to save availability:', err);
      setError(err.response?.data?.message || 'Failed to save availability schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to="/owner/visits"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Visit Requests</span>
        </Link>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Weekly Visit Availability
            </h1>
            <p className="text-warm-600 text-xs sm:text-sm mt-1">
              Configure your available days and working hours for prospective tenant property tours.
            </p>
          </div>
        </div>

        {/* Informative Explanation Banner */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-warm-200 shadow-warm-sm mb-6 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs text-warm-600 leading-relaxed space-y-1">
            <p className="font-bold text-warm-900">How visit slot scheduling works:</p>
            <p>
              When a tenant selects a date, Rentora automatically generates <strong>30-minute booking intervals</strong> within your active hours. Any slots already booked or requested will automatically appear disabled for other prospective tenants.
            </p>
          </div>
        </div>

        {/* Success / Error Messages */}
        {saveSuccess && (
          <div className="p-4 bg-sage-50 border border-sage-200 rounded-2xl text-xs text-sage-800 font-semibold mb-6 flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-sage-600 shrink-0" />
            <span>Your weekly visit availability schedule has been updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-brick-50 border border-brick-200 rounded-2xl text-xs text-brick-700 font-semibold mb-6 flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-brick-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Schedule Form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-warm-200 p-5 sm:p-7 shadow-warm-sm space-y-6">
          <div className="space-y-3 divide-y divide-warm-100">
            {schedule.map((day, idx) => {
              return (
                <div
                  key={day.day_of_week}
                  className={`pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition-all ${
                    day.is_active ? 'bg-warm-50/60' : 'bg-warm-100/30 opacity-70'
                  }`}
                >
                  {/* Day Name & Toggle */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.is_active}
                        onChange={() => handleToggleDay(idx)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-warm-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-warm-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>

                    <span className={`font-bold text-xs sm:text-sm ${day.is_active ? 'text-warm-900' : 'text-warm-400 line-through'}`}>
                      {day.day_name}
                    </span>
                  </div>

                  {/* Hours Selectors */}
                  {day.is_active ? (
                    <div className="flex items-center gap-2 text-xs flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-warm-200">
                        <Clock className="w-3.5 h-3.5 text-warm-400" />
                        <select
                          value={day.start_time.length === 5 ? `${day.start_time}:00` : day.start_time}
                          onChange={(e) => handleTimeChange(idx, 'start_time', e.target.value)}
                          className="font-semibold text-warm-800 bg-transparent outline-none cursor-pointer"
                        >
                          {TIME_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <span className="text-warm-400 text-xs font-semibold px-1">to</span>

                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-warm-200">
                        <Clock className="w-3.5 h-3.5 text-warm-400" />
                        <select
                          value={day.end_time.length === 5 ? `${day.end_time}:00` : day.end_time}
                          onChange={(e) => handleTimeChange(idx, 'end_time', e.target.value)}
                          className="font-semibold text-warm-800 bg-transparent outline-none cursor-pointer"
                        >
                          {TIME_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-warm-400 font-medium italic">
                      Unavailable for visits
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save Action */}
          <div className="pt-4 border-t border-warm-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSchedule(DEFAULT_DAYS)}
              className="text-xs text-warm-500 hover:text-warm-900 font-medium hover:underline inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset to Default Working Hours
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary !py-2.5 !px-6 text-xs font-bold inline-flex items-center gap-2 shadow-warm-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Schedule...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Availability</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
