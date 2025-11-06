import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit, Trash2, Loader2, Settings, Power, PowerOff, RefreshCw } from 'lucide-react';
import { Customer } from '@/types/isp';
import CustomerForm from '@/components/CustomerForm';
import PPPUserControl from '@/components/PPPUserControl';
import { useCustomers } from '@/hooks/useCustomers';
import { useAreas } from '@/hooks/useAreas';
import { useRouters } from '@/hooks/useRouters';
import { useODP } from '@/hooks/useODP';
import { usePackages } from '@/hooks/usePackages';
import { api } from '@/utils/api';
import { toast } from 'sonner';

interface WhatsAppSettings {
  newCustomerMessageTemplate: string;
  enabled: boolean;
}

// Tambahkan import
import { useWahaConfig } from '@/hooks/useWahaConfig';
import { useAppSetting } from '@/hooks/useAppSetting';

const Customers = () => {
  const { customers, loading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { areas } = useAreas();
  const { routers } = useRouters();
  const { odp, refreshODPs } = useODP();
  const { packages } = usePackages();
  
  // Tambahkan hook ini
  const { config: wahaConfig } = useWahaConfig();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  
  // Filter states
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedRouter, setSelectedRouter] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState('all');
  const [selectedODP, setSelectedODP] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkChecking, setIsBulkChecking] = useState(false);

  // WhatsApp settings
  const [waSettings, setWaSettings] = useState<WhatsAppSettings>({
    newCustomerMessageTemplate: `Halo {customerName},

Selamat! Layanan internet Anda telah aktif.

Detail Pelanggan:
📋 No. Pelanggan: {customerNumber}
📦 Paket: {packageName}
💰 Harga: Rp {packagePrice}
📍 Area: {area}
📅 Tanggal Aktif: {activeDate}
📅 Tanggal Kadaluarsa: {expireDate}

Silahkan lakukan pembayaran setiap tanggal 1-5 setiap bulannya.

Untuk informasi lebih lanjut, hubungi customer service kami.

Terima kasih telah bergabung dengan LATANSA NETWORKS!`,
    enabled: true
  });

  // Server-persisted WhatsApp settings
  const { setting: serverWaSettings, saveSetting: saveCustomerWaSetting } = useAppSetting<WhatsAppSettings>('customer-whatsapp-settings', {
    newCustomerMessageTemplate: `Halo {customerName},

Selamat! Layanan internet Anda telah aktif.

Detail Pelanggan:
📋 No. Pelanggan: {customerNumber}
📦 Paket: {packageName}
💰 Harga: Rp {packagePrice}
📍 Area: {area}
📅 Tanggal Aktif: {activeDate}
📅 Tanggal Kadaluarsa: {expireDate}

Silahkan lakukan pembayaran setiap tanggal 1-5 setiap bulannya.

Untuk informasi lebih lanjut, hubungi customer service kami.

Terima kasih telah bergabung dengan LATANSA NETWORKS!`,
    enabled: true
  });

  useEffect(() => {
    if (serverWaSettings) {
      setWaSettings(serverWaSettings);
    }
  }, [serverWaSettings]);

  // Save WhatsApp settings
  const saveWhatsAppSettings = async () => {
    try {
      await saveCustomerWaSetting.mutateAsync(waSettings);
      setShowSettingsDialog(false);
      toast.success('Pengaturan WhatsApp berhasil disimpan');
    } catch (e) {
      toast.error('Gagal menyimpan pengaturan WhatsApp');
    }
  };

  // WhatsApp notification function
  const sendWhatsAppNotification = async (customerData: Partial<Customer>) => {
    if (!waSettings.enabled) {
      console.log('WhatsApp notifications disabled for new customers');
      return;
    }

    try {
      // Ganti bagian localStorage dengan hook:
      if (!wahaConfig || !wahaConfig.baseUrl || !wahaConfig.session) {
        console.warn('WAHA config not found or incomplete:', wahaConfig);
        toast.error('Konfigurasi WAHA tidak lengkap. Silakan atur di halaman Messages.');
        return;
      }

      // Format phone number (remove +, spaces, etc.)
      const formattedPhone = customerData.phone?.replace(/[^0-9]/g, '') || '';
      const chatId = formattedPhone.startsWith('62') ? 
        `${formattedPhone}@c.us` : 
        `62${formattedPhone.startsWith('0') ? formattedPhone.substring(1) : formattedPhone}@c.us`;

      // Replace placeholders in template
      let message = waSettings.newCustomerMessageTemplate
        .replace(/{customerName}/g, customerData.name || '')
        .replace(/{customerNumber}/g, customerData.customerNumber || '')
        .replace(/{packageName}/g, customerData.package || '')
        .replace(/{packagePrice}/g, (customerData.packagePrice || 0).toLocaleString('id-ID'))
        .replace(/{area}/g, customerData.area || '')
        .replace(/{activeDate}/g, customerData.activeDate ? new Date(customerData.activeDate).toLocaleDateString('id-ID') : '')
        .replace(/{expireDate}/g, customerData.expireDate ? new Date(customerData.expireDate).toLocaleDateString('id-ID') : '');

      console.log('Sending WhatsApp notification to new customer:', customerData.phone);
      console.log('Formatted chatId:', chatId);
      console.log('Message:', message);

      // Check session status first
      const sessionCheck = await fetch(`${wahaConfig.baseUrl}/api/sessions/${wahaConfig.session}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(wahaConfig.apiKey && { 'X-Api-Key': wahaConfig.apiKey })
        }
      });

      if (!sessionCheck.ok) {
        throw new Error(`Session ${wahaConfig.session} tidak tersedia atau tidak aktif`);
      }

      const sessionData = await sessionCheck.json();
      if (sessionData.status !== 'WORKING') {
        throw new Error(`Session status: ${sessionData.status}. Session harus dalam status WORKING`);
      }

      // Try multiple endpoints
      const endpoints = [
        `${wahaConfig.baseUrl}/api/sendText`,
        `${wahaConfig.baseUrl}/api/${wahaConfig.session}/sendText`,
        `${wahaConfig.baseUrl}/api/sessions/${wahaConfig.session}/chats/${chatId}/messages`,
        `${wahaConfig.baseUrl}/api/v1/sessions/${wahaConfig.session}/chats/${chatId}/messages/text`
      ];

      const payloads = [
        {
          session: wahaConfig.session,
          chatId: chatId,
          text: message
        },
        {
          chatId: chatId,
          text: message
        },
        {
          text: message
        },
        {
          text: message
        }
      ];

      // Try each endpoint until one succeeds
      for (let i = 0; i < endpoints.length; i++) {
        try {
          console.log(`Mencoba endpoint ${i + 1}: ${endpoints[i]}`);
          
          const response = await fetch(endpoints[i], {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(wahaConfig.apiKey && { 'X-Api-Key': wahaConfig.apiKey })
            },
            body: JSON.stringify(payloads[i])
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`WhatsApp notification sent successfully via endpoint ${i + 1}:`, result);
            toast.success(`Notifikasi WhatsApp berhasil dikirim ke ${customerData.name}`);
            return true;
          } else {
            console.log(`Endpoint ${i + 1} gagal:`, response.status, response.statusText);
          }
        } catch (endpointError) {
          console.log(`Error pada endpoint ${i + 1}:`, endpointError);
        }
      }

      throw new Error('Semua endpoint gagal. Periksa konfigurasi WAHA API.');
      
    } catch (error) {
      console.warn('WhatsApp welcome message failed:', error);
      toast.error('Gagal mengirim pesan WhatsApp');
      return false;
    }
  };

  const handleAddCustomer = async (customerData: Partial<Customer>) => {
    try {
      const newCustomer = await addCustomer(customerData as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>);
      setShowForm(false);
      setSelectedCustomer(undefined);
      
      // Send WhatsApp notification after customer is successfully added
      if (customerData.phone) {
        await sendWhatsAppNotification(customerData);
      }
      
      toast.success('Pelanggan berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Gagal menambahkan pelanggan');
    }
  };

  const handleEditCustomer = async (customerData: Partial<Customer>) => {
    if (!selectedCustomer?.id) return;
    
    try {
      await updateCustomer(selectedCustomer.id, customerData);
      setShowForm(false);
      setSelectedCustomer(undefined);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleSubmit = (customerData: Partial<Customer>) => {
    if (selectedCustomer) {
      handleEditCustomer(customerData);
    } else {
      handleAddCustomer(customerData);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
      try {
        await deleteCustomer(id);
        // Refresh ODPs agar slot langsung ter-update setelah penghapusan pelanggan
        await refreshODPs();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  // Helper function untuk menentukan status - pindahkan ke atas sebelum filteredCustomers
  const getCustomerStatus = (customer: Customer) => {
    // Normalisasi tanggal ke 00:00:00 agar perbandingan akurat
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const expireDate = customer.expireDate ? new Date(customer.expireDate) : null;
    if (expireDate) expireDate.setHours(0, 0, 0, 0);

    // Ambil tanggal jatuh tempo dinamis dari paymentDueDate bila ada, fallback ke 5
    const dueDateObj = customer.paymentDueDate ? new Date(customer.paymentDueDate) : null;
    const dueDay = dueDateObj ? dueDateObj.getDate() : 5;
    const withinBillingWindow = currentDay >= 1 && currentDay <= dueDay;

    // Cek pembayaran bulan ini (untuk postpaid), fallback ke billingStatus
    const lastBillingDate = customer.lastBillingDate ? new Date(customer.lastBillingDate) : null;
    if (lastBillingDate) lastBillingDate.setHours(0, 0, 0, 0);
    const hasPaidThisMonth = !!(
      lastBillingDate &&
      lastBillingDate.getMonth() === currentMonth &&
      lastBillingDate.getFullYear() === currentYear
    );

    const isPostpaid = customer.billingType === 'postpaid';
    const isPrepaid = customer.billingType === 'prepaid';

    // Indikator suspend eksplisit dari backend
    if (customer.status === 'suspended' || customer.billingStatus === 'suspend') {
      return 'SUSPENDED';
    }

    // Prepaid: status ditentukan oleh expireDate.
    // - Jika belum lewat expireDate: AKTIF
    // - Jika expireDate bulan ini: 1–dueDay = BELUM BAYAR, setelah itu = SUSPENDED
    // - Jika expireDate bulan lalu/lebih lama: selalu SUSPENDED
    if (isPrepaid) {
      if (!expireDate) {
        // Tanpa expireDate, fallback: anggap aktif kecuali backend menandai suspend
        return customer.billingStatus === 'belum_lunas' && withinBillingWindow ? 'BELUM BAYAR' : 'AKTIF';
      }

      const expired = today.getTime() > expireDate.getTime();
      if (!expired) {
        return 'AKTIF';
      }

      const expireMonth = expireDate.getMonth();
      const expireYear = expireDate.getFullYear();
      const expiredThisMonth = (expireMonth === currentMonth && expireYear === currentYear);

      if (expiredThisMonth) {
        return withinBillingWindow ? 'BELUM BAYAR' : 'SUSPENDED';
      }

      return 'SUSPENDED';
    }

    // Postpaid: gunakan jendela 1–dueDay untuk BELUM BAYAR, lalu SUSPENDED
    if (isPostpaid) {
      if (withinBillingWindow) {
        if (customer.billingStatus === 'belum_lunas' || !hasPaidThisMonth) {
          return 'BELUM BAYAR';
        }
        return 'AKTIF';
      }
      // Di luar jendela: belum bayar -> SUSPENDED
      if (customer.billingStatus === 'belum_lunas' || !hasPaidThisMonth) {
        return 'SUSPENDED';
      }
      return 'AKTIF';
    }

    return 'AKTIF';
  };

  // Apply all filters
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = selectedArea === 'all' || customer.area === selectedArea;
    
    // Perbaikan filter router - gunakan routerData.name atau router field
    const matchesRouter = selectedRouter === 'all' || 
      customer.routerData?.name === selectedRouter || 
      customer.router === selectedRouter;
    
    const matchesPackage = selectedPackage === 'all' || customer.package === selectedPackage;
    
    // Perbaikan filter ODP - gunakan odpData.name atau odpSlot field
    const matchesODP = selectedODP === 'all' || 
      customer.odpData?.name === selectedODP || 
      customer.odpSlot === selectedODP;
    
    // Perbaikan logika status filtering - gunakan fungsi getCustomerStatus yang sama
    let matchesStatus = true;
    if (selectedStatus !== 'all') {
      const customerStatus = getCustomerStatus(customer);
      
      switch (selectedStatus) {
        case 'aktif':
          matchesStatus = customerStatus === 'AKTIF';
          break;
        case 'belum_bayar':
          matchesStatus = customerStatus === 'BELUM BAYAR';
          break;
        case 'suspended':
          matchesStatus = customerStatus === 'SUSPENDED';
          break;
        case 'belum_terpasang':
          matchesStatus = customer.installationStatus === 'not_installed';
          break;
        case 'terpasang_belum_aktif':
          matchesStatus = customer.installationStatus === 'installed' && customer.serviceStatus === 'inactive';
          break;
        default:
          matchesStatus = true;
      }
    }
    
    return matchesSearch && matchesArea && matchesRouter && matchesPackage && 
           matchesODP && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedArea, selectedRouter, selectedPackage, selectedODP, selectedStatus, itemsPerPage]);

  // Helper: safe integer conversion for prices to avoid NaN
  const toInt = (v: unknown) => {
    if (v == null) return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : 0;
    let s = String(v).trim();
    if (s === '') return 0;
    // Normalize Indonesian currency formats, e.g., "Rp 300.000,00" or "300.000,-"
    s = s.replace(/[rR][pP]/g, '').replace(/\s+/g, '');
    // Handle decimal separators:
    // 1) If comma present, drop everything after comma (IDR style)
    const commaIdx = s.indexOf(',');
    if (commaIdx !== -1) {
      s = s.slice(0, commaIdx);
    } else {
      // 2) If no comma, but dot used as decimal (e.g., 300000.00), drop after last dot when it looks like decimals
      const lastDot = s.lastIndexOf('.');
      if (lastDot !== -1) {
        const decimals = s.slice(lastDot + 1);
        if (/^\d{1,2}$/.test(decimals)) {
          s = s.slice(0, lastDot);
        }
      }
    }
    // Remove thousand separators dots left (e.g., 300.000 -> 300000)
    s = s.replace(/\./g, '');
    // Keep digits and optional minus
    s = s.replace(/[^0-9-]/g, '');
    if (s === '' || s === '-') return 0;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : 0;
  };

  // Bulk check PPP status for all filtered customers
  const handleBulkCheckPPP = async () => {
    if (isBulkChecking) return;
    setIsBulkChecking(true);
    try {
      const total = filteredCustomers.length;
      if (total === 0) {
        toast.info('Tidak ada pelanggan pada filter saat ini');
        return;
      }

      toast.info(`Memeriksa status PPP untuk ${total} pelanggan...`);

      let active = 0;
      let disabled = 0;
      let notFound = 0;
      let errors = 0;

      for (const c of filteredCustomers) {
        try {
          const resp = await api.checkPPPUserStatus(c.id);
          if (resp.success) {
            const data: any = resp.data;
            // Prefer unified shape from backend index.ts: { status, active }
            const status = data?.status as string | undefined;
            const isActive = typeof data?.active === 'boolean'
              ? data.active
              : (typeof data?.mikrotikStatus?.disabled === 'boolean' ? !data.mikrotikStatus.disabled : false);

            if (status === 'not_found') {
              notFound++;
            } else if (isActive) {
              active++;
            } else {
              disabled++;
            }
          } else {
            errors++;
          }
        } catch (e) {
          errors++;
        }
      }

      toast.success(`Selesai cek PPP: Active ${active}, Disabled ${disabled}, Not Found ${notFound}, Error ${errors}`);
    } finally {
      setIsBulkChecking(false);
    }
  };

  // HAPUS deklarasi fungsi getCustomerStatus yang duplikat di sini (baris 345-371)
  // Fungsi sudah dideklarasikan di atas sebelum filteredCustomers

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat data pelanggan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Manajemen Pelanggan</h1>
          <p className="text-sm md:text-base text-gray-600">Kelola data pelanggan ISP</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
             <DialogTrigger asChild>
               <Button 
                 variant="outline" 
                 size="sm"
                 className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-2"
               >
                 <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                 Setting WA
               </Button>
             </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Pengaturan Pesan WhatsApp Pelanggan Baru</DialogTitle>
                <DialogDescription>
                  Atur template pesan untuk notifikasi pelanggan baru
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Template Pesan Pelanggan Baru</Label>
                  <Textarea
                    value={waSettings.newCustomerMessageTemplate}
                    onChange={(e) => setWaSettings(prev => ({ ...prev, newCustomerMessageTemplate: e.target.value }))}
                    rows={12}
                    placeholder="Template pesan untuk pelanggan baru..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Placeholder: {'{customerName}'}, {'{customerNumber}'}, {'{packageName}'}, {'{packagePrice}'}, {'{area}'}, {'{activeDate}'}, {'{expireDate}'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wa-enabled"
                    checked={waSettings.enabled}
                    onCheckedChange={(checked) => setWaSettings(prev => ({ ...prev, enabled: !!checked }))}
                  />
                  <Label htmlFor="wa-enabled">Aktifkan notifikasi WhatsApp untuk pelanggan baru</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>Batal</Button>
                  <Button onClick={saveWhatsAppSettings}>Simpan</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showForm} onOpenChange={setShowForm}>
             <DialogTrigger asChild>
               <Button 
                 onClick={() => setSelectedCustomer(undefined)}
                 size="sm"
                 className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-2"
               >
                 <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                 Tambah
               </Button>
             </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                </DialogTitle>
              </DialogHeader>
              <CustomerForm
                customer={selectedCustomer}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filter & Pencarian</CardTitle>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-1 block">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari Nopel / Nama / Telp / Alamat / Street"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Area Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Area / Wilayah</label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="SEMUA AREA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">SEMUA AREA</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.name}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status Pelanggan</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="SEMUA STATUS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">SEMUA STATUS</SelectItem>
                  <SelectItem value="aktif">AKTIF</SelectItem>
                  <SelectItem value="belum_bayar">BELUM BAYAR</SelectItem>
                  <SelectItem value="suspended">SUSPENDED</SelectItem>
                  <SelectItem value="belum_terpasang">BELUM TERPASANG</SelectItem>
                  <SelectItem value="terpasang_belum_aktif">TERPASANG BELUM AKTIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Router Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Router</label>
              <Select value={selectedRouter} onValueChange={setSelectedRouter}>
                <SelectTrigger>
                  <SelectValue placeholder="SEMUA ROUTER" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">SEMUA ROUTER</SelectItem>
                  {routers.map((router) => (
                    <SelectItem key={router.id} value={router.name}>
                      {router.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Package Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Paket</label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="SEMUA PAKET" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">SEMUA PAKET</SelectItem>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.name}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* ODP Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">ODP</label>
              <Select value={selectedODP} onValueChange={setSelectedODP}>
                <SelectTrigger>
                  <SelectValue placeholder="SEMUA ODP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">SEMUA ODP</SelectItem>
                  {odp.map((odpItem) => (
                    <SelectItem key={odpItem.id} value={odpItem.name}>
                      {odpItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex justify-between items-center">
            <CardTitle>Daftar Pelanggan</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkCheckPPP}
              disabled={isBulkChecking}
              title="Cek status PPP semua pelanggan pada filter ini"
            >
              {isBulkChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengecek PPP...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cek PPP Semua
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 whitespace-nowrap">No</TableHead>
                  <TableHead className="w-16 whitespace-nowrap">Act</TableHead>
                  <TableHead className="whitespace-nowrap">No.Pelanggan</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Nama</TableHead>
                  <TableHead className="whitespace-nowrap">Telp</TableHead>
                  <TableHead className="whitespace-nowrap">Area</TableHead>
                  <TableHead className="whitespace-nowrap">Paket</TableHead>
                  <TableHead className="whitespace-nowrap">Tarif</TableHead>
                  <TableHead className="whitespace-nowrap">Tanggal Aktif</TableHead>
                  <TableHead className="whitespace-nowrap">Tanggal Berakhir</TableHead>
                  <TableHead className="whitespace-nowrap">Periode</TableHead>
                  <TableHead className="whitespace-nowrap">Nama User PPP</TableHead>
                  <TableHead className="w-32 whitespace-nowrap">PPP Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-gray-500 whitespace-nowrap">
                      Tidak ada pelanggan yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer, index) => {
                    const status = getCustomerStatus(customer);
                    const globalIndex = startIndex + index + 1;
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium whitespace-nowrap">{globalIndex}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono whitespace-nowrap">{customer.customerNumber}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === 'AKTIF' ? 'bg-green-100 text-green-800' :
                            status === 'BELUM BAYAR' ? 'bg-yellow-100 text-yellow-800' :
                            status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {status}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{customer.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{customer.phone}</TableCell>
                        <TableCell className="whitespace-nowrap">{customer.area}</TableCell>
                        <TableCell className="whitespace-nowrap">{customer.package}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.packagePrice ? 
                            new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0
                            }).format(customer.packagePrice) : 
                            '-'
                          }
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.activeDate ? 
                            new Date(customer.activeDate).toLocaleDateString('id-ID') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.expireDate ? 
                            new Date(customer.expireDate).toLocaleDateString('id-ID') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{customer.billingType || '-'}</TableCell>
                        <TableCell className="font-mono whitespace-nowrap">{customer.pppSecret || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <PPPUserControl
                            customerId={customer.id}
                            initialStatus={customer.mikrotikStatus}
                            onStatusChange={() => {
                              try {
                                // Segarkan daftar pelanggan agar mikrotikStatus terbaru tercermin
                                refreshCustomers();
                              } catch {}
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination - hanya muncul jika total data > items per page */}
      {filteredCustomers.length > itemsPerPage && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} dari {filteredCustomers.length} pelanggan
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        className="w-8 h-8 p-0"
                      >
                        1
                      </Button>
                      {currentPage > 4 && <span className="text-gray-400">...</span>}
                    </>
                  )}
                  
                  {/* Current page and neighbors */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Jumlah:</span>
              <span className="font-semibold text-blue-600">
                {filteredCustomers.length.toLocaleString('id-ID')}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Grand Total:</span>
              <span className="font-semibold text-green-600">
                {(() => {
                  const grandTotal = filteredCustomers.reduce((total, customer) => {
                    const status = getCustomerStatus(customer);
                    if (status === 'AKTIF' || status === 'BELUM BAYAR') {
                      const price = toInt(customer.packagePrice);
                      return total + price;
                    }
                    return total;
                  }, 0);
                  return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  }).format(grandTotal);
                })()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Total Tagihan:</span>
              <span className="font-semibold text-orange-600">
                {(() => {
                  const totalTagihan = filteredCustomers.reduce((total, customer) => {
                    const status = getCustomerStatus(customer);
                    if (status === 'BELUM BAYAR' || status === 'SUSPENDED') {
                      const price = toInt(customer.packagePrice);
                      return total + price;
                    }
                    return total;
                  }, 0);
                  
                  return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  }).format(totalTagihan);
                })()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;
