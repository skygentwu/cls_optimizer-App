import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from '@/pages/login/LoginPage';
import AppShell from '@/components/AppShell';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import RecommendationPage from '@/pages/recommendation/RecommendationPage';
import ManualPage from '@/pages/manual/ManualPage';
import PricesPage from '@/pages/prices/PricesPage';
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
                  <Route path="/recommendation" element={<RecommendationPage />} />
                  <Route path="/manual" element={<ManualPage />} />
                  <Route path="/prices" element={<PricesPage />} />
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
