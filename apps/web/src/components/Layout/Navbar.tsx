import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Button } from '../ui/Button';
import { Bell, User, LogOut, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'DOCTOR':
        return '/doctor/dashboard';
      case 'CLINIC_STAFF':
        return '/clinic/dashboard';
      case 'SUPPORT_AGENT':
        return '/agent/workspace';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg"></div>
            <span className="font-bold text-xl text-gray-900">CareSync</span>
          </Link>

          {/* Search bar - only for patients */}
          {user?.role === 'PATIENT' && (
            <div className="flex-1 max-w-md mx-8">
              <input
                type="text"
                placeholder="Search doctors, specialties..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Dashboard Link */}
                <Link to={getDashboardLink()}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Button>
                </Link>

                <button className="relative p-2 text-gray-600 hover:text-primary-600">
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
                </button>
                <div className="flex items-center space-x-2 pl-4 border-l border-gray-300">
                  <User size={20} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({user.role})</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut size={16} />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
