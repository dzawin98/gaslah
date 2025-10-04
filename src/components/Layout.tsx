import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  Router, 
  MapPin, 
  Package, 
  MessageSquare,
  BarChart3,
  User,
  Network,
  // LogOut removed,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  FileText,
  // Hapus import Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// Authentication removed

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Authentication removed - no user context needed
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Router', href: '/routers', icon: Router },
    { name: 'Wilayah', href: '/areas', icon: MapPin },
    { name: 'ODP', href: '/odp', icon: Network },
    { name: 'Paket', href: '/packages', icon: Package },
    { name: 'Pelanggan', href: '/customers', icon: Users },
    { name: 'Pesan', href: '/messages', icon: MessageSquare },
    { name: 'Transaksi', href: '/transactions', icon: CreditCard },
    { name: 'Nota Lainnya', href: '/custom-receipt', icon: FileText },
    // Hapus baris voucher navigation
    { name: 'Laporan', href: '/reports', icon: TrendingUp },
    { name: 'Laporan Komisi', href: '/commission-reports', icon: DollarSign },
  ];

  // Guard ringan: arahkan ke /login bila belum login
  useEffect(() => {
    try {
      const isLoggedIn = localStorage.getItem('simpleLogin') === '1';
      if (!isLoggedIn && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    } catch {
      // Jika localStorage tidak tersedia, tetap arahkan ke login
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  // Logout functionality removed

  const handleLogoError = () => {
    setLogoError(true);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Toggle Sidebar Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              <div className="flex items-center space-x-2">
                {/* Logo */}
                {!logoError ? (
                  <img 
                    src="/logo.png" 
                    alt="Latansa Networks Logo" 
                    className="w-8 h-8 object-contain"
                    onError={handleLogoError}
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">LA</span>
                  </div>
                )}
                <h1 className="text-xl font-bold text-gray-900">Latansa Billing System</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">Admin User</p>
                  <p className="text-gray-500">ADMIN</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white shadow-sm transition-all duration-300 ease-in-out overflow-hidden`}>
          <nav className="p-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-hidden">
          <Card className="h-full overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Layout;