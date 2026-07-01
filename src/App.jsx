import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import HomeRoute from './components/HomeRoute';
import ProtectedLayout from './components/ProtectedLayout';
import AdminPanel from './pages/AdminPanel';
import UserManagement from './pages/UserManagement';
import ItemManagement from './pages/ItemManagement';
import Masters from './pages/Masters';
import OrdersView from './pages/orders/OrdersView';
import Reports from './pages/Reports';
import RequestDetails from './pages/RequestDetails';
import ModuleHub from './pages/modules/ModuleHub';
import ModuleCatalog from './pages/catalog/ModuleCatalog';
import ItemDetailPage from './pages/catalog/ItemDetailPage';
import RequestCartPage from './pages/catalog/RequestCartPage';
import ModuleRequestPage from './pages/modules/ModuleRequestPage';
import TravelRequestForm from './pages/modules/TravelRequestForm';
import TechnicalReplacementForm from './pages/modules/TechnicalReplacementForm';
import ModuleGuard from './components/layout/ModuleGuard';
import { MODULE_IDS } from './constants/modules';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<HomeRoute />} />

            <Route element={<ModuleGuard />}>
              <Route path="/technical" element={<ModuleHub moduleId={MODULE_IDS.technical} />} />
              <Route path="/technical/catalog" element={<ModuleCatalog />} />
              <Route path="/technical/items/:itemId" element={<ItemDetailPage />} />
              <Route path="/technical/replacement" element={<TechnicalReplacementForm />} />
              <Route path="/technical/request/new" element={<ModuleRequestPage />} />

              <Route path="/general-store" element={<ModuleHub moduleId={MODULE_IDS.general} />} />
              <Route path="/general-store/catalog" element={<ModuleCatalog />} />
              <Route path="/general-store/items/:itemId" element={<ItemDetailPage />} />
              <Route path="/general-store/request/new" element={<ModuleRequestPage />} />

              <Route path="/subscription" element={<ModuleHub moduleId={MODULE_IDS.subscription} />} />
              <Route path="/subscription/catalog" element={<ModuleCatalog />} />
              <Route path="/subscription/items/:itemId" element={<ItemDetailPage />} />
              <Route path="/subscription/request/new" element={<ModuleRequestPage />} />

              <Route path="/travel" element={<TravelRequestForm />} />
              <Route path="/travel/request/new" element={<TravelRequestForm />} />
            </Route>

            <Route path="/orders" element={<OrdersView />} />
            <Route path="/assigned" element={<OrdersView />} />
            <Route path="/cart" element={<RequestCartPage />} />
            <Route path="/bundle/review" element={<Navigate to="/cart" replace />} />
            <Route path="/request/:id" element={<RequestDetails />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/my-reports" element={<Reports />} />
          </Route>

          <Route element={<ProtectedLayout requiredRole="admin" />}>
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/masters" element={<Masters />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/items/:category" element={<ItemManagement />} />
            <Route path="/admin/reports" element={<Navigate to="/reports" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
