
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from 'react';
import migrateLocalSettings from '@/utils/migrateSettings';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// Authentication removed - direct access to all routes
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Transactions from "./pages/Transactions";
import Routers from "./pages/Routers";
import Areas from "./pages/Areas";
import Packages from "./pages/Packages";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ODP from "./pages/ODP";
import Receipt from '@/pages/Receipt';
import Reports from "./pages/Reports";
import CommissionReports from "./pages/CommissionReports";
import CustomReceipt from "./pages/CustomReceipt";
// Remove this import

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    migrateLocalSettings();
  }, []);

  const isLoggedIn = () => {
    try {
      return localStorage.getItem('simpleLogin') === '1';
    } catch {
      return false;
    }
  };

  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
  };

  const PublicOnly = ({ children }: { children: React.ReactNode }) => {
    return isLoggedIn() ? <Navigate to="/" replace /> : <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
                  <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
                  <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
                  <Route path="/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />
                  <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
                  <Route path="/commission-reports" element={<RequireAuth><CommissionReports /></RequireAuth>} />
                  <Route path="/custom-receipt" element={<RequireAuth><CustomReceipt /></RequireAuth>} />
                  <Route path="/routers" element={<RequireAuth><Routers /></RequireAuth>} />
                  <Route path="/areas" element={<RequireAuth><Areas /></RequireAuth>} />
                  <Route path="/odp" element={<RequireAuth><ODP /></RequireAuth>} />
                  <Route path="/packages" element={<RequireAuth><Packages /></RequireAuth>} />
                  <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
                  {/* Remove this route */}
                  <Route path="*" element={<NotFound />} />
                  <Route path="/receipt/:receiptNumber" element={<Receipt />} />
                </Routes>
              </Layout>
          </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
