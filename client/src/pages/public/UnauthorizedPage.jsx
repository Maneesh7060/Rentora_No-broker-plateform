import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>
        <p className="text-gray-500 mb-2">
          You don&apos;t have permission to access this page.
        </p>
        {user && (
          <p className="text-sm text-gray-400 mb-6">
            Signed in as <span className="font-medium text-gray-600">{user.email}</span> (role: <span className="font-medium text-gray-600">{user.role}</span>)
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Link to="/" className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          {user && (
            <Link to={`/${user.role}/dashboard`} className="btn-secondary">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
