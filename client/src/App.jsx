import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { HomeRedirect } from './routes/HomeRedirect';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { SearchPage } from './pages/student/SearchPage';
import { PropertyDetailPage } from './pages/student/PropertyDetailPage';
import { DashboardPage } from './pages/owner/DashboardPage';
import { VerifyOwnersPage } from './pages/admin/VerifyOwnersPage';
import { ApproveListingsPage } from './pages/admin/ApproveListingsPage';
import { ROLES } from './constants/roles';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={[ROLES.STUDENT]} />}>
              <Route path="/student/search" element={<SearchPage />} />
              <Route path="/student/property/:id" element={<PropertyDetailPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={[ROLES.OWNER]} />}>
              <Route path="/owner/dashboard" element={<DashboardPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="/admin/verify-owners" element={<VerifyOwnersPage />} />
              <Route path="/admin/approve-listings" element={<ApproveListingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
