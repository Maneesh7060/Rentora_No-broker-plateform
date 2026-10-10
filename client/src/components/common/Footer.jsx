import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Heart, ShieldCheck, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-warm-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-warm-100">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-warm-900">
                Rent<span className="text-primary-500">ora</span>
              </span>
            </Link>
            <p className="text-xs text-warm-500 leading-relaxed">
              Curated rental marketplace designed for modern urban living. Verified homes, seamless applications.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-900">Explore</h4>
            <ul className="space-y-2 text-xs text-warm-600">
              <li>
                <Link to="/properties" className="hover:text-primary-600 transition-colors">
                  All Properties
                </Link>
              </li>
              <li>
                <Link to="/properties?type=apartment" className="hover:text-primary-600 transition-colors">
                  Apartments & Flats
                </Link>
              </li>
              <li>
                <Link to="/properties?type=villa" className="hover:text-primary-600 transition-colors">
                  Villas & Independent Houses
                </Link>
              </li>
              <li>
                <Link to="/properties?furnishing=fully_furnished" className="hover:text-primary-600 transition-colors">
                  Furnished Homes
                </Link>
              </li>
            </ul>
          </div>

          {/* Tenants & Owners */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-900">Platform</h4>
            <ul className="space-y-2 text-xs text-warm-600">
              <li>
                <Link to="/tenant/dashboard" className="hover:text-primary-600 transition-colors">
                  Tenant Portal
                </Link>
              </li>
              <li>
                <Link to="/tenant/applications" className="hover:text-primary-600 transition-colors">
                  Track Applications
                </Link>
              </li>
              <li>
                <Link to="/owner/dashboard" className="hover:text-primary-600 transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link to="/owner/applications" className="hover:text-primary-600 transition-colors">
                  Owner Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-900">Safety & Trust</h4>
            <p className="text-xs text-warm-500 leading-relaxed">
              Every listing is verified by our team. Zero hidden fees and direct owner contact.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-sage-700 font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-sage-600" />
              <span>100% Verified Listings</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-warm-400">
          <p>© {currentYear} Rentora Technologies. Built with passion for human-centric renting.</p>
          <div className="flex items-center gap-4">
            <Link to="/properties" className="hover:text-warm-700 transition-colors">
              Browse
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:text-warm-700 transition-colors">
              Sign In
            </Link>
            <span>•</span>
            <Link to="/register" className="hover:text-warm-700 transition-colors">
              Register
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
