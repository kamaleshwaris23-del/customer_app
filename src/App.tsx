import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { AddCustomerPage } from './pages/AddCustomerPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { ImportExportPage } from './pages/ImportExportPage';
import { TeamMembersPage } from './pages/TeamMembersPage';
import { SettingsPage } from './pages/SettingsPage';
import { WelcomePage } from './pages/WelcomePage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Default entry point: render WelcomePage when app opens */}
          <Route index element={<WelcomePage />} />
          <Route path="welcome" element={<WelcomePage />} />
          
          {/* Dashboard Route */}
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Main App Routes */}
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/edit/:id" element={<AddCustomerPage />} />
          <Route path="customers/:id" element={<CustomerProfilePage />} />
          <Route path="add-customer" element={<AddCustomerPage />} />
          <Route path="follow-ups" element={<FollowUpsPage />} />
          <Route path="import-export" element={<ImportExportPage />} />
          <Route path="team" element={<TeamMembersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Legacy login redirect to dashboard */}
          <Route path="login" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
