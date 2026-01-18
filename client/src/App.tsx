import { Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { IAuthAPI } from "./api/auth/IAuthAPI";
import { AuthAPI } from "./api/auth/AuthAPI";

import { IUserAPI } from "./api/users/IUserAPI";
import { UserAPI } from "./api/users/UserAPI";

import { ProtectedRoute } from "./components/protected_route/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";

import { IAnalyticsAPI } from "./api/analytics/IAnalyticsAPI";
import { AnalyticsAPI } from "./api/analytics/AnalyticsAPI";
import { AnalyticsPage } from "./pages/AnalyticsPage";

const auth_api: IAuthAPI = new AuthAPI();
const user_api: IUserAPI = new UserAPI();
const analytics_api: IAnalyticsAPI = new AnalyticsAPI();

function App() {
  return (
    <Routes>
      {/* AUTH */}
      <Route path="/" element={<AuthPage authAPI={auth_api} />} />

      {/* MENI (dashboard) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="admin,seller">
            <DashboardPage userAPI={user_api} />
          </ProtectedRoute>
        }
      />

      {/* ANALYTICS */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute requiredRole="admin,seller">
            <AnalyticsPage analyticsAPI={analytics_api} />
          </ProtectedRoute>
        }
      />

      {/* (opciono) fallback */}
      {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
    </Routes>
  );
}

export default App;
