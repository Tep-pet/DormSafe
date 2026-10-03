import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GoogleMapsProvider } from './context/GoogleMapsContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { VerifiedRoute } from './routes/VerifiedRoute';
import { HomeRedirect } from './routes/HomeRedirect';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AccountVerificationPage } from './pages/auth/AccountVerificationPage';
import { SearchPage } from './pages/student/SearchPage';
import { MyStayPage } from './pages/student/MyStayPage';
import { SavedListingsPage } from './pages/student/SavedListingsPage';
import { PropertyDetailPage } from './pages/student/PropertyDetailPage';
import { RoomRequestsPage } from './pages/student/RoomRequestsPage';
import { DashboardPage } from './pages/owner/DashboardPage';
import { ManageListingsPage } from './pages/owner/ManageListingsPage';
import { AddPropertyPage } from './pages/owner/AddPropertyPage';
import { EditPropertyPage } from './pages/owner/EditPropertyPage';
import { OwnerAnalyticsPage } from './pages/owner/OwnerAnalyticsPage';
import { ManageTenantsPage } from './pages/owner/ManageTenantsPage';
import { PaymentLogPage } from './pages/owner/PaymentLogPage';
import { OwnerRoomRequestsPage } from './pages/owner/RoomRequestsPage';
import { VerificationPage } from './pages/owner/VerificationPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { VerifyAccountsPage } from './pages/admin/VerifyAccountsPage';
import { ApproveListingsPage } from './pages/admin/ApproveListingsPage';
import { ManageUsersPage } from './pages/admin/ManageUsersPage';
import { AdminManageTenantsPage } from './pages/admin/AdminManageTenantsPage';
import { AdminListingDetailPage } from './pages/admin/AdminListingDetailPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { ModerateReviewsPage } from './pages/admin/ModerateReviewsPage';
import { ComponentsShowcasePage } from './pages/dev/ComponentsShowcasePage';
import { AdminRouteLayout } from './routes/AdminRouteLayout';
import { OwnerRouteLayout } from './routes/OwnerRouteLayout';
import { StudentRouteLayout } from './routes/StudentRouteLayout';
import { GuestRoute } from './routes/GuestRoute';
import { ROLES } from './constants/roles';

export default function App() {
  return (
    <AuthProvider>
      <GoogleMapsProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/components" element={<ComponentsShowcasePage />} />
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<RoleRoute allowedRoles={[ROLES.STUDENT]} />}>
                  <Route
                    path="/student/verification"
                    element={
                      <AccountVerificationPage
                        title="Student Verification"
                        subtitle="Your ID is reviewed by an administrator before you can search listings"
                      />
                    }
                  />
                  <Route element={<VerifiedRoute />}>
                    <Route element={<StudentRouteLayout />}>
                      <Route path="/student/search" element={<SearchPage />} />
                      <Route path="/student/saved" element={<SavedListingsPage />} />
                      <Route path="/student/my-stay" element={<MyStayPage />} />
                      <Route path="/student/requests" element={<RoomRequestsPage />} />
                      <Route path="/student/property/:id" element={<PropertyDetailPage />} />
                    </Route>
                  </Route>
                </Route>

                <Route element={<RoleRoute allowedRoles={[ROLES.OWNER]} />}>
                  <Route path="/owner/verification" element={<VerificationPage />} />
                  <Route element={<VerifiedRoute />}>
                    <Route element={<OwnerRouteLayout />}>
                      <Route path="/owner/dashboard" element={<DashboardPage />} />
                      <Route path="/owner/listings" element={<ManageListingsPage />} />
                      <Route path="/owner/listings/:id/edit" element={<EditPropertyPage />} />
                      <Route path="/owner/analytics" element={<OwnerAnalyticsPage />} />
                      <Route path="/owner/add-property" element={<AddPropertyPage />} />
                      <Route path="/owner/tenants" element={<ManageTenantsPage />} />
                      <Route path="/owner/payments" element={<PaymentLogPage />} />
                      <Route path="/owner/requests" element={<OwnerRoomRequestsPage />} />
                    </Route>
                  </Route>
                </Route>

                <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
                  <Route element={<AdminRouteLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/verify-accounts" element={<VerifyAccountsPage />} />
                    <Route path="/admin/verify-owners" element={<VerifyAccountsPage />} />
                    <Route path="/admin/approve-listings" element={<ApproveListingsPage />} />
                    <Route path="/admin/listings/:id" element={<AdminListingDetailPage />} />
                    <Route path="/admin/manage-users" element={<ManageUsersPage />} />
                    <Route path="/admin/manage-tenants" element={<AdminManageTenantsPage />} />
                    <Route path="/admin/audit-log" element={<AdminAuditPage />} />
                    <Route path="/admin/moderate" element={<ModerateReviewsPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </GoogleMapsProvider>
    </AuthProvider>
  );
}
