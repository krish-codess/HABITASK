import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout/Layout.jsx';
import LoadingSpinner from './components/UI/LoadingSpinner.jsx';

// Eagerly load auth + landing (above the fold)
import Login from './pages/Auth/Login.jsx';
import Signup from './pages/Auth/Signup.jsx';
import LandingPage from './pages/Landing/LandingPage.jsx';

// Lazy-load app pages
const HabitsPage   = lazy(() => import('./pages/Habits/HabitsPage.jsx'));
const WorkoutPage  = lazy(() => import('./pages/Workout/WorkoutPage.jsx'));
const CaloriesPage = lazy(() => import('./pages/Calories/CaloriesPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/Analytics/AnalyticsPage.jsx'));
const SocialPage   = lazy(() => import('./pages/Social/SocialPage.jsx'));
const ProfilePage  = lazy(() => import('./pages/Profile/ProfilePage.jsx'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

const PageLoader = () => (
  <div className="flex justify-center items-center py-20">
    <LoadingSpinner />
  </div>
);

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login"  element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

      {/* Protected app shell */}
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Suspense fallback={<PageLoader />}><HabitsPage /></Suspense>} />
        <Route path="workouts"  element={<Suspense fallback={<PageLoader />}><WorkoutPage /></Suspense>} />
        <Route path="calories"  element={<Suspense fallback={<PageLoader />}><CaloriesPage /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
        <Route path="social"    element={<Suspense fallback={<PageLoader />}><SocialPage /></Suspense>} />
        <Route path="profile"   element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
      </Route>

      {/* Legacy redirects */}
      <Route path="/habits"    element={<Navigate to="/app" replace />} />
      <Route path="/workouts"  element={<Navigate to="/app/workouts" replace />} />
      <Route path="/calories"  element={<Navigate to="/app/calories" replace />} />
      <Route path="/social"    element={<Navigate to="/app/social" replace />} />
      <Route path="/profile"   element={<Navigate to="/app/profile" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
