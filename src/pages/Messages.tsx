import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, Users, MessageSquare, Clock, Settings, FileText, Trash2, Edit, RefreshCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCustomers } from '@/hooks/useCustomers';
import { useAreas } from '@/hooks/useAreas';
import { usePackages } from '@/hooks/usePackages';
import { useODP } from '@/hooks/useODP';
import { Customer } from '@/types/isp';
import { useToast } from '@/hooks/use-toast';
import { useWahaConfig } from '../hooks/useWahaConfig';

interface MessageHistory {
  id: string;
  recipients: number;
  message: string;
  criteria: string;
  sentAt: Date;
  status: 'sent' | 'failed' | 'pending';
  failedRecipients?: { id: string | number; name: string; phone: string }[];
  recipientDetails?: { id: string | number; name: string; phone: string; status: 'queued' | 'sending' | 'sent' | 'failed' }[];
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  category: 'maintenance' | 'payment' | 'promotion' | 'general';
}

interface BroadcastCriteria {
  paymentStatus: string;
  dateExpiryCriteria: string;
  dateSuspendCriteria: string;
  area: string;
  package: string;
  odp: string;
  sendToCustomer: string;
  message: string;
}

const Messages = () => {
  const { customers } = useCustomers();
  const { areas } = useAreas();
  const { packages } = usePackages();
  const { odp } = useODP();
  const { toast } = useToast();
  
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAddTemplateDialog, setShowAddTemplateDialog] = useState(false);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [isSending, setIsSending] = useState(false);
  // Jeda antar pesan (default 5 detik)
  const [sendDelayMs] = useState(5000);
  // Antrian pengiriman per pelanggan
  type QueueStatus = 'queued' | 'sending' | 'sent' | 'failed';
  interface QueueItem {
    id: string;
    customerId: string | number;
    name: string;
    phone: string;
    status: QueueStatus;
    error?: string;
  }
  const [sendingQueue, setSendingQueue] = useState<QueueItem[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  // Dialog: daftar penerima per riwayat
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false);
  const [recipientsDialogData, setRecipientsDialogData] = useState<{ id: string; recipients: { id: string | number; name: string; phone: string; status: 'queued' | 'sending' | 'sent' | 'failed' }[] } | null>(null);
  const openRecipientsDialog = (history: MessageHistory) => {
    setRecipientsDialogData({ id: history.id, recipients: history.recipientDetails || [] });
    setRecipientsDialogOpen(true);
  };
  const closeRecipientsDialog = () => {
    setRecipientsDialogOpen(false);
    setRecipientsDialogData(null);
  };
  // Message detail dialog
  const [messageDetailOpen, setMessageDetailOpen] = useState(false);
  const [messageDetailData, setMessageDetailData] = useState<{ id: string; message: string; criteria: string } | null>(null);
  const openMessageDetail = (history: MessageHistory) => {
    setMessageDetailData({ id: history.id, message: history.message, criteria: history.criteria });
    setMessageDetailOpen(true);
  };
  const closeMessageDetail = () => {
    setMessageDetailOpen(false);
    setMessageDetailData(null);
  };
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'general' as MessageTemplate['category']
  });
  
  const { config, isLoading: wahaLoading, error, updateConfig } = useWahaConfig();
  
  const [formConfig, setFormConfig] = useState({
    baseUrl: '',
    session: '',
    apiKey: ''
  });
  
  // Update form when API data loads
  useEffect(() => {
    if (config) {
      console.log('Setting form config from API:', config);
      setFormConfig(config);
    }
  }, [config]);

  // Load message history dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('messageHistory');
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored: MessageHistory[] = (parsed || []).map((h: any) => ({
          ...h,
          sentAt: h.sentAt ? new Date(h.sentAt) : new Date()
        }));
        setMessageHistory(restored.slice(0, 200));
      }
    } catch (e) {
      console.error('Error loading message history:', e);
    }
  }, []);

  // Persist message history ke localStorage saat berubah
  useEffect(() => {
    try {
      const serializable = messageHistory.map(h => ({
        ...h,
        sentAt: h.sentAt instanceof Date ? h.sentAt.toISOString() : h.sentAt
      }));
      localStorage.setItem('messageHistory', JSON.stringify(serializable));
    } catch (e) {
      console.error('Error saving message history:', e);
    }
  }, [messageHistory]);

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('messageTemplates');
    if (savedTemplates) {
      try {
        const templates = JSON.parse(savedTemplates);
        setMessageTemplates(templates.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt)
        })));
      } catch (error) {
        console.error('Error loading message templates:', error);
      }
    } else {
      // Set default templates
      const defaultTemplates: MessageTemplate[] = [
        {
          id: '1',
          name: 'Pemeliharaan Jaringan',
          category: 'maintenance',
          content: `Pemberitahuan Pemeliharaan Jaringan\n\nKepada Pelanggan Yth,\n\nKami ingin memberitahukan bahwa saat ini kami sedang melakukan pemeliharaan jaringan di area [AREA], dikarenakan adanya gangguan pada kabel Fiber yang putus.\n\nNama: [NAMA]\nNo. Pelanggan: [NOPEL]\nPaket: [PAKET]\n\nMohon pengertian Anda atas ketidaknyamanan yang terjadi.`,
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Reminder Pembayaran',
          category: 'payment',
          content: `Reminder Pembayaran Tagihan\n\nYth. [NAMA],\n\nTagihan internet Anda untuk bulan ini akan jatuh tempo. Mohon segera lakukan pembayaran.\n\nNo. Pelanggan: [NOPEL]\nPaket: [PAKET]\nArea: [AREA]\n\nTerima kasih atas perhatiannya.`,
          createdAt: new Date()
        }
      ];
      setMessageTemplates(defaultTemplates);
      localStorage.setItem('messageTemplates', JSON.stringify(defaultTemplates));
    }
  }, []);
  
  const [broadcastData, setBroadcastData] = useState<BroadcastCriteria>({
    paymentStatus: '',
    dateExpiryCriteria: '',
    dateSuspendCriteria: '',
    area: '',
    package: '',
    odp: '',
    sendToCustomer: '',
    message: `Pemberitahuan Pemeliharaan Jaringan\n\nKepada Pelanggan Yth,\n\nKami ingin memberitahukan bahwa saat ini kami sedang melakukan pemeliharaan jaringan di area [AREA], dikarenakan adanya gangguan pada kabel Fiber yang putus.\n\nNama: [NAMA]\nNo. Pelanggan: [NOPEL]\nPaket: [PAKET]\n\nMohon pengertian Anda atas ketidaknyamanan yang terjadi.`
  });

  // Dialog pemilih pelanggan
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Template management functions
  const saveTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast({
        title: "Error",
        description: "Nama dan isi template harus diisi",
        variant: "destructive"
      });
      return;
    }

    const template: MessageTemplate = {
      id: editingTemplate ? editingTemplate.id : Date.now().toString(),
      name: newTemplate.name.trim(),
      content: newTemplate.content.trim(),
      category: newTemplate.category,
      createdAt: editingTemplate ? editingTemplate.createdAt : new Date()
    };

    let updatedTemplates;
    if (editingTemplate) {
      updatedTemplates = messageTemplates.map(t => t.id === editingTemplate.id ? template : t);
      toast({
        title: "Berhasil",
        description: "Template berhasil diperbarui"
      });
    } else {
      updatedTemplates = [...messageTemplates, template];
      toast({
        title: "Berhasil",
        description: "Template berhasil ditambahkan"
      });
    }

    setMessageTemplates(updatedTemplates);
    localStorage.setItem('messageTemplates', JSON.stringify(updatedTemplates));
    
    // Reset form
    setNewTemplate({ name: '', content: '', category: 'general' });
    setEditingTemplate(null);
    setShowAddTemplateDialog(false);
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = messageTemplates.filter(t => t.id !== templateId);
    setMessageTemplates(updatedTemplates);
    localStorage.setItem('messageTemplates', JSON.stringify(updatedTemplates));
    toast({
      title: "Berhasil",
      description: "Template berhasil dihapus"
    });
  };

  const editTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      content: template.content,
      category: template.category
    });
    setShowAddTemplateDialog(true);
  };

  const useTemplate = (template: MessageTemplate) => {
    setBroadcastData(prev => ({
      ...prev,
      message: template.content
    }));
    setShowTemplateDialog(false);
    toast({
      title: "Berhasil",
      description: `Template "${template.name}" berhasil dimuat`
    });
  };

  const getCategoryBadgeColor = (category: MessageTemplate['category']) => {
    switch (category) {
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'payment': return 'bg-blue-100 text-blue-800';
      case 'promotion': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: MessageTemplate['category']) => {
    switch (category) {
      case 'maintenance': return 'Pemeliharaan';
      case 'payment': return 'Pembayaran';
      case 'promotion': return 'Promosi';
      default: return 'Umum';
    }
  };

  // Filter customers based on criteria
  const getFilteredCustomers = (): Customer[] => {
    if (!customers) return [];
    
    console.log('Starting filter with criteria:', broadcastData);
    console.log('Total customers:', customers.length);
    
    return customers.filter((customer) => {
      // PERBAIKAN: Jika ada filter pelanggan tertentu, prioritaskan dan abaikan filter lainnya
      if (broadcastData.sendToCustomer && broadcastData.sendToCustomer.trim() !== '') {
        const searchTerm = broadcastData.sendToCustomer.toLowerCase().trim();
        
        // Jika input adalah nomor (hanya angka), prioritaskan pencarian nomor
        const isNumericSearch = /^\d+$/.test(searchTerm);
        
        let matches = false;
        
        if (isNumericSearch) {
          // Pencarian berdasarkan nomor (nomor pelanggan atau HP)
          matches = customer.customerNumber.toLowerCase().includes(searchTerm) ||
                   customer.phone.replace(/[^0-9]/g, '').includes(searchTerm);
        } else {
          // Pencarian berdasarkan nama atau kombinasi
          matches = customer.name.toLowerCase().includes(searchTerm) ||
                   customer.customerNumber.toLowerCase().includes(searchTerm) ||
                   customer.phone.replace(/[^0-9]/g, '').includes(searchTerm.replace(/[^0-9]/g, '')) ||
                   (customer.address && customer.address.toLowerCase().includes(searchTerm));
        }
        
        if (matches) {
          console.log('Customer matched search term:', customer.name);
          return true;
        } else {
          console.log('Filtered out by search term:', customer.name, 'Search:', searchTerm);
          return false;
        }
      }

      // Filter ODP, Wilayah (Area), dan Paket
      // Area
      if (broadcastData.area && broadcastData.area !== 'all') {
        if (customer.area !== broadcastData.area) {
          console.log('Filtered out by area:', customer.name, 'area:', customer.area, 'filter:', broadcastData.area);
          return false;
        }
      }
      // Paket
      if (broadcastData.package && broadcastData.package !== 'all') {
        if (customer.package !== broadcastData.package) {
          console.log('Filtered out by package:', customer.name, 'package:', customer.package, 'filter:', broadcastData.package);
          return false;
        }
      }
      // ODP (gunakan nama ODP dari relasi atau slot ODP jika tersedia)
      if (broadcastData.odp && broadcastData.odp !== 'all') {
        const selectedODP = broadcastData.odp.toLowerCase().trim();
        const customerODPName = (customer.odpData?.name || '').toLowerCase().trim();
        const customerODPSlotRaw = (customer.odpSlot || '').toLowerCase().trim();
        const customerODPSlotBase = customerODPSlotRaw.split('/')[0];
        const matchesODP = customerODPName === selectedODP || customerODPSlotRaw === selectedODP || customerODPSlotBase === selectedODP;
        if (!matchesODP) {
          console.log('Filtered out by ODP:', customer.name, 'odpData.name:', customerODPName, 'odpSlotRaw:', customerODPSlotRaw, 'odpSlotBase:', customerODPSlotBase, 'filter:', selectedODP);
          return false;
        }
      }
      
      // Payment status filter — selaraskan dengan due day (paymentDueDate) dan aturan prepaid/postpaid
      if (broadcastData.paymentStatus && broadcastData.paymentStatus !== 'all') {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Normalize today and important dates
        const today = new Date(); today.setHours(0,0,0,0);
        const expireDate = customer.expireDate ? new Date(customer.expireDate) : null;
        if (expireDate) expireDate.setHours(0,0,0,0);
        const lastBillingDate = customer.lastBillingDate ? new Date(customer.lastBillingDate) : null;
        if (lastBillingDate) lastBillingDate.setHours(0,0,0,0);

        // due day from paymentDueDate if available, fallback to 5
        const dueDateObj = customer.paymentDueDate ? new Date(customer.paymentDueDate) : null;
        const dueDay = dueDateObj ? dueDateObj.getDate() : 5;
        const withinBillingWindow = currentDay >= 1 && currentDay <= dueDay;

        const hasPaidThisMonth = !!(lastBillingDate && lastBillingDate.getMonth() === currentMonth && lastBillingDate.getFullYear() === currentYear);
        const isPostpaid = customer.billingType === 'postpaid';
        const isPrepaid = customer.billingType === 'prepaid';
        const isSuspendedLike = (customer.status === 'suspended') || (customer.billingStatus === 'suspend') || (customer.mikrotikStatus === 'disabled') || !!customer.isIsolated;

        // Helper flags for prepaid
        const expired = expireDate ? expireDate.getTime() < today.getTime() : false;
        const expiredThisMonth = !!(expireDate && expireDate.getMonth() === currentMonth && expireDate.getFullYear() === currentYear && expired);

        if (broadcastData.paymentStatus === 'paid') {
          // Postpaid: paid if has payment in current month
          // Prepaid: paid/active if not expired
          const isPaid = isPostpaid ? hasPaidThisMonth : !expired;
          if (!isPaid) {
            console.log('Filtered out by payment status (paid rule):', customer.name, { hasPaidThisMonth, expired });
            return false;
          }
        }

        if (broadcastData.paymentStatus === 'unpaid') {
          if (isPostpaid) {
            const isUnpaidThisWindow = withinBillingWindow && !hasPaidThisMonth && !isSuspendedLike;
            if (!isUnpaidThisWindow) {
              console.log('Filtered out by payment status (postpaid unpaid with dueDay):', customer.name, { currentDay, dueDay, withinBillingWindow, hasPaidThisMonth, isSuspendedLike });
              return false;
            }
          } else if (isPrepaid) {
            // Prepaid: only show as unpaid if expired this month AND within billing window
            const isUnpaidPrepaidWindow = expiredThisMonth && withinBillingWindow && !isSuspendedLike;
            if (!isUnpaidPrepaidWindow) {
              console.log('Filtered out by payment status (prepaid expired this month + window):', customer.name, { expiredThisMonth, withinBillingWindow, isSuspendedLike });
              return false;
            }
          } else {
            // Other types: fallback to not overdue as paid, overdue within window as unpaid
            const isOverdue = expireDate ? expireDate.getTime() < today.getTime() : false;
            const ok = withinBillingWindow && isOverdue && !isSuspendedLike;
            if (!ok) {
              console.log('Filtered out by payment status (fallback type rule):', customer.name, { isOverdue, withinBillingWindow, isSuspendedLike });
              return false;
            }
          }
        }
      }
      
      // Date expiry criteria - perbaiki logika tanggal
      if (broadcastData.dateExpiryCriteria && broadcastData.dateExpiryCriteria !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (!customer.expireDate) {
          console.log('Filtered out by expiry date (no date):', customer.name);
          return false;
        }
        
        const expireDate = new Date(customer.expireDate);
        expireDate.setHours(0, 0, 0, 0);
        
        if (broadcastData.dateExpiryCriteria === 'today') {
          if (expireDate.getTime() !== today.getTime()) {
            console.log('Filtered out by expiry date (not today):', customer.name);
            return false;
          }
        } else if (broadcastData.dateExpiryCriteria === 'tomorrow') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (expireDate.getTime() !== tomorrow.getTime()) {
            console.log('Filtered out by expiry date (not tomorrow):', customer.name);
            return false;
          }
        } else {
          // Handle specific day criteria (1_day, 2_days, etc.)
          const daysMap: { [key: string]: number } = {
            '1_day': 1, '2_days': 2, '3_days': 3, '4_days': 4,
            '5_days': 5, '6_days': 6, '7_days': 7
          };
          
          if (daysMap[broadcastData.dateExpiryCriteria]) {
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + daysMap[broadcastData.dateExpiryCriteria]);
            if (expireDate.getTime() !== targetDate.getTime()) {
              console.log('Filtered out by expiry date (not target day):', customer.name);
              return false;
            }
          }
        }
      }
      
      // PERBAIKAN UTAMA: Logika ISOLIR/SUSPEND — normalisasi nilai dan tambahkan derivasi kebijakan
      if (broadcastData.dateSuspendCriteria && broadcastData.dateSuspendCriteria !== 'all') {
        // Normalisasi nilai string (case-insensitive dan variasi istilah umum)
        const statusNorm = (customer.status || '').toString().trim().toLowerCase();
        const billingStatusNorm = (customer.billingStatus || '').toString().trim().toLowerCase();
        const mikrotikStatusNorm = (customer.mikrotikStatus || '').toString().trim().toLowerCase();
        const isolated = !!customer.isIsolated;

        // Hitung jendela due day yang dipersonalisasi
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const today = new Date(); today.setHours(0,0,0,0);

        const expireDate = customer.expireDate ? new Date(customer.expireDate) : null;
        if (expireDate) expireDate.setHours(0,0,0,0);

        const lastBillingDate = customer.lastBillingDate ? new Date(customer.lastBillingDate) : null;
        if (lastBillingDate) lastBillingDate.setHours(0,0,0,0);

        const dueDateObj = customer.paymentDueDate ? new Date(customer.paymentDueDate) : null;
        const dueDay = dueDateObj ? dueDateObj.getDate() : 5;
        const withinBillingWindow = currentDay >= 1 && currentDay <= dueDay;

        const hasPaidThisMonth = !!(lastBillingDate && lastBillingDate.getMonth() === currentMonth && lastBillingDate.getFullYear() === currentYear);
        const isPostpaid = customer.billingType === 'postpaid';
        const isPrepaid = customer.billingType === 'prepaid';

        // Prepaid flags
        const expired = expireDate ? expireDate.getTime() < today.getTime() : false;
        const expiredThisMonth = !!(expireDate && expireDate.getMonth() === currentMonth && expireDate.getFullYear() === currentYear && expired);
        const expiredPrevMonthOrOlder = !!(expireDate && expired && (expireDate.getMonth() !== currentMonth || expireDate.getFullYear() !== currentYear));

        // Deteksi Suspended berdasarkan kebijakan (tanpa bergantung ke backend flags)
        const isSuspendedByPolicy = (
          (isPostpaid && !withinBillingWindow && !hasPaidThisMonth) ||
          (isPrepaid && (expiredPrevMonthOrOlder || (expiredThisMonth && !withinBillingWindow)))
        );

        // Deteksi Suspended berdasarkan flag backend/operasional
        const suspendedByStatus = statusNorm === 'suspended' || statusNorm === 'suspend';
        const suspendedByBilling = billingStatusNorm === 'suspend';
        const mikrotikDisabled = mikrotikStatusNorm === 'disabled' || mikrotikStatusNorm === 'disable' || mikrotikStatusNorm === 'nonaktif' || mikrotikStatusNorm === 'off';

        const isSuspendedRaw = suspendedByStatus || suspendedByBilling || mikrotikDisabled || isolated;

        // Terapkan kriteria
        if (broadcastData.dateSuspendCriteria === 'suspended') {
          // Ditampilkan jika suspended oleh flag backend ATAU menurut kebijakan due-day
          const isSuspended = isSuspendedRaw || isSuspendedByPolicy;
          if (!isSuspended) {
            console.log('Filtered out by suspend criteria (not suspended):', customer.name, {
              status: customer.status,
              billingStatus: customer.billingStatus,
              mikrotikStatus: customer.mikrotikStatus,
              isIsolated: customer.isIsolated,
              isSuspendedByPolicy
            });
            return false;
          }
        } else if (broadcastData.dateSuspendCriteria === 'active') {
          // Active: bukan suspended (flag/kebijakan) dan tidak diisolir
          const notSuspended = !(isSuspendedRaw || isSuspendedByPolicy);
          if (!notSuspended || isolated) {
            console.log('Filtered out by suspend criteria (not active):', customer.name, {
              status: customer.status,
              billingStatus: customer.billingStatus,
              mikrotikStatus: customer.mikrotikStatus,
              isIsolated: customer.isIsolated,
              isSuspendedByPolicy
            });
            return false;
          }
        }
      }
      
      console.log('Customer passed all filters:', customer.name);
      return true;
    });
  };

  // Replace message placeholders
  const replaceMessagePlaceholders = (message: string, customer: Customer): string => {
    return message
      .replace(/\[NOPEL\]/g, customer.customerNumber)
      .replace(/\[NAMA\]/g, customer.name)
      .replace(/\[PAKET\]/g, customer.package)
      .replace(/\[AREA\]/g, customer.area)
      .replace(/\[PHONE\]/g, customer.phone)
      .replace(/\[ADDRESS\]/g, customer.address || '');
  };

  // Send message via WAHA API
  const sendWhatsAppMessage = async (phone: string, message: string): Promise<boolean> => {
    try {
      // Format phone number (remove +, spaces, etc.)
      const formattedPhone = phone.replace(/[^0-9]/g, '');
      const chatId = formattedPhone.startsWith('62') ? 
        `${formattedPhone}@c.us` : 
        `62${formattedPhone.startsWith('0') ? formattedPhone.substring(1) : formattedPhone}@c.us`;
      
      // Cek apakah session tersedia terlebih dahulu
      const sessionCheck = await fetch(`${config.baseUrl}/api/sessions/${config.session}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-Api-Key': config.apiKey })
        }
      });
      
      if (!sessionCheck.ok) {
        throw new Error(`Session ${config.session} tidak tersedia atau tidak aktif`);
      }
      
      const sessionData = await sessionCheck.json();
      if (sessionData.status !== 'WORKING') {
        throw new Error(`Session status: ${sessionData.status}. Session harus dalam status WORKING`);
      }
      
      // PERBAIKAN: Coba beberapa endpoint yang berbeda
      const endpoints = [
        // Endpoint v1 (paling umum)
        `${config.baseUrl}/api/sendText`,
        // Endpoint v2
        `${config.baseUrl}/api/${config.session}/sendText`,
        // Endpoint v3 (swagger style)
        `${config.baseUrl}/api/sessions/${config.session}/chats/${chatId}/messages`,
        // Endpoint v4 (alternative)
        `${config.baseUrl}/api/v1/sessions/${config.session}/chats/${chatId}/messages/text`
      ];
      
      const payloads = [
        // Payload v1
        {
          session: config.session,
          chatId: chatId,
          text: message
        },
        // Payload v2
        {
          chatId: chatId,
          text: message
        },
        // Payload v3
        {
          text: message
        },
        // Payload v4
        {
          text: message
        }
      ];
      
      // Coba setiap endpoint sampai ada yang berhasil
      for (let i = 0; i < endpoints.length; i++) {
        try {
          console.log(`Mencoba endpoint ${i + 1}: ${endpoints[i]}`);
          
          const response = await fetch(endpoints[i], {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(config.apiKey && { 'X-Api-Key': config.apiKey })
            },
            body: JSON.stringify(payloads[i])
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`Berhasil dengan endpoint ${i + 1}:`, result);
            return result.id || result.messageId || result.success ? true : false;
          } else {
            console.log(`Endpoint ${i + 1} gagal:`, response.status, response.statusText);
          }
        } catch (endpointError) {
          console.log(`Error pada endpoint ${i + 1}:`, endpointError);
        }
      }
      
      throw new Error('Semua endpoint gagal. Periksa dokumentasi WAHA API Anda.');
      
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  };

  // Fungsi untuk test koneksi WAHA
  const testWahaConnection = async () => {
    if (!formConfig.baseUrl) {
      toast({
        title: "Error",
        description: "Base URL harus diisi",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      const response = await fetch(`${formConfig.baseUrl}/api/sessions`, {
        headers: {
          'X-API-KEY': formConfig.apiKey || ''
        }
      });

      if (response.ok) {
        setConnectionStatus('success');
        toast({
          title: "Berhasil",
          description: "Koneksi WAHA berhasil!"
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Error",
          description: `Koneksi gagal: ${response.status} ${response.statusText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('WAHA connection test failed:', error);
      setConnectionStatus('error');
      toast({
        title: "Error",
        description: "Koneksi WAHA gagal",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleInputChange = (field: keyof BroadcastCriteria, value: string) => {
    setBroadcastData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!broadcastData.message.trim()) {
      toast({
        title: "Error",
        description: "Pesan tidak boleh kosong",
        variant: "destructive"
      });
      return;
    }
    
    const targetCustomers = getFilteredCustomers();
    
    if (targetCustomers.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada pelanggan yang sesuai dengan kriteria",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      let successCount = 0;
      let failedCount = 0;
      const failedCustomers: string[] = [];
      const failedRecipientDetails: { id: string | number; name: string; phone: string }[] = [];
      const queueBaseId = Date.now().toString();

      // Inisialisasi antrian: semua target jadi queued
      setSendingQueue(targetCustomers.map((c, idx) => ({
        id: `${queueBaseId}-${c.id}-${idx}`,
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        status: 'queued'
      })));

      // Inisialisasi recipientDetails untuk disimpan di riwayat
      const recipientDetails: { id: string | number; name: string; phone: string; status: 'queued' | 'sending' | 'sent' | 'failed' }[] =
        targetCustomers.map(c => ({ id: c.id, name: c.name, phone: c.phone, status: 'queued' }));

      // Tambahkan entry riwayat sebagai pending terlebih dahulu
      const historyId = `${queueBaseId}`;
      const pendingHistory: MessageHistory = {
        id: historyId,
        recipients: targetCustomers.length,
        message: broadcastData.message,
        criteria: Object.entries(broadcastData)
          .filter(([key, value]) => key !== 'message' && value && value !== 'all' && value.trim() !== '')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ') || 'Semua pelanggan',
        sentAt: new Date(),
        status: 'pending',
        failedRecipients: [],
        recipientDetails
      };
      setMessageHistory(prev => [pendingHistory, ...prev].slice(0, 200));
      
      for (let i = 0; i < targetCustomers.length; i++) {
        const customer = targetCustomers[i];
        try {
          // Update status antrian: sending
          setSendingQueue(prev => prev.map(item =>
            item.customerId === customer.id ? { ...item, status: 'sending' } : item
          ));

          recipientDetails[i].status = 'sending';

          const personalizedMessage = replaceMessagePlaceholders(broadcastData.message, customer);
          const success = await sendWhatsAppMessage(customer.phone, personalizedMessage);
          
          if (success) {
            successCount++;
            setSendingQueue(prev => prev.map(item =>
              item.customerId === customer.id ? { ...item, status: 'sent' } : item
            ));
            recipientDetails[i].status = 'sent';
          } else {
            failedCount++;
            failedCustomers.push(customer.name);
            failedRecipientDetails.push({ id: customer.id, name: customer.name, phone: customer.phone });
            setSendingQueue(prev => prev.map(item =>
              item.customerId === customer.id ? { ...item, status: 'failed', error: 'Gagal mengirim' } : item
            ));
            recipientDetails[i].status = 'failed';
          }
          
          // Delay antar pengiriman untuk menghindari rate limiting (5 detik)
          if (i < targetCustomers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, sendDelayMs));
          }
          
        } catch (error) {
          console.error(`Error sending to ${customer.name}:`, error);
          failedCount++;
          failedCustomers.push(customer.name);
          failedRecipientDetails.push({ id: customer.id, name: customer.name, phone: customer.phone });
          setSendingQueue(prev => prev.map(item =>
            item.customerId === customer.id ? { ...item, status: 'failed', error: 'Exception saat mengirim' } : item
          ));
          recipientDetails[i].status = 'failed';
        }
      }
      
      // Update riwayat: dari pending jadi sent/failed (atau sent jika sebagian berhasil)
      setMessageHistory(prev => prev
        .map(h =>
          h.id === historyId
            ? {
                ...h,
                sentAt: new Date(),
                status: failedCount === 0 ? 'sent' : failedCount === targetCustomers.length ? 'failed' : 'sent',
                failedRecipients: failedRecipientDetails,
                recipientDetails
              }
            : h
        )
        .slice(0, 200)
      );
      
      // Reset form
      setBroadcastData(prev => ({
        ...prev,
        area: '',
        billingType: '',
        package: '',
        odp: '',
        paymentStatus: '',
        dateExpiryCriteria: '',
        dateSuspendCriteria: '',
        sendToCustomer: ''
      }));
      
      setShowBroadcastForm(false);
      // Reset antrian setelah selesai
      setSendingQueue([]);
      
      if (successCount > 0) {
        toast({
          title: "Berhasil",
          description: `Berhasil mengirim ${successCount} pesan${failedCount > 0 ? `, ${failedCount} gagal` : ''}`
        });
      }
      
      if (failedCount > 0) {
        toast({
          title: "Error",
          description: `${failedCount} pesan gagal dikirim: ${failedCustomers.slice(0, 3).join(', ')}${failedCustomers.length > 3 ? '...' : ''}`,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error in broadcast:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengirim pesan",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleResendFailed = async (history: MessageHistory) => {
    if (!history.failedRecipients || history.failedRecipients.length === 0) {
      toast({ title: 'Info', description: 'Tidak ada penerima gagal untuk dikirim ulang.' });
      return;
    }

    setIsSending(true);
    try {
      let successCount = 0;
      let failedCount = 0;
      const failedAgainDetails: { id: string | number; name: string; phone: string }[] = [];
      const queueBaseId = Date.now().toString();

      // Inisialisasi antrian dari penerima gagal
      setSendingQueue(history.failedRecipients.map((c, idx) => ({
        id: `${queueBaseId}-${c.id}-${idx}`,
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        status: 'queued'
      })));

      const recipientDetails: { id: string | number; name: string; phone: string; status: 'queued' | 'sending' | 'sent' | 'failed' }[] =
        history.failedRecipients.map(c => ({ id: c.id, name: c.name, phone: c.phone, status: 'queued' }));

      // Buat riwayat pending untuk proses kirim ulang
      const historyId = `${queueBaseId}`;
      const pendingHistory: MessageHistory = {
        id: historyId,
        recipients: history.failedRecipients.length,
        message: history.message,
        criteria: `${history.criteria} (Kirim Ulang Gagal: ${history.sentAt.toLocaleString('id-ID')})`,
        sentAt: new Date(),
        status: 'pending',
        failedRecipients: [],
        recipientDetails
      };
      setMessageHistory(prev => [pendingHistory, ...prev].slice(0, 200));

      for (let i = 0; i < history.failedRecipients.length; i++) {
        const recipient = history.failedRecipients[i];
        try {
          setSendingQueue(prev => prev.map(item =>
            item.customerId === recipient.id ? { ...item, status: 'sending' } : item
          ));

          const fullCustomer = customers?.find(c => c.id === recipient.id);
          const personalizedMessage = fullCustomer
            ? replaceMessagePlaceholders(history.message, fullCustomer)
            : history.message;
          const success = await sendWhatsAppMessage(recipient.phone, personalizedMessage);
          if (success) {
            successCount++;
            setSendingQueue(prev => prev.map(item =>
              item.customerId === recipient.id ? { ...item, status: 'sent' } : item
            ));
            recipientDetails[i].status = 'sent';
          } else {
            failedCount++;
            failedAgainDetails.push(recipient);
            setSendingQueue(prev => prev.map(item =>
              item.customerId === recipient.id ? { ...item, status: 'failed', error: 'Gagal mengirim' } : item
            ));
            recipientDetails[i].status = 'failed';
          }

          if (i < history.failedRecipients.length - 1) {
            await new Promise(resolve => setTimeout(resolve, sendDelayMs));
          }
        } catch (err) {
          console.error(`Error resend to ${recipient.name}:`, err);
          failedCount++;
          failedAgainDetails.push(recipient);
          setSendingQueue(prev => prev.map(item =>
            item.customerId === recipient.id ? { ...item, status: 'failed', error: 'Exception saat mengirim' } : item
          ));
          recipientDetails[i].status = 'failed';
        }
      }

      // Update riwayat pending menjadi final
      setMessageHistory(prev => prev
        .map(h =>
          h.id === historyId
            ? {
                ...h,
                sentAt: new Date(),
                status: failedCount === 0 ? 'sent' : failedCount === history.failedRecipients!.length ? 'failed' : 'sent',
                failedRecipients: failedAgainDetails,
                recipientDetails
              }
            : h
        )
        .slice(0, 200)
      );

      if (successCount > 0) {
        toast({ title: 'Berhasil', description: `Berhasil kirim ulang ${successCount} pesan${failedCount > 0 ? `, ${failedCount} gagal` : ''}` });
      }
      if (failedCount > 0) {
        toast({ title: 'Error', description: `${failedCount} pesan gagal dikirim ulang`, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error in resend failed:', error);
      toast({ title: 'Error', description: 'Terjadi kesalahan saat kirim ulang pesan', variant: 'destructive' });
    } finally {
      setIsSending(false);
      setSendingQueue([]);
    }
  };

  const saveWahaConfig = async () => {
    try {
      console.log('Saving WAHA config:', formConfig);
      await updateConfig.mutateAsync(formConfig);
      
      // Pastikan localStorage juga terupdate
      localStorage.setItem('wahaConfig', JSON.stringify(formConfig));
      
      toast({
        title: "Berhasil",
        description: "Konfigurasi WAHA berhasil disimpan!"
      });
    } catch (error) {
      console.error('Error saving WAHA config:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan konfigurasi WAHA",
        variant: "destructive"
      });
    }
  };

  const filteredCustomers = getFilteredCustomers();

  if (wahaLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading WAHA configuration...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error loading WAHA configuration</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pesan WhatsApp</h1>
          <p className="text-gray-600">Kirim pesan broadcast ke pelanggan melalui WhatsApp</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Pengaturan WAHA
              </Button>
            </DialogTrigger>
          </Dialog>
          <Button onClick={() => setShowBroadcastForm(true)} className="bg-green-600 hover:bg-green-700">
            <Send className="h-4 w-4 mr-2" />
            Kirim Pesan
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pelanggan</p>
                <p className="text-2xl font-bold text-gray-900">{customers?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pesan Terkirim</p>
                <p className="text-2xl font-bold text-gray-900">
                  {messageHistory.filter(h => h.status === 'sent').reduce((sum, h) => sum + h.recipients, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Template Tersimpan</p>
                <p className="text-2xl font-bold text-gray-900">{messageTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Pengiriman */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Status Pengiriman</CardTitle>
        </CardHeader>
        <CardContent>
          {sendingQueue.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Tidak ada proses pengiriman saat ini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>No. WhatsApp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sendingQueue.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-xs truncate">{item.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.phone}</TableCell>
                    <TableCell>
                      {item.status === 'queued' && (
                        <Badge className="bg-blue-100 text-blue-800">Dalam Antrian</Badge>
                      )}
                      {item.status === 'sending' && (
                        <Badge className="bg-amber-100 text-amber-800">Sedang Mengirim</Badge>
                      )}
                      {item.status === 'sent' && (
                        <Badge className="bg-green-100 text-green-800">Terkirim</Badge>
                      )}
                      {item.status === 'failed' && (
                        <Badge variant="destructive">Gagal</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pesan</CardTitle>
        </CardHeader>
        <CardContent>
          {messageHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada riwayat pesan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Penerima (Nama)</TableHead>
                  <TableHead>Kriteria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gagal</TableHead>
                  <TableHead>Pesan</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messageHistory.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell>{history.sentAt.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      {history.recipientDetails && history.recipientDetails.length > 0 ? (
                        <div className="space-y-1">
                          {(() => {
                            const first = history.recipientDetails![0];
                            const sentCount = history.recipientDetails!.filter(r => r.status === 'sent').length;
                            return (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm truncate">
                                    {first.name} <span className="text-gray-500">({first.phone})</span>
                                  </span>
                                  <span className="ml-2">
                                    {first.status === 'sent' && <Badge className="bg-green-100 text-green-800">Terkirim</Badge>}
                                    {first.status === 'failed' && <Badge variant="destructive">Gagal</Badge>}
                                    {first.status === 'queued' && <Badge className="bg-blue-100 text-blue-800">Antri</Badge>}
                                    {first.status === 'sending' && <Badge className="bg-amber-100 text-amber-800">Mengirim</Badge>}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">dst. ({sentCount} terkirim)</div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Tidak ada data penerima</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{history.criteria}</TableCell>
                    <TableCell>
                      {history.status === 'pending' && (
                        <Badge className="bg-amber-100 text-amber-800">Sedang Mengirim</Badge>
                      )}
                      {history.status === 'sent' && (
                        <Badge>Terkirim</Badge>
                      )}
                      {history.status === 'failed' && (
                        <Badge variant="destructive">Gagal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {history.failedRecipients?.length ? `${history.failedRecipients.length} gagal` : '0'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{history.message}</TableCell>
                    <TableCell className="space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Lihat Seluruh Pelanggan Terkirim"
                              onClick={() => openRecipientsDialog(history)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Lihat seluruh pelanggan terkirim</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Detail Pesan"
                              onClick={() => openMessageDetail(history)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Detail pesan</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              aria-label="Kirim Ulang Gagal"
                              onClick={() => handleResendFailed(history)}
                              disabled={!history.failedRecipients || history.failedRecipients.length === 0 || history.status === 'pending'}
                            >
                              <RefreshCcw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Kirim ulang gagal</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Detail Pesan */}
      <Dialog open={messageDetailOpen} onOpenChange={(o) => (o ? setMessageDetailOpen(true) : closeMessageDetail())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Pesan</DialogTitle>
            <DialogDescription>
              Lihat isi pesan lengkap beserta kriterianya
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kriteria</Label>
              <p className="text-sm text-gray-700 mt-1 break-words">
                {messageDetailData?.criteria || '-'}
              </p>
            </div>
            <div>
              <Label>Isi Pesan</Label>
              <pre className="mt-2 p-3 bg-gray-50 border rounded text-sm whitespace-pre-wrap break-words max-h-[60vh] overflow-auto">
                {messageDetailData?.message || ''}
              </pre>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={closeMessageDetail}>Tutup</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Seluruh Penerima */}
      <Dialog open={recipientsDialogOpen} onOpenChange={(o) => (o ? setRecipientsDialogOpen(true) : closeRecipientsDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seluruh Pelanggan Penerima</DialogTitle>
            <DialogDescription>
              Daftar seluruh penerima dan status pengirimannya
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            {recipientsDialogData && recipientsDialogData.recipients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>No. WhatsApp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipientsDialogData.recipients.map((r) => (
                    <TableRow key={`${recipientsDialogData.id}-${r.id}`}>
                      <TableCell className="max-w-xs truncate">{r.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.phone}</TableCell>
                      <TableCell>
                        {r.status === 'sent' && <Badge className="bg-green-100 text-green-800">Terkirim</Badge>}
                        {r.status === 'failed' && <Badge variant="destructive">Gagal</Badge>}
                        {r.status === 'queued' && <Badge className="bg-blue-100 text-blue-800">Antri</Badge>}
                        {r.status === 'sending' && <Badge className="bg-amber-100 text-amber-800">Mengirim</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-gray-500">Tidak ada data penerima</div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={closeRecipientsDialog}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WAHA Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengaturan WAHA API</DialogTitle>
            <DialogDescription>
              Konfigurasi koneksi ke WAHA (WhatsApp HTTP API)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="baseUrl">Base URL WAHA</Label>
              <Input
                id="baseUrl"
                value={formConfig.baseUrl}
                onChange={(e) => setFormConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="http://localhost:3000"
              />
            </div>
            
            <div>
              <Label htmlFor="session">Nama Session</Label>
              <Input
                id="session"
                value={formConfig.session}
                onChange={(e) => setFormConfig(prev => ({ ...prev, session: e.target.value }))}
                placeholder="default"
              />
            </div>
            
            <div>
              <Label htmlFor="apiKey">API Key (Opsional)</Label>
              <Input
                id="apiKey"
                value={formConfig.apiKey}
                onChange={(e) => setFormConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Masukkan API key jika diperlukan"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={testWahaConnection}
                disabled={isTestingConnection}
                className="flex-1"
              >
                {isTestingConnection ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Koneksi'
                )}
              </Button>
              
              {connectionStatus !== 'idle' && (
                <div className={`px-3 py-2 rounded text-sm ${
                  connectionStatus === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connectionStatus === 'success' ? '✓ Berhasil' : '✗ Gagal'}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                Batal
              </Button>
              <Button onClick={saveWahaConfig}>
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Form Dialog */}
      <Dialog open={showBroadcastForm} onOpenChange={setShowBroadcastForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kirim Pesan Broadcast WhatsApp</DialogTitle>
            <DialogDescription>
              Pilih kriteria pelanggan dan tulis pesan yang akan dikirim melalui WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSendMessage} className="space-y-4">
            {/* Criteria Selection */}
            <div className="grid grid-cols-2 gap-4">
              
              
              
              
              
              
              
              
              <div>
                <Label htmlFor="areaFilter">WILAYAH</Label>
                <Select value={broadcastData.area || 'all'} onValueChange={(value) => handleInputChange('area', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {(areas || []).map((a) => (
                      <SelectItem key={a.id || a.name} value={a.name}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="packageFilter">PAKET</Label>
                <Select value={broadcastData.package || 'all'} onValueChange={(value) => handleInputChange('package', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Paket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {(packages || []).map((p) => (
                      <SelectItem key={p.id || p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="odpFilter">ODP</Label>
                <Select value={broadcastData.odp || 'all'} onValueChange={(value) => handleInputChange('odp', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ODP" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {(odp || []).map((o) => (
                      <SelectItem key={o.id || o.name} value={o.name}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentStatus">STATUS PEMBAYARAN</Label>
                <Select value={broadcastData.paymentStatus} onValueChange={(value) => handleInputChange('paymentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="paid">Sudah Bayar</SelectItem>
                    <SelectItem value="unpaid">Belum Bayar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dateExpiryCriteria">KRITERIA TANGGAL JATUH TEMPO</Label>
                <Select value={broadcastData.dateExpiryCriteria} onValueChange={(value) => handleInputChange('dateExpiryCriteria', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kriteria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="tomorrow">Besok</SelectItem>
                    <SelectItem value="1_day">1 Hari Lagi</SelectItem>
                    <SelectItem value="2_days">2 Hari Lagi</SelectItem>
                    <SelectItem value="3_days">3 Hari Lagi</SelectItem>
                    <SelectItem value="7_days">7 Hari Lagi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dateSuspendCriteria">KRITERIA ISOLIR/SUSPEND</Label>
                <Select value={broadcastData.dateSuspendCriteria} onValueChange={(value) => handleInputChange('dateSuspendCriteria', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kriteria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="suspended">Status Suspended</SelectItem>
                    <SelectItem value="active">Status Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Send to specific customer */}
            <div>
              <Label htmlFor="sendToCustomer">KIRIM KE PELANGGAN TERTENTU</Label>
              <div className="flex gap-2">
                <Input
                  id="sendToCustomer"
                  value={broadcastData.sendToCustomer}
                  readOnly
                  onClick={() => setShowCustomerPicker(true)}
                  placeholder="Klik untuk memilih pelanggan"
                />
                {broadcastData.sendToCustomer && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleInputChange('sendToCustomer', '')}
                  >
                    Hapus
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Klik kolom untuk membuka daftar pelanggan</p>
            </div>
            
            {/* Message with Template Management */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="message">PESAN</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplateDialog(true)}
                    className="text-xs"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Pilih Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTemplate(null);
                      setNewTemplate({ name: '', content: '', category: 'general' });
                      setShowAddTemplateDialog(true);
                    }}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Buat Template
                  </Button>
                </div>
              </div>
              <Textarea
                id="message"
                value={broadcastData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Tulis pesan Anda di sini...\n\nGunakan placeholder:\n[NAMA] - Nama pelanggan\n[NOPEL] - Nomor pelanggan\n[PAKET] - Paket internet\n[AREA] - Area pelanggan\n[PHONE] - Nomor HP\n[ADDRESS] - Alamat"
                rows={8}
                className="resize-none"
              />
            </div>
            
            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Preview Penerima:</h4>
              <p className="text-sm text-gray-600">
                {filteredCustomers.length} pelanggan akan menerima pesan ini
              </p>
              
              {/* Debug Info */}
              <div className="mt-2 text-xs text-gray-500">
                <p>Total pelanggan: {customers?.length || 0}</p>
                <p>Kriteria aktif: {Object.entries(broadcastData).filter(([key, value]) => 
                  key !== 'message' && value && value !== 'all' && value.trim() !== ''
                ).map(([key, value]) => `${key}: ${value}`).join(', ') || 'Tidak ada'}</p>
                
                {/* Informasi khusus untuk filter pelanggan tertentu */}
                {broadcastData.sendToCustomer && broadcastData.sendToCustomer.trim() !== '' && (
                  <p className="text-blue-600 font-medium">
                    🔍 Mode pencarian pelanggan tertentu: "{broadcastData.sendToCustomer}"
                    <br />
                    <span className="text-xs text-gray-500">
                      (Filter lain diabaikan saat mencari pelanggan tertentu)
                    </span>
                  </p>
                )}
              </div>
              
              {filteredCustomers.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <div className="text-xs text-gray-500 space-y-1">
                    {filteredCustomers.slice(0, 5).map((customer) => (
                      <div key={customer.id} className="flex justify-between">
                        <span>{customer.name} ({customer.customerNumber})</span>
                        <span className="text-gray-400">
                          {customer.isIsolated ? '🔒' : '✅'} 
                          {customer.status === 'suspended' ? ' 🚫' : ''}
                        </span>
                      </div>
                    ))}
                    {filteredCustomers.length > 5 && (
                      <div className="text-gray-400">... dan {filteredCustomers.length - 5} lainnya</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowBroadcastForm(false)}
                disabled={isSending}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
                disabled={isSending || filteredCustomers.length === 0}
              >
                {isSending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Kirim Pesan ({filteredCustomers.length})
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Picker Dialog */}
      <Dialog open={showCustomerPicker} onOpenChange={setShowCustomerPicker}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pilih Pelanggan</DialogTitle>
            <DialogDescription>
              Ketik untuk mencari cepat, lalu klik baris untuk memilih
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Cari nama, nomor pelanggan, nomor HP, alamat, area atau paket"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pelanggan</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>HP</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(customers || [])
                    .filter((c) => {
                      const term = customerSearch.trim().toLowerCase();
                      if (!term) return true;
                      const phoneDigits = (c.phone || '').replace(/[^0-9]/g, '');
                      const termDigits = term.replace(/[^0-9]/g, '');
                      return (
                        c.name.toLowerCase().includes(term) ||
                        c.customerNumber.toLowerCase().includes(term) ||
                        phoneDigits.includes(termDigits) ||
                        (c.address && c.address.toLowerCase().includes(term)) ||
                        (c.area && c.area.toLowerCase().includes(term)) ||
                        (c.package && c.package.toLowerCase().includes(term))
                      );
                    })
                    .map((c) => (
                      <TableRow
                        key={c.id || c.customerNumber}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          // Set ke nomor pelanggan agar pencarian tepat dan unik
                          handleInputChange('sendToCustomer', c.customerNumber);
                          setShowCustomerPicker(false);
                        }}
                      >
                        <TableCell className="font-mono text-xs">{c.customerNumber}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell>{c.package}</TableCell>
                        <TableCell>{c.area}</TableCell>
                        <TableCell>
                          {c.status === 'suspended' ? 'Suspended' : 'Active'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setShowCustomerPicker(false)}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pilih Template Pesan</DialogTitle>
            <DialogDescription>
              Pilih template pesan yang sudah tersimpan atau kelola template Anda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Template List */}
            {messageTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada template pesan</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTemplate(null);
                    setNewTemplate({ name: '', content: '', category: 'general' });
                    setShowAddTemplateDialog(true);
                  }}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Template Pertama
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {messageTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{template.name}</h3>
                            <Badge className={getCategoryBadgeColor(template.category)}>
                              {getCategoryLabel(template.category)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            Dibuat: {template.createdAt.toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editTemplate(template)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplate(template.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-3 max-h-20 overflow-y-auto">
                        {template.content}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => useTemplate(template)}
                        className="w-full"
                      >
                        Gunakan Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTemplate(null);
                  setNewTemplate({ name: '', content: '', category: 'general' });
                  setShowAddTemplateDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Template
              </Button>
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Template Dialog */}
      <Dialog open={showAddTemplateDialog} onOpenChange={setShowAddTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Tambah Template Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Ubah template pesan yang sudah ada' : 'Buat template pesan baru untuk digunakan nanti'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateName">Nama Template</Label>
              <Input
                id="templateName"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masukkan nama template"
              />
            </div>
            
            <div>
              <Label htmlFor="templateCategory">Kategori</Label>
              <Select 
                value={newTemplate.category} 
                onValueChange={(value: MessageTemplate['category']) => 
                  setNewTemplate(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Umum</SelectItem>
                  <SelectItem value="maintenance">Pemeliharaan</SelectItem>
                  <SelectItem value="payment">Pembayaran</SelectItem>
                  <SelectItem value="promotion">Promosi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="templateContent">Isi Template</Label>
              <Textarea
                id="templateContent"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Tulis isi template di sini...\n\nGunakan placeholder:\n[NAMA] - Nama pelanggan\n[NOPEL] - Nomor pelanggan\n[PAKET] - Paket internet\n[AREA] - Area pelanggan\n[PHONE] - Nomor HP\n[ADDRESS] - Alamat"
                rows={8}
                className="resize-none"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddTemplateDialog(false);
                  setEditingTemplate(null);
                  setNewTemplate({ name: '', content: '', category: 'general' });
                }}
              >
                Batal
              </Button>
              <Button onClick={saveTemplate}>
                {editingTemplate ? 'Perbarui' : 'Simpan'} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;