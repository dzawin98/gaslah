
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/commission-reports" element={<CommissionReports />} />
                <Route path="/custom-receipt" element={<CustomReceipt />} />
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
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
