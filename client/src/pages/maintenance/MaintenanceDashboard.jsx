import { useAuth } from '../../context/AuthContext';
import { Wrench } from 'lucide-react';

export default function MaintenanceDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">View and manage your assigned maintenance tickets.</p>
      </div>

      <div className="card bg-amber-50 border-amber-200 text-center">
        <Wrench className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-amber-900">Maintenance Dashboard</h3>
        <p className="text-sm text-amber-700 mt-1">
          Work order queue, ticket management, and status updates will be available in upcoming phases.
        </p>
      </div>
    </div>
  );
}
