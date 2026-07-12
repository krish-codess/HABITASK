import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout/Layout.jsx';
import Login from './pages/Auth/Login.jsx';
import Signup from './pages/Auth/Signup.jsx';
import HabitsPage from './pages/Habits/HabitsPage.jsx';
import WorkoutPage from './pages/Workout/WorkoutPage.jsx';
import CaloriesPage from './pages/Calories/CaloriesPage.jsx';
import SocialPage from './pages/Social/SocialPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import LoadingSpinner from './components/UI/LoadingSpinner.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route
        path="/"
        element={<ProtectedRoute><Layout /></ProtectedRoute>}
      >
        <Route index element={<HabitsPage />} />
        <Route path="workouts" element={<WorkoutPage />} />
        <Route path="calories" element={<CaloriesPage />} />
        <Route path="social" element={<SocialPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
