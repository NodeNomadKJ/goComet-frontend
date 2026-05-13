import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* cookie cleared by backend even on error */ }
    logout();
    void navigate('/login');
  };

  return (
    <header className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tracking-tight">GOComet</span>
        <span className="text-xs text-gray-400">Ride Hailing Demo</span>
      </div>
      {isAuthenticated && user && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-300">{user.email}</span>
          <span className="bg-gray-700 px-2 py-0.5 rounded text-xs font-medium">{user.role}</span>
          <button
            onClick={() => void handleLogout()}
            className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
