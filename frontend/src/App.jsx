import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AmbientScene } from './components/glass/AmbientScene';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { LowStockAlerts } from './pages/LowStockAlerts';
import { Suppliers } from './pages/Suppliers';
import { Transactions } from './pages/Transactions';
import { Users } from './pages/Users';
import { Reports } from './pages/Reports';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AmbientScene />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="low-stock" element={<LowStockAlerts />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<Users />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
