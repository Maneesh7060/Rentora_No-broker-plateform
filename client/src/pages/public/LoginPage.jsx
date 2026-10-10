import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Home,
} from "lucide-react";

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect after authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role?.toLowerCase();
      const redirectTo =
        location.state?.from?.pathname || `/${role}/dashboard`;

      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(form);
      const loggedInUser = result?.data?.user;

      if (!loggedInUser) {
        throw new Error("Invalid login response from server.");
      }

      const role = loggedInUser.role?.toLowerCase();
      const redirectTo =
        location.state?.from?.pathname || `/${role}/dashboard`;

      navigate(redirectTo, {
        replace: true,
      });
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 px-4 py-12">
      <div className="w-full max-w-md">
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

          <h1 className="text-2xl font-bold text-warm-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-warm-500 text-sm mt-1">
            Sign in to manage your applications & properties
          </p>
        </div>

        {/* Card */}
        <div className="card !p-8 shadow-warm-md">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-brick-50 border border-brick-200 rounded-xl mb-5">
              <AlertCircle className="w-4 h-4 text-brick-600 flex-shrink-0" />
              <p className="text-xs font-medium text-brick-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5"
              >
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

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input-field !pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-700"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 flex items-center justify-center text-sm shadow-warm-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In to Rentora"
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-xs text-warm-500 mt-6 pt-5 border-t border-warm-100">
            Don't have an account yet?{" "}
            <Link
              to="/register"
              className="text-primary-600 font-semibold hover:text-primary-700"
            >
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}