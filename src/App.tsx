import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { AddCustomerPage } from './pages/AddCustomerPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { ImportExportPage } from './pages/ImportExportPage';
import { TeamMembersPage } from './pages/TeamMembersPage';
import { SettingsPage } from './pages/SettingsPage';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* Standalone Full-Screen Pages (Outside AppLayout — No Sidebar, No Header, No Breadcrumb) */}
        <Route index element={<WelcomePage />} />
        <Route path="welcome" element={<WelcomePage />} />
        <Route path="login" element={<LoginPage />} />

        {/* Protected Application Layout & Feature Pages (Inside AppLayout with Authentication Guard) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/edit/:id" element={<AddCustomerPage />} />
          <Route path="customers/:id" element={<CustomerProfilePage />} />
          <Route path="add-customer" element={<AddCustomerPage />} />
          <Route path="follow-ups" element={<FollowUpsPage />} />
          <Route path="import-export" element={<ImportExportPage />} />
          <Route path="team" element={<TeamMembersPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* 404 Catch-all within application */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
