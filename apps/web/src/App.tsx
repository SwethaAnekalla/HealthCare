import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useAuthStore } from './store/auth';
import { apiClient } from './lib/api';
import { Navbar } from './components/Layout/Navbar';

// Lazy load pages for code-splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const AgentWorkspace = lazy(() => import('./pages/AgentWorkspace'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ClinicStaffDashboard = lazy(() => import('./pages/ClinicStaffDashboard'));
const QueueTrackerPage = lazy(() => import('./pages/QueueTrackerPage'));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
    </div>
  </div>
);

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role && !requiredRole.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
};

export const App = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Initialize auth state
    const token = localStorage.getItem('accessToken');
    if (token) {
      apiClient
        .get('/auth/me')
        .then((res) => {
          if (res.data.data) {
            setUser(res.data.data);
          }
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<SignupPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Patient Routes */}
            <Route
              path="/search"
              element={
                <ProtectedRoute requiredRole={['PATIENT']}>
                  <SearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/queue-tracker"
              element={
                <ProtectedRoute requiredRole={['PATIENT']}>
                  <QueueTrackerPage />
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute requiredRole={['DOCTOR']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Clinic Staff Routes */}
            <Route
              path="/clinic/dashboard"
              element={
                <ProtectedRoute requiredRole={['CLINIC_STAFF']}>
                  <ClinicStaffDashboard />
                </ProtectedRoute>
              }
            />

            {/* Support Agent Routes */}
            <Route
              path="/agent/workspace"
              element={
                <ProtectedRoute requiredRole={['SUPPORT_AGENT']}>
                  <AgentWorkspace />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
};
