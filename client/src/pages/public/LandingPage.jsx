import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Search,
  Shield,
  MessageSquare,
  CreditCard,
  Wrench,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MapPin,
  Heart,
  FileCheck,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Search,
    title: 'Intuitive Property Search',
    description: 'Natural language queries, budget limits, bedroom types, and interactive Leaflet map exploration.',
  },
  {
    icon: Shield,
    title: '100% Verified Listings',
    description: 'Every flat, apartment, and house is vetted with verified ownership documents.',
  },
  {
    icon: FileCheck,
    title: 'Digital Applications',
    description: 'Apply with your financial profile, track owner reviews, and receive direct approvals.',
  },
  {
    icon: Heart,
    title: 'Persistent Wishlists',
    description: 'Save favorite homes across sessions and easily compare amenities and monthly rents.',
  },
  {
    icon: MessageSquare,
    title: 'Direct In-App Alerts',
    description: 'Real-time notifications for application statuses, owner updates, and listing changes.',
  },
  {
    icon: Home,
    title: 'Owner Management Hub',
    description: 'Publish listings, evaluate incoming tenant applications, and manage occupancy effortlessly.',
  },
];

const STEPS = [
  { step: '01', title: 'Explore Homes', description: 'Browse verified flats, apartments, and villas with transparent pricing.' },
  { step: '02', title: 'Save & Compare', description: 'Bookmark top choices to your personal wishlist for easy comparison.' },
  { step: '03', title: 'Submit Application', description: 'Apply digitally with your move-in date and financial details.' },
  { step: '04', title: 'Get Approved', description: 'Direct owner review, instant approval notifications, and seamless move-in.' },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-warm-50">
      {/* ============================== HERO ============================== */}
      <section className="relative bg-white border-b border-warm-200 overflow-hidden py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-xs font-semibold text-primary-800">
                <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                <span>The Modern Way to Rent</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-warm-900 leading-[1.1]">
                Find verified rentals <br className="hidden sm:inline" />
                <span className="text-primary-500 font-serif italic font-normal">without the hassle.</span>
              </h1>

              <p className="text-base sm:text-lg text-warm-600 max-w-xl leading-relaxed">
                Rentora connects verified tenants with authentic property owners across Greater Noida and top urban hubs. Zero spam, transparent pricing, and seamless digital applications.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/properties"
                  className="btn-primary !py-3 !px-7 text-sm flex items-center justify-center gap-2 shadow-warm-md"
                >
                  <Search className="w-4 h-4" />
                  <span>Browse Available Listings</span>
                </Link>

                {isAuthenticated ? (
                  <Link
                    to={`/${user?.role}/dashboard`}
                    className="btn-secondary !py-3 !px-6 text-sm flex items-center justify-center"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="btn-secondary !py-3 !px-6 text-sm flex items-center justify-center"
                  >
                    Create Free Account
                  </Link>
                )}
              </div>

              {/* Verified Trust Badges */}
              <div className="pt-6 border-t border-warm-100 flex flex-wrap items-center gap-6 text-xs text-warm-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sage-600" />
                  <span>100% Verified Owners</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sage-600" />
                  <span>Zero Middleman Spams</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sage-600" />
                  <span>Instant Application Tracking</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="bg-white rounded-2xl p-4 border border-warm-200 shadow-warm-lg space-y-4">
                  <div className="relative h-60 rounded-xl overflow-hidden bg-warm-100">
                    <img
                      src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
                      alt="Featured Flat"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-md text-xs font-bold text-warm-900 shadow-warm-sm">
                      Apartment
                    </div>
                    <div className="absolute bottom-3 left-3 bg-warm-950/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-bold">
                      ₹28,000 <span className="text-xs text-warm-300 font-normal">/ month</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-warm-900 text-sm">
                      Fully Furnished 2 BHK Flat in Gaur Yamuna City
                    </h3>
                    <p className="text-xs text-warm-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-500" />
                      Greater Noida, Uttar Pradesh
                    </p>
                  </div>

                  <div className="pt-2 border-t border-warm-100 flex items-center justify-between text-xs text-warm-600">
                    <span>2 Bedrooms • 2 Baths</span>
                    <Link
                      to="/properties"
                      className="text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== STATS ============================== */}
      <section className="bg-white border-b border-warm-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '500+', label: 'Verified Listings' },
              { value: '1,200+', label: 'Active Tenants' },
              { value: '98%', label: 'Application Response Rate' },
              { value: '4.9 ★', label: 'Tenant Satisfaction' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-warm-50/70 border border-warm-100">
                <p className="text-2xl sm:text-3xl font-bold text-warm-900">{stat.value}</p>
                <p className="text-xs text-warm-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== FEATURES ============================== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Built for Humans, Not Algorithms
            </h2>
            <p className="text-warm-600 text-sm mt-2">
              Everything you need for a straightforward, respectful rental experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="card !p-6 hover:border-warm-300 transition-all hover:shadow-warm-md"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-warm-900 text-base mb-1.5">{feature.title}</h3>
                <p className="text-xs text-warm-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== HOW IT WORKS ============================== */}
      <section className="bg-white border-y border-warm-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
              Simple 4-Step Process
            </h2>
            <p className="text-warm-600 text-sm mt-2">
              From finding your home to submitting digital applications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="p-6 rounded-2xl bg-warm-50 border border-warm-200 relative">
                <span className="text-2xl font-black text-primary-400 font-mono mb-3 block">
                  {s.step}
                </span>
                <h3 className="font-bold text-warm-900 text-sm mb-1.5">{s.title}</h3>
                <p className="text-xs text-warm-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-warm-900 rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-warm-lg">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Ready to find your next home?
            </h2>
            <p className="text-warm-300 text-sm max-w-xl mx-auto mb-6">
              Join hundreds of happy renters and verified property owners on Rentora.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/properties" className="btn-primary !bg-primary-500 hover:!bg-primary-600 !py-3 !px-6 text-sm">
                Explore Properties
              </Link>
              <Link to="/register" className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20 !py-3 !px-6 text-sm">
                Join Rentora Free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
