import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { AddCustomerPage } from './pages/AddCustomerPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { ImportExportPage } from './pages/ImportExportPage';
import { TeamMembersPage } from './pages/TeamMembersPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/edit/:id" element={<AddCustomerPage />} />
          <Route path="add-customer" element={<AddCustomerPage />} />
          <Route path="follow-ups" element={<FollowUpsPage />} />
          <Route path="import-export" element={<ImportExportPage />} />
          <Route path="team" element={<TeamMembersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
