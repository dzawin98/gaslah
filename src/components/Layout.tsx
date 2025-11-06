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
  LogOut,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  FileText,
  // Hapus import Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
// Authentication removed

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Authentication removed - no user context needed
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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

  // Redirect guard dipindahkan ke level routes (App.tsx)

  // Jika sedang di halaman login, sembunyikan header & navigasi tanpa early return
  const isLoginPage = location.pathname === '/login';

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    try {
      localStorage.removeItem('simpleLogin');
    } catch {}
    toast.success('Anda telah keluar dari sistem');
    navigate('/login', { replace: true });
  };

  // Auto-logout saat idle
  useEffect(() => {
    const IDLE_TIMEOUT_MINUTES = 15; // default 15 menit
    let timeoutId: number | undefined;

    const logoutAfterIdle = () => {
      toast.warning('Tidak ada aktivitas, sistem mengeluarkan Anda otomatis');
      handleLogout();
    };

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(logoutAfterIdle, IDLE_TIMEOUT_MINUTES * 60 * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'] as const;
    events.forEach((evt) => window.addEventListener(evt, resetTimer));

    // Mulai timer saat mount
    resetTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [navigate]);

  const handleLogoError = () => {
    setLogoError(true);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {!isLoginPage && (
      <header className="bg-white border-b border-gray-200 px-2 md:px-6 py-2 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (isMobile ? setMobileMenuOpen(true) : toggleSidebar())}
              className="p-1 md:p-2"
            >
              <Menu className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div className="flex items-center space-x-1 md:space-x-2">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-6 w-6 md:h-8 md:w-8" 
              />
              <h1 className="text-sm md:text-xl font-bold text-gray-900">
                Latansa Bill System
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-1 md:space-x-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-2"
            >
              <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Keluar
            </Button>
            <Avatar className="h-6 w-6 md:h-8 md:w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="text-xs md:text-sm">U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      )}

      {/* Mobile drawer navigation */}
      {!isLoginPage && isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0">
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
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
          </SheetContent>
        </Sheet>
      )}
      {isLoginPage ? (
        <main className="p-4 md:p-6">
          {children}
        </main>
      ) : (
        <div className="flex min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)]">
          {/* Sidebar */}
          <aside className={`hidden md:block ${sidebarOpen ? 'w-64' : 'w-0'} bg-white shadow-sm transition-all duration-300 ease-in-out overflow-hidden`}>
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
          <main className="flex-1 p-4 md:p-6 overflow-hidden">
            <Card className="min-h-full">
              <div className="p-4 md:p-6 overflow-x-auto">
                {children}
              </div>
            </Card>
          </main>
        </div>
      )}
    </div>
  );
};

export default Layout;
