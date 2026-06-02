import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from '@/pages/login/LoginPage';
import AppShell from '@/components/AppShell';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ComparePage from '@/pages/compare/ComparePage';
import TrendsPage from '@/pages/trends/TrendsPage';
import InsightsPage from '@/pages/insights/InsightsPage';
import ProfilePage from '@/pages/profile/ProfilePage';

function App() {
  const { isLoggedIn } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            isLoggedIn ? (
              <AppShell>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="/trends" element={<TrendsPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Routes>
              </AppShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
