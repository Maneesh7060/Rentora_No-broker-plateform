import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Auth Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';
import NotFoundPage from './pages/public/NotFoundPage';
import PropertiesPage from './pages/public/PropertiesPage';
import PropertyDetailsPage from './pages/public/PropertyDetailsPage';
import SettingsPage from './pages/public/SettingsPage';

// Tenant Pages
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantProfilePage from './pages/tenant/TenantProfilePage';
import TenantApplicationsPage from './pages/tenant/TenantApplicationsPage';
import TenantApplicationDetailsPage from './pages/tenant/TenantApplicationDetailsPage';
import TenantWishlistPage from './pages/tenant/TenantWishlistPage';
import TenantVisitsPage from './pages/tenant/TenantVisitsPage';
import TenantVisitDetailsPage from './pages/tenant/TenantVisitDetailsPage';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerProfilePage from './pages/owner/OwnerProfilePage';
import OwnerPropertiesPage from './pages/owner/OwnerPropertiesPage';
import OwnerApplicationsPage from './pages/owner/OwnerApplicationsPage';
import OwnerVisitsPage from './pages/owner/OwnerVisitsPage';
import OwnerAvailabilityPage from './pages/owner/OwnerAvailabilityPage';

// Other Role Dashboards
import AgentDashboard from './pages/agent/AgentDashboard';
import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage';
import AdminPropertyDetailsPage from './pages/admin/AdminPropertyDetailsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage';

/**
 * MainLayout — wraps pages with Navbar + Footer.
 */
function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-50 text-warm-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ========================================
              PUBLIC ROUTES (with Navbar & Footer)
              ======================================== */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/:id" element={<PropertyDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Account Settings Route (All Authenticated Users) */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                TENANT ROUTES
                ======================================== */}
            <Route
              path="/tenant/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['tenant']}>
                    <TenantDashboard />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/profile"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['tenant']}>
                    <TenantProfilePage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/applications"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['tenant']}>
                    <TenantApplicationsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/applications/:id"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['tenant', 'owner', 'admin']}>
                    <TenantApplicationDetailsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/wishlist"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['tenant']}>
                    <TenantWishlistPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/visits"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['tenant']}>
                    <TenantVisitsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/visits/:id"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['tenant', 'owner', 'admin']}>
                    <TenantVisitDetailsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* ========================================
                OWNER ROUTES
                ======================================== */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['owner', 'admin']}>
                    <OwnerDashboard />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/profile"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['owner', 'admin']}>
                    <OwnerProfilePage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/properties"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['owner', 'admin']}>
                    <OwnerPropertiesPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/applications"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['owner', 'admin']}>
                    <OwnerApplicationsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/visits"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['owner', 'admin']}>
                    <OwnerVisitsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/visit-availability"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['owner', 'admin']}>
                    <OwnerAvailabilityPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* ========================================
                AGENT ROUTES
                ======================================== */}
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['agent']}>
                    <AgentDashboard />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* ========================================
                MAINTENANCE ROUTES
                ======================================== */}
            <Route
              path="/maintenance/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['maintenance']}>
                    <MaintenanceDashboard />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* ========================================
                ADMIN ROUTES
                ======================================== */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminDashboard />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/properties"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminPropertiesPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/properties/:id"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminPropertyDetailsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminDocumentsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* ========================================
                404 CATCH-ALL
                ======================================== */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
