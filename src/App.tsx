
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Transactions from "./pages/Transactions";
import Routers from "./pages/Routers";
import Areas from "./pages/Areas";
import Packages from "./pages/Packages";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import ODP from "./pages/ODP";
import Receipt from '@/pages/Receipt';
import Reports from "./pages/Reports";
// Remove this import

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/routers" element={<Routers />} />
                <Route path="/areas" element={<Areas />} />
                <Route path="/odp" element={<ODP />} />
                <Route path="/packages" element={<Packages />} />
                <Route path="/messages" element={<Messages />} />
                {/* Remove this route */}
                <Route path="*" element={<NotFound />} />
                <Route path="/receipt/:receiptNumber" element={<Receipt />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
