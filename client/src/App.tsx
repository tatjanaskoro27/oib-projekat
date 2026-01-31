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
import { ProductionPage } from "./pages/ProductionPage";
import { ProcessingPage } from "./pages/ProcessingPage";
import { UsersPage } from "./pages/UsersPage";

import { SalesPage } from "./pages/SalesPage";
import { PerformancePage } from "./pages/PerformancePage";

import { DogadjajiPage } from "./pages/Dogadjaji";
import { DogadjajiAPI } from "./api/dogadjaji/DogadjajiAPI";
import { IDogadjajiAPI } from "./api/dogadjaji/IDogadjajiAPI";

const auth_api: IAuthAPI = new AuthAPI();
const user_api: IUserAPI = new UserAPI();
const analytics_api: IAnalyticsAPI = new AnalyticsAPI();
const dogadjaji_api: IDogadjajiAPI = new DogadjajiAPI();

function App() {
  return (
    <Routes>
      {/* AUTH */}
      <Route path="/" element={<AuthPage authAPI={auth_api} />} />

      {/* MENI (dashboard) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="admin,seller,manager">
            <DashboardPage userAPI={user_api} />
          </ProtectedRoute>
        }
      />

      {/* ANALYTICS */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute requiredRole="admin">
            <AnalyticsPage analyticsAPI={analytics_api} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <UsersPage />
          </ProtectedRoute>
        }
      />

      {/* PRODUCTION */}
      <Route
        path="/production"
        element={
          <ProtectedRoute requiredRole="seller,manager">
            <ProductionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/processing"
        element={
          <ProtectedRoute requiredRole="seller,manager">
            <ProcessingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute requiredRole="seller,manager">
            <SalesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/performance"
        element={
          <ProtectedRoute requiredRole="admin">
            <PerformancePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dogadjaji"
        element={
          <ProtectedRoute requiredRole="admin">
            <DogadjajiPage dogadjajiAPI={dogadjaji_api} />
          </ProtectedRoute>
        }
      />

      {/* (opciono) fallback */}
      {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
    </Routes>
  );
}

export default App;
