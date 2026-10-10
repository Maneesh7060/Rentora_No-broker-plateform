import { useAuth } from '../../context/AuthContext';
import { Users } from 'lucide-react';

export default function AgentDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Manage assigned properties and client visits.</p>
      </div>

      <div className="card bg-purple-50 border-purple-200 text-center">
        <Users className="w-8 h-8 text-purple-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-purple-900">Agent Dashboard</h3>
        <p className="text-sm text-purple-700 mt-1">
          Assigned properties, client visits, and lead management will be available in upcoming phases.
        </p>
      </div>
    </div>
  );
}
