import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import KYCManagementPage from '@/pages/KYCManagementPage';
import TransactionManagementPage from '@/pages/TransactionManagementPage';
import UserManagementPage from '@/pages/UserManagementPage';
import DeliveryManagementPage from '@/pages/DeliveryManagementPage';
import AuditLogPage from '@/pages/AuditLogPage';
import DevEmailInboxPage from '@/pages/DevEmailInboxPage';
import DevEmailDetailPage from '@/pages/DevEmailDetailPage';

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes with AdminLayout */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <DashboardPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kyc"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <KYCManagementPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <TransactionManagementPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <UserManagementPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/deliveries"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <DeliveryManagementPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-log"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AuditLogPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dev-emails"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <DevEmailInboxPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dev-emails/:id"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <DevEmailDetailPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
