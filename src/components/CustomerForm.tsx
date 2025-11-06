import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Customer, PPPSecret } from '@/types/isp';
import { useAreas } from '@/hooks/useAreas';
import { useRouters } from '@/hooks/useRouters';
import { useODP } from '@/hooks/useODP';
import { usePackages } from '@/hooks/usePackages';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { useWahaConfig } from '@/hooks/useWahaConfig';
import { useAppSetting } from '@/hooks/useAppSetting';

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (customer: Partial<Customer>) => void;
  onCancel: () => void;
}

// Fungsi helper untuk format tanggal
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fungsi helper untuk validasi tanggal
const isValidDate = (dateString: string | undefined | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString + 'T00:00:00');
  return !isNaN(date.getTime());
};

const safeFormatDate = (dateString: string | undefined | null): string => {
  if (!isValidDate(dateString)) return '';
  return format(new Date(dateString! + 'T00:00:00'), "dd/MM/yyyy");
};

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit, onCancel }) => {
  const { areas } = useAreas();
  const { routers } = useRouters();
  const { odp, loading: odpLoading, error: odpError } = useODP();
  const { packages } = usePackages();
  const { config: wahaConfig } = useWahaConfig();
  interface WhatsAppSettings { newCustomerMessageTemplate: string; enabled: boolean }
  const DEFAULT_CUSTOMER_WA_SETTINGS: WhatsAppSettings = {
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
  };
  const { setting: customerWaSettings } = useAppSetting<WhatsAppSettings>('customer-whatsapp-settings', DEFAULT_CUSTOMER_WA_SETTINGS);
  
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    idNumber: '',
    area: '',
    package: '',
    packagePrice: 0,
    addonPrice: 0,
    discount: 0,
    router: '',
    pppSecret: '',
    pppSecretType: 'none',
    odpSlot: '',
    odpId: '', // Tambahkan odpId untuk relasi ODP
    billingType: 'prepaid',
    activePeriod: 1,
    activePeriodUnit: 'months',
    installationStatus: 'not_installed',
    serviceStatus: 'inactive',
    mikrotikStatus: 'active',
    activeDate: formatDateToLocal(new Date()),
    billingStatus: customer?.billingStatus || (customer?.billingType === 'postpaid' ? 'belum_lunas' : 'lunas'),
    status: 'active',
    ...customer
  });

  const [pppSecrets, setPppSecrets] = useState<PPPSecret[]>([]);
  const [loadingSecrets, setLoadingSecrets] = useState(false);
  const [pppSearchTerm, setPppSearchTerm] = useState('');
  const [isPppDialogOpen, setIsPppDialogOpen] = useState(false);
  const [pppPassword, setPppPassword] = useState('');
  const [creatingPPP, setCreatingPPP] = useState(false);
  const [odpSearchTerm, setOdpSearchTerm] = useState('');
  const [odpComboboxOpen, setOdpComboboxOpen] = useState(false);

  // Filter PPP secrets based on search term
  const filteredPppSecrets = pppSecrets.filter(secret => 
    secret.name.toLowerCase().includes(pppSearchTerm.toLowerCase())
  );

  // Filter ODP yang tersedia (memiliki slot kosong)
  const availableODPs = useMemo(() => {
    return odp.filter(odpItem => odpItem.availableSlots > 0);
  }, [odp]);

  const filteredODPs = useMemo(() => {
    const term = odpSearchTerm.trim().toLowerCase();
    if (!term) return availableODPs;
    return availableODPs.filter((item) => (
      (item.name || '').toLowerCase().includes(term) ||
      (item.area || '').toLowerCase().includes(term) ||
      String(item.id || '').toLowerCase().includes(term)
    ));
  }, [availableODPs, odpSearchTerm]);

  // Suspend ODP polling while the ODP selection popover is open to prevent UI jitter
  useEffect(() => {
    try {
      const eventName = odpComboboxOpen ? 'odpSelectionStart' : 'odpSelectionEnd';
      window.dispatchEvent(new Event(eventName));
    } catch {}
  }, [odpComboboxOpen]);



  // Load customer data when editing (avoid overwriting user's ODP change on ODP list refresh)
  useEffect(() => {
    if (customer) {
      console.log('CustomerForm: Loading customer data for edit:', customer);
      console.log('CustomerForm: Available areas:', areas);
      console.log('CustomerForm: Available routers:', routers);
      console.log('CustomerForm: Available packages:', packages);
      
      // Convert router ID to router name for display
      let routerName = '';
      if (customer.router) {
        const router = routers.find(r => r.id === customer.router);
        routerName = router ? router.name : '';
      }
      
      // Preserve current odpId if the user has already changed it
      setFormData(prev => ({
        ...customer,
        router: routerName,
        activeDate: customer.activeDate ? customer.activeDate.split('T')[0] : formatDateToLocal(new Date()),
        expireDate: customer.expireDate ? customer.expireDate.split('T')[0] : '',
        paymentDueDate: customer.paymentDueDate ? customer.paymentDueDate.split('T')[0] : '',
        odpId: (prev?.odpId && String(prev.odpId).length > 0) ? prev.odpId : (customer as any).odpId || ''
      }));
    }
  }, [customer, routers]);

  // Set default dates for new customers
  useEffect(() => {
    if (!customer) {
      const now = new Date();
      const activeDate = new Date(now.getFullYear(), now.getMonth(), 1); // Tanggal 1 bulan ini
      const paymentDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 5); // Tanggal 5 bulan depan
      
      setFormData(prev => ({
        ...prev,
        activeDate: formatDateToLocal(activeDate),
        paymentDueDate: formatDateToLocal(paymentDueDate),
        installationStatus: 'installed', // Default terpasang
        serviceStatus: 'active' // Default aktif
      }));
    }
  }, [customer]);

  // Debug ODP data (kurangi spam log dengan dependency yang stabil)
  useEffect(() => {
    console.log('ODP Debug Info:', {
      odpLoading,
      odpError,
      odpCount: odp.length,
      availableODPsCount: availableODPs.length
    });
  }, [odpLoading, odpError, odp.length, availableODPs.length]);

  // Load PPP Secrets when router is selected
  useEffect(() => {
    if (formData.router && formData.pppSecretType === 'existing') {
      const selectedRouter = routers.find(r => r.name === formData.router);
      if (selectedRouter) {
        console.log('Loading PPP secrets for router:', selectedRouter.name, 'ID:', selectedRouter.id);
        loadPPPSecrets(selectedRouter.id.toString());
      }
    } else if (formData.pppSecretType !== 'existing') {
      // Clear PPP secrets when not using existing secrets
      setPppSecrets([]);
    }
  }, [formData.router, formData.pppSecretType, routers]);

  // Prefill PPP Secret username when selecting 'new'
  useEffect(() => {
    if (formData.pppSecretType === 'new') {
      // Prefill username based on phone if available
      const sanitizedPhone = (formData.phone || '').replace(/[^0-9]/g, '');
      if (!formData.pppSecret && sanitizedPhone) {
        setFormData(prev => ({ ...prev, pppSecret: sanitizedPhone }));
      }
    }
  }, [formData.pppSecretType, formData.phone]);

  // Update package price when package is selected
  useEffect(() => {
    if (formData.package) {
      const selectedPackage = packages.find(pkg => pkg.name === formData.package);
      if (selectedPackage) {
        setFormData(prev => ({ ...prev, packagePrice: selectedPackage.price }));
      }
    }
  }, [formData.package, packages]);

  // Calculate expire date when active date or period changes
  useEffect(() => {
    if (formData.activeDate && formData.activePeriod) {
      const activeDate = new Date(formData.activeDate + 'T00:00:00');
      const expireDate = new Date(activeDate);
      
      if (formData.activePeriodUnit === 'months') {
        expireDate.setMonth(expireDate.getMonth() + formData.activePeriod);
      } else {
        expireDate.setDate(expireDate.getDate() + formData.activePeriod);
      }
      
      setFormData(prev => ({ 
        ...prev, 
        expireDate: formatDateToLocal(expireDate)
      }));
    }
  }, [formData.activeDate, formData.activePeriod, formData.activePeriodUnit]);

  // Update billingStatus when billingType changes
  useEffect(() => {
    if (formData.billingType === 'prepaid') {
      setFormData(prev => ({ 
        ...prev, 
        billingStatus: 'lunas',
        status: 'active'
      }));
    } else if (formData.billingType === 'postpaid') {
      setFormData(prev => ({ 
        ...prev, 
        billingStatus: 'belum_lunas',
        status: 'active'
      }));
    }
  }, [formData.billingType]);

  // Function to get profile based on package
  const getProfileFromPackage = (packageName: string) => {
    const selectedPackage = packages.find(pkg => pkg.name === packageName);
    if (!selectedPackage) return 'default';
    
    // Use mikrotikProfile from package if available, otherwise fallback to speed-based profile
    return selectedPackage.mikrotikProfile || `${selectedPackage.downloadSpeed || 0}M-${selectedPackage.uploadSpeed || 0}M`;
  };

  // WhatsApp notification function
  const sendWhatsAppNotification = async (customerData: Partial<Customer>) => {
    const waSettings = customerWaSettings || DEFAULT_CUSTOMER_WA_SETTINGS;

    if (!waSettings.enabled) {
      console.log('WhatsApp notifications disabled for new customers');
      return;
    }

    try {
      // Use WAHA config from hook (server persisted)
      if (!wahaConfig || !wahaConfig.baseUrl || !wahaConfig.session) {
        console.warn('WAHA config not found. Please configure WAHA settings in Messages page.');
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
      console.warn('WhatsApp notification failed:', error);
      toast.error('Gagal mengirim notifikasi WhatsApp');
      return false;
    }
  };

  const loadPPPSecrets = async (routerId: string) => {
    setLoadingSecrets(true);
    try {
      // Try using the API client first
      try {
        const response = await api.getPPPSecrets(routerId);
        console.log('PPP Secrets loaded via API client:', response);
        
        const secretsArray = Array.isArray(response.data) ? response.data : (response.data || []);
        setPppSecrets(secretsArray);
        
        if (secretsArray.length === 0) {
          console.warn('No PPP secrets found for router:', routerId);
        }
        return; // Success, exit early
      } catch (apiError: any) {
        console.warn('API client failed:', apiError);
      }
      
      // Fallback to direct fetch if API client fails
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.latansa.my.id/api';
      
      const response = await fetch(`${API_BASE_URL}/routers/${routerId}/ppp-secrets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const secrets = await response.json();
        console.log('PPP Secrets loaded via direct fetch:', secrets);
        
        // Handle both array response and API response format
        const secretsArray = Array.isArray(secrets) ? secrets : (secrets.data || []);
        setPppSecrets(secretsArray);
        
        if (secretsArray.length === 0) {
          console.warn('No PPP secrets found for router:', routerId);
        }
      } else {
        console.warn('PPP Secrets API endpoint returned error:', response.status, response.statusText);
        setPppSecrets([]);
      }
    } catch (error) {
      console.warn('PPP Secrets API not available - using manual input only:', error);
      setPppSecrets([]);
    } finally {
      setLoadingSecrets(false);
    }
  };
  
  const createNewPPPSecret = async () => {
    try {
      if (creatingPPP) return;
      // Validate inputs
      if (!formData.router) {
        toast.error('Pilih router terlebih dahulu');
        return;
      }
      if (!formData.package) {
        toast.error('Pilih paket terlebih dahulu');
        return;
      }
      if (!formData.pppSecret) {
        toast.error('Masukkan username PPP');
        return;
      }
      if (!pppPassword) {
        toast.error('Masukkan password PPP');
        return;
      }

      const selectedRouter = routers.find(r => r.name === formData.router);
      if (!selectedRouter) {
        toast.error('Router tidak valid');
        return;
      }

      const profile = getProfileFromPackage(formData.package);
      setCreatingPPP(true);
      const resp = await api.createPPPSecret(selectedRouter.id.toString(), {
        name: formData.pppSecret,
        password: pppPassword,
        profile,
        service: 'pppoe',
        comment: `Created via CustomerForm for ${formData.name || ''}`
      });

      if (resp.success) {
        toast.success(`PPP Secret '${formData.pppSecret}' berhasil dibuat di MikroTik`);
        // Keep the selected secret in form
        setFormData(prev => ({ ...prev, pppSecret: formData.pppSecret }));
      } else {
        toast.error(resp.message || 'Gagal membuat PPP Secret');
      }
    } catch (error) {
      console.error('Create PPP Secret error:', error);
      toast.error('Terjadi kesalahan saat membuat PPP Secret');
    } finally {
      setCreatingPPP(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      alert('Nama dan telepon wajib diisi');
      return;
    }
    
    // Jika pilih buat secret baru, coba buat di MikroTik terlebih dahulu
    if (formData.pppSecretType === 'new') {
      if (!formData.router) {
        alert('Pilih router terlebih dahulu untuk membuat PPP Secret');
        return;
      }
      if (!formData.package) {
        alert('Pilih paket terlebih dahulu untuk menentukan profile PPP');
        return;
      }
      if (!formData.pppSecret) {
        alert('Masukkan username PPP Secret');
        return;
      }
      if (!pppPassword) {
        alert('Masukkan password PPP Secret');
        return;
      }
      try {
        await createNewPPPSecret();
      } catch (err) {
        console.warn('Melewati pembuatan PPP Secret karena error:', err);
      }
    }
    
    try {
      // Basic validation to prevent server 500 on missing required fields
      const errors: string[] = [];
      const sanitizedPhone = (formData.phone || '').trim();
      if (!formData.name || !String(formData.name).trim()) errors.push('Nama pelanggan wajib diisi');
      if (!sanitizedPhone) errors.push('Nomor telepon wajib diisi');
      if (!formData.area) errors.push('Area wajib dipilih');
      if (!formData.package) errors.push('Paket wajib dipilih');
      if (!formData.activeDate) errors.push('Tanggal aktif wajib diisi');
      if (!formData.expireDate) errors.push('Tanggal kadaluarsa wajib diisi');
      if (!formData.paymentDueDate) errors.push('Jatuh tempo pembayaran wajib diisi');

      if (errors.length > 0) {
        toast.error('Data tidak lengkap', { description: errors.join(', ') });
        return;
      }

      // Convert router name to router ID
      const submitData = { ...formData };
      if (submitData.router) {
        const selectedRouter = routers.find(r => r.name === submitData.router);
        if (selectedRouter) {
          (submitData as any).routerId = selectedRouter.id;
          delete submitData.router;
        }
      }
      
      // Biarkan backend yang menghasilkan customerNumber unik
      
      if (!submitData.paymentDueDate) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        submitData.paymentDueDate = dueDate.toISOString().split('T')[0];
      }
      
      // Normalisasi dan sanitasi tipe untuk odpId jika ada
      console.log('🔍 Debug - Original odpId:', submitData.odpId, 'Type:', typeof submitData.odpId);
      if (typeof submitData.odpId === 'string') {
        const trimmed = (submitData.odpId || '').trim();
        if (trimmed.length === 0) {
          // Hapus field kosong untuk mencegah MySQL mengubah '' menjadi 0
          delete (submitData as any).odpId;
          console.log('🔍 Debug - odpId kosong, dihapus dari payload');
        } else {
          const parsed = parseInt(trimmed, 10);
          console.log('🔍 Debug - Parsed odpId:', parsed, 'isNaN:', isNaN(parsed));
          if (!isNaN(parsed)) {
            (submitData as any).odpId = parsed;
            console.log('🔍 Debug - Final odpId (number):', submitData.odpId);
          } else {
            // Nilai tidak valid, hapus untuk menghindari FK error
            delete (submitData as any).odpId;
            console.log('🔍 Debug - odpId tidak valid, dihapus dari payload');
          }
        }
      } else if (submitData.odpId === undefined || submitData.odpId === null) {
        console.log('🔍 Debug - No odpId provided, field absent');
      } else if (typeof submitData.odpId === 'number') {
        console.log('🔍 Debug - odpId is number:', submitData.odpId);
      }

      // Submit the customer data
      console.log('🚀 Debug - Complete payload being sent:', JSON.stringify(submitData, null, 2));
      onSubmit(submitData);
      
      // Send WhatsApp notification for new customers only
      if (!customer && submitData.phone) {
        await sendWhatsAppNotification(submitData);
      }
      
    } catch (error: any) {
      console.error('Error in form submission:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    }
  };

  const handleChange = (field: keyof Customer, value: string | number | boolean) => {
    console.log('Field changed:', field, 'Value:', value);
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Special handling for pppSecretType changes
    if (field === 'pppSecretType' && value === 'existing' && formData.router) {
      const selectedRouter = routers.find(r => r.name === formData.router);
      if (selectedRouter) {
        console.log('PPP Secret type changed to existing, loading secrets for router:', selectedRouter.name);
        loadPPPSecrets(selectedRouter.id.toString());
      }
    } else if (field === 'pppSecretType' && value !== 'existing') {
      // Clear PPP secrets when switching away from 'existing'
      setPppSecrets([]);
    }
  };

  const handleRouterChange = (routerName: string) => {
    console.log('Router changed to:', routerName);
    setFormData(prev => ({ 
      ...prev, 
      router: routerName,
      pppSecret: ''
    }));
    setPppSecrets([]);
    
    // Load PPP secrets if pppSecretType is already set to 'existing'
    if (formData.pppSecretType === 'existing') {
      const selectedRouter = routers.find(r => r.name === routerName);
      if (selectedRouter) {
        console.log('Loading PPP secrets for newly selected router:', selectedRouter.name, 'ID:', selectedRouter.id);
        loadPPPSecrets(selectedRouter.id.toString());
      }
    }
  };

  const totalPrice = (formData.packagePrice || 0) + (formData.addonPrice || 0) - (formData.discount || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {customer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
          </h2>
          <p className="text-gray-600">
            {customer ? 'Ubah data pelanggan' : 'Masukkan data pelanggan baru'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data Pelanggan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nama Pelanggan *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="idNumber">No KTP (Opsional)</Label>
              <Input
                id="idNumber"
                value={formData.idNumber || ''}
                onChange={(e) => handleChange('idNumber', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telepon *</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>
          
          {/* Area & Router */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Wilayah / Area *</Label>
              <Select value={formData.area || undefined} onValueChange={(value) => handleChange('area', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih wilayah" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.name}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Router</Label>
              <Select 
                value={formData.router || undefined} 
                onValueChange={handleRouterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih router" />
                </SelectTrigger>
                <SelectContent>
                  {routers.map((router) => (
                    <SelectItem key={router.id} value={router.name}>
                      {router.name} - {router.ipAddress}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Package */}
          <div>
            <Label>Paket Internet *</Label>
            <Select value={formData.package || undefined} onValueChange={(value) => handleChange('package', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih paket" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.name}>
                    {pkg.name} - {pkg.downloadSpeed}Mbps - Rp {pkg.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* ODP Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ODP (Optical Distribution Point)</Label>
              <Popover open={odpComboboxOpen} onOpenChange={setOdpComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {formData.odpId
                      ? (() => {
                          const selected = odp.find((o) => String(o.id) === String(formData.odpId));
                          return selected ? `${selected.name} - ${selected.area} (Slot: ${selected.availableSlots}/${selected.totalSlots})` : 'Pilih ODP';
                        })()
                      : 'Pilih ODP'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[480px] max-h-[380px] overflow-auto">
                  {odpLoading ? (
                    <div className="p-3 text-sm">Loading ODP...</div>
                  ) : odpError ? (
                    <div className="p-3 text-sm text-red-600">Error memuat ODP</div>
                  ) : (
                    <Command>
                      <CommandInput placeholder="Cari ODP berdasarkan nama/area/ID..." autoFocus />
                      <CommandList className="max-h-[340px] overflow-y-auto">
                        <CommandEmpty>Tidak ada ODP yang cocok</CommandEmpty>
                        <CommandGroup heading="Daftar ODP">
                          {filteredODPs.map((o) => (
                            <CommandItem
                              key={o.id}
                              value={`${o.name} ${o.area} ${o.id}`}
                              onSelect={() => {
                                handleChange('odpId', o.id?.toString() || '');
                                setOdpComboboxOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">{o.name} <span className="text-xs text-gray-500">({o.area})</span></span>
                                <span className="text-xs text-gray-500">ID: {o.id} • Slot: {o.availableSlots}/{o.totalSlots}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="odpSlot">Slot ODP</Label>
              <Input
                id="odpSlot"
                value={formData.odpSlot || ''}
                onChange={(e) => handleChange('odpSlot', e.target.value)}
                placeholder="Nomor slot (opsional)"
              />
            </div>
          </div>
          
          {/* PPP Secret Configuration */}
          <div className="space-y-4">
            <div>
              <Label>Konfigurasi PPP Secret</Label>
              <Select 
                value={formData.pppSecretType || 'none'} 
                onValueChange={(value) => handleChange('pppSecretType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              <SelectContent>
                  <SelectItem value="none">Tidak menggunakan PPP Secret</SelectItem>
                  <SelectItem value="existing">Gunakan PPP Secret yang sudah ada</SelectItem>
                  <SelectItem value="new">Buat Secret Baru</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.pppSecretType === 'new' && (
            <div className="space-y-3 border rounded p-3 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pppSecretNew">Username PPP</Label>
                  <Input
                    id="pppSecretNew"
                    value={formData.pppSecret || ''}
                    onChange={(e) => handleChange('pppSecret', e.target.value)}
                    placeholder="Masukkan username PPP"
                  />
                </div>
                <div>
                  <Label htmlFor="pppPassword">Password PPP</Label>
                  <Input
                    id="pppPassword"
                    type="password"
                    value={pppPassword}
                    onChange={(e) => setPppPassword(e.target.value)}
                    placeholder="Masukkan password PPP"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Router:</span>{' '}
                  {formData.router || 'Belum dipilih'}
                </div>
                <div>
                  <span className="font-medium">Paket:</span>{' '}
                  {formData.package || 'Belum dipilih'}
                </div>
                <div>
                  <span className="font-medium">Profile:</span>{' '}
                  {formData.package ? getProfileFromPackage(formData.package) : '-'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={createNewPPPSecret} disabled={creatingPPP}>
                  {creatingPPP ? 'Membuat...' : 'Buat Secret Baru di MikroTik'}
                </Button>
                {formData.pppSecret && (
                  <p className="text-sm text-green-600 flex items-center">
                    ✓ Username akan digunakan: {formData.pppSecret}
                  </p>
                )}
              </div>
            </div>
          )}

            {formData.pppSecretType === 'existing' && (
              <div>
                <Label htmlFor="pppSecret">PPP Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="pppSecret"
                    value={formData.pppSecret || ''}
                    onChange={(e) => handleChange('pppSecret', e.target.value)}
                    placeholder="PPP Secret yang dipilih..."
                    readOnly
                    className="flex-1"
                  />
                  <Dialog open={isPppDialogOpen} onOpenChange={setIsPppDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Search className="h-4 w-4 mr-1" />
                        Pilih
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Pilih PPP Secret</DialogTitle>
                        <DialogDescription>
                          Pilih PPP Secret yang tersedia dari router untuk pelanggan ini.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Cari PPP Secret..."
                            value={pppSearchTerm}
                            onChange={(e) => setPppSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                          {pppSearchTerm && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => setPppSearchTerm('')}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        {loadingSecrets && (
                          <div className="text-center py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <p className="text-sm text-gray-500">Memuat PPP Secrets dari router...</p>
                            </div>
                          </div>
                        )}
                        
                        {!loadingSecrets && filteredPppSecrets.length === 0 && pppSearchTerm && (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">Tidak ada PPP Secret yang ditemukan</p>
                          </div>
                        )}
                        
                        {!loadingSecrets && filteredPppSecrets.length === 0 && !pppSearchTerm && pppSecrets.length === 0 && (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">
                              {!formData.router 
                                ? "Pilih router terlebih dahulu untuk melihat PPP Secrets" 
                                : "Tidak ada PPP Secret yang tersedia untuk router ini"}
                            </p>
                          </div>
                        )}
                        
                        {filteredPppSecrets.length > 0 && (
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {filteredPppSecrets.map((secret, index) => (
                              <div
                                key={index}
                                className="cursor-pointer hover:bg-gray-100 p-3 rounded border transition-colors"
                                onClick={() => {
                                  handleChange('pppSecret', secret.name);
                                  setPppSearchTerm('');
                                  setIsPppDialogOpen(false);
                                }}
                              >
                                <div className="font-medium text-sm">{secret.name}</div>
                                <div className="text-xs text-gray-500">
                                  Profile: {secret.profile} | Service: {secret.service}
                                  {secret.disabled && <span className="text-red-500 ml-2">(Disabled)</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setPppSearchTerm('');
                              setIsPppDialogOpen(false);
                            }}
                          >
                            Batal
                          </Button>
                          {formData.pppSecret && (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                handleChange('pppSecret', '');
                                setPppSearchTerm('');
                                setIsPppDialogOpen(false);
                              }}
                            >
                              Hapus Pilihan
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {formData.pppSecret && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ PPP Secret terpilih: {formData.pppSecret}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Periode Aktif */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="activePeriod">Periode Aktif</Label>
              <Input
                id="activePeriod"
                type="number"
                min="1"
                value={formData.activePeriod || 1}
                onChange={(e) => handleChange('activePeriod', parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div>
              <Label>Satuan Periode</Label>
              <Select 
                value={formData.activePeriodUnit || 'months'} 
                onValueChange={(value) => handleChange('activePeriodUnit', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Hari</SelectItem>
                  <SelectItem value="months">Bulan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status MikroTik</Label>
              <Select 
                value={formData.mikrotikStatus || 'active'} 
                onValueChange={(value) => handleChange('mikrotikStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Tanggal */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Tanggal Aktif</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal pl-3",
                      !formData.activeDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                    {formData.activeDate && isValidDate(formData.activeDate) ? (
                      format(new Date(formData.activeDate + 'T00:00:00'), "dd/MM/yyyy")
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={isValidDate(formData.activeDate) ? new Date(formData.activeDate + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleChange('activeDate', formatDateToLocal(date));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Tanggal Kadaluarsa</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal pl-3",
                      !formData.expireDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                    {formData.expireDate && isValidDate(formData.expireDate) ? (
                      format(new Date(formData.expireDate + 'T00:00:00'), "dd/MM/yyyy")
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={isValidDate(formData.expireDate) ? new Date(formData.expireDate + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleChange('expireDate', formatDateToLocal(date));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Jatuh Tempo Pembayaran</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal pl-3",
                      !formData.paymentDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                    {formData.paymentDueDate ? (
                      format(new Date(formData.paymentDueDate), "dd/MM/yyyy")
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.paymentDueDate ? new Date(formData.paymentDueDate + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleChange('paymentDueDate', formatDateToLocal(date));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Pricing */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="packagePrice">Harga Paket</Label>
              <Input
                id="packagePrice"
                type="number"
                value={formData.packagePrice || 0}
                onChange={(e) => handleChange('packagePrice', parseInt(e.target.value) || 0)}
                readOnly
              />
            </div>
            
            <div>
              <Label htmlFor="addonPrice">Harga Addon</Label>
              <Input
                id="addonPrice"
                type="number"
                value={formData.addonPrice || 0}
                onChange={(e) => handleChange('addonPrice', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="discount">Diskon</Label>
              <Input
                id="discount"
                type="number"
                value={formData.discount || 0}
                onChange={(e) => handleChange('discount', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label>Total Harga</Label>
              <Input
                value={`Rp ${totalPrice.toLocaleString()}`}
                readOnly
                className="font-semibold"
              />
            </div>
          </div>
          
          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status Pemasangan</Label>
              <Select 
                value={formData.installationStatus || 'not_installed'} 
                onValueChange={(value) => handleChange('installationStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_installed">Belum Terpasang</SelectItem>
                  <SelectItem value="installed">Terpasang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status Aktif</Label>
              <Select 
                value={formData.serviceStatus || 'inactive'} 
                onValueChange={(value) => handleChange('serviceStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Tipe Billing */}
          <div>
            <Label>Tipe Billing</Label>
            <Select 
              value={formData.billingType || 'prepaid'} 
              onValueChange={(value) => handleChange('billingType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prepaid">Prepaid</SelectItem>
                <SelectItem value="postpaid">Postpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          
          <div>
            <Label htmlFor="notes">Catatan</Label>
            <Input
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Catatan tambahan..."
            />
          </div>
          
          <div className="flex gap-2">
            <Button type="submit">
              {customer ? 'Update' : 'Simpan'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerForm;
