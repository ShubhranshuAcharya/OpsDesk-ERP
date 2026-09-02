import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import AppLoader from './components/AppLoader';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomersList from './pages/CustomersList';
import CustomerDetail from './pages/CustomerDetail';
import InventoryList from './pages/InventoryList';
import ProductDetail from './pages/ProductDetail';
import ChallansList from './pages/ChallansList';
import ChallanBuilder from './pages/ChallanBuilder';
import ChallanDetail from './pages/ChallanDetail';
import Profile from './pages/Profile';
import Forbidden from './pages/Forbidden';
import UsersList from './pages/UsersList';
import Reports from './pages/Reports';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';


const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuthStore();
  
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const { isInitialized, initialize } = useAuthStore();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  return (
    <QueryClientProvider client={queryClient}>
        {/* App Loader with Fade Transition */}
        {showLoader && (
          <div 
            className={`fixed inset-0 z-50 transition-opacity duration-150 ease-in-out ${
              isInitialized ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <AppLoader />
          </div>
        )}
      {/* Main App */}
      {isInitialized && (
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/403" element={<Forbidden />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}><CustomersList /></ProtectedRoute>} />
              <Route path="customers/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}><RouteErrorBoundary backLabel="Back to customers"><CustomerDetail /></RouteErrorBoundary></ProtectedRoute>} />
              <Route path="inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE', 'SALES']}><InventoryList /></ProtectedRoute>} />
              <Route path="inventory/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE', 'SALES']}><RouteErrorBoundary backLabel="Back to inventory"><ProductDetail /></RouteErrorBoundary></ProtectedRoute>} />
              <Route path="challans" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']}><ChallansList /></ProtectedRoute>} />
              <Route path="challans/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']}><ChallanBuilder /></ProtectedRoute>} />
              <Route path="challans/:id/edit" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']}><ChallanBuilder /></ProtectedRoute>} />
              <Route path="challans/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']}><RouteErrorBoundary backLabel="Back to challans"><ChallanDetail /></RouteErrorBoundary></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UsersList /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTS']}><Reports /></ProtectedRoute>} />
              <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </QueryClientProvider>
  );
}
