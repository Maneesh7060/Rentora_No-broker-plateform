import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Home,
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'tenant', label: 'Tenant', description: 'Looking to rent a home' },
  { value: 'owner', label: 'Owner', description: 'List & manage properties' },
  { value: 'agent', label: 'Agent', description: 'Represent property owners' },
  { value: 'maintenance', label: 'Maintenance', description: 'Handle repair tickets' },
];

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'tenant',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.full_name || !form.email || !form.password) {
      setError('Full name, email, and password are required.');
      return;
    }
    if (form.full_name.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
      });
      const role = result.data.user.role;
      navigate(`/${role}/dashboard`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center group-hover:bg-primary-600 transition-colors shadow-warm-sm">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-warm-900">
              Rent<span className="text-primary-500">ora</span>
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-warm-900 tracking-tight">Create Your Account</h1>
          <p className="text-warm-500 text-sm mt-1">Join Rentora and begin your rental journey</p>
        </div>

        {/* Card */}
        <div className="card !p-8 shadow-warm-md">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-brick-50 border border-brick-200 rounded-xl mb-5">
              <AlertCircle className="w-4 h-4 text-brick-600 flex-shrink-0" />
              <p className="text-xs font-medium text-brick-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-2">
                I want to join as a...
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: option.value })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.role === option.value
                        ? 'border-primary-500 bg-primary-50/70 ring-1 ring-primary-500'
                        : 'border-warm-200 hover:border-warm-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        form.role === option.value ? 'text-primary-800' : 'text-warm-900'
                      }`}>
                        {option.label}
                      </span>
                      {form.role === option.value && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-warm-500 mt-0.5">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className="input-field"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-field"
                required
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                Phone Number <span className="text-warm-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="input-field"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="input-field !pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className="input-field"
                required
              />
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 text-sm shadow-warm-sm">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                'Create Rentora Account'
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-xs text-warm-500 mt-6 pt-5 border-t border-warm-100">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
