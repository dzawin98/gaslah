import axios from 'axios';
import { RouterDevice, Area, ODP, Package, Customer, Transaction, MikrotikProfile, Sales, PPPSecret } from '@/types/isp';

// Temporary voucher types until they are properly defined in types/isp.ts
interface VoucherProfile {
  id: string;
  name: string;
  bandwidth: string;
  duration: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

interface VoucherGenerateRequest {
  profileId: string;
  quantity: number;
  prefix?: string;
}

interface Voucher {
  id: string;
  code: string;
  profileId: string;
  batchId: string;
  status: 'active' | 'used' | 'expired';
  createdAt: string;
  usedAt?: string;
}

interface VoucherBatch {
  id: string;
  profileId: string;
  quantity: number;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPackages: number;
  totalRouters: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.latansa.my.id/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication removed - no token interceptor needed

// Router API functions
const getRouters = async (): Promise<ApiResponse<RouterDevice[]>> => {
  try {
    const response = await apiClient.get('/routers');
    return response.data;
  } catch (error) {
    console.error('Error fetching routers:', error);
    throw error;
  }
};

const createRouter = async (routerData: Omit<RouterDevice, 'id'>): Promise<ApiResponse<RouterDevice>> => {
  try {
    const response = await apiClient.post('/routers', routerData);
    return response.data;
  } catch (error) {
    console.error('Error creating router:', error);
    throw error;
  }
};

const updateRouter = async (id: string, routerData: Partial<RouterDevice>): Promise<ApiResponse<RouterDevice>> => {
  try {
    const response = await apiClient.put(`/routers/${id}`, routerData);
    return response.data;
  } catch (error) {
    console.error('Error updating router:', error);
    throw error;
  }
};

const deleteRouter = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete(`/routers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting router:', error);
    throw error;
  }
};

const testRouterConnection = async (id: string): Promise<ApiResponse<{ status: string; message: string }>> => {
  try {
    const response = await apiClient.post(`/routers/${id}/test-connection`);
    return response.data;
  } catch (error) {
    console.error('Error testing router connection:', error);
    throw error;
  }
};

// Area API functions
const getAreas = async (): Promise<ApiResponse<Area[]>> => {
  try {
    const response = await apiClient.get('/areas');
    return response.data;
  } catch (error) {
    console.error('Error fetching areas:', error);
    throw error;
  }
};

const createArea = async (areaData: Omit<Area, 'id'>): Promise<ApiResponse<Area>> => {
  try {
    const response = await apiClient.post('/areas', areaData);
    return response.data;
  } catch (error) {
    console.error('Error creating area:', error);
    throw error;
  }
};

const updateArea = async (id: string, areaData: Partial<Area>): Promise<ApiResponse<Area>> => {
  try {
    const response = await apiClient.put(`/areas/${id}`, areaData);
    return response.data;
  } catch (error) {
    console.error('Error updating area:', error);
    throw error;
  }
};

const deleteArea = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete(`/areas/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting area:', error);
    throw error;
  }
};

// ODP API functions
const getODPs = async (): Promise<ApiResponse<ODP[]>> => {
  try {
    const response = await apiClient.get('/odps');
    return response.data;
  } catch (error) {
    console.error('Error fetching ODPs:', error);
    throw error;
  }
};

const createODP = async (odpData: Omit<ODP, 'id'>): Promise<ApiResponse<ODP>> => {
  try {
    const response = await apiClient.post('/odps', odpData);
    return response.data;
  } catch (error) {
    console.error('Error creating ODP:', error);
    throw error;
  }
};

const updateODP = async (id: string, odpData: Partial<ODP>): Promise<ApiResponse<ODP>> => {
  try {
    const response = await apiClient.put(`/odps/${id}`, odpData);
    return response.data;
  } catch (error) {
    console.error('Error updating ODP:', error);
    throw error;
  }
};

const deleteODP = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete(`/odps/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting ODP:', error);
    throw error;
  }
};

// Package API functions
const getPackages = async (): Promise<ApiResponse<Package[]>> => {
  try {
    const response = await apiClient.get('/packages');
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

const createPackage = async (packageData: Omit<Package, 'id'>): Promise<ApiResponse<Package>> => {
  try {
    const response = await apiClient.post('/packages', packageData);
    return response.data;
  } catch (error) {
    console.error('Error creating package:', error);
    throw error;
  }
};

const updatePackage = async (id: string, packageData: Partial<Package>): Promise<ApiResponse<Package>> => {
  try {
    const response = await apiClient.put(`/packages/${id}`, packageData);
    return response.data;
  } catch (error) {
    console.error('Error updating package:', error);
    throw error;
  }
};

const deletePackage = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete(`/packages/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting package:', error);
    throw error;
  }
};

// Customer API functions
const getCustomers = async (): Promise<ApiResponse<Customer[]>> => {
  try {
    const response = await apiClient.get('/customers');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

const createCustomer = async (customerData: Omit<Customer, 'id'>): Promise<ApiResponse<Customer>> => {
  try {
    // Defensive sanitize: do not send empty string for odpId
    if (typeof (customerData as any).odpId === 'string') {
      const trimmed = ((customerData as any).odpId || '').trim();
      if (trimmed.length === 0) {
        delete (customerData as any).odpId;
        console.log('🔍 API - Removed empty odpId from payload');
      } else {
        const parsed = parseInt(trimmed, 10);
        if (!isNaN(parsed)) {
          (customerData as any).odpId = parsed;
          console.log('🔍 API - Normalized odpId to number:', parsed);
        } else {
          delete (customerData as any).odpId;
          console.log('🔍 API - Invalid odpId string, removed from payload');
        }
      }
    }
    console.log('🔍 API - Sending customerData to backend:', JSON.stringify(customerData, null, 2));
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  } catch (error: any) {
    const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
    if (backendMessage) {
      console.error('Error creating customer:', backendMessage, error?.response?.data);
      throw new Error(backendMessage);
    }
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
};

const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> => {
  try {
    // Normalize odpId if it comes as string to avoid backend mismatch
    if (typeof (customerData as any).odpId === 'string') {
      const trimmed = ((customerData as any).odpId || '').trim();
      if (trimmed.length === 0) {
        delete (customerData as any).odpId;
        console.log('🔍 API - Removed empty odpId from update payload');
      } else {
        const parsed = parseInt(trimmed, 10);
        if (!isNaN(parsed)) {
          (customerData as any).odpId = parsed;
          console.log('🔍 API - Normalized odpId to number (update):', parsed);
        } else {
          delete (customerData as any).odpId;
          console.log('🔍 API - Invalid odpId string in update, removed from payload');
        }
      }
    }

    const response = await apiClient.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

const deleteCustomer = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Transaction API functions
const getTransactions = async (): Promise<ApiResponse<Transaction[]>> => {
  try {
    const response = await apiClient.get('/transactions');
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Transaction>> => {
  try {
    const response = await apiClient.post('/transactions', transactionData);
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

const updateTransaction = async (id: string, transactionData: Partial<Transaction>): Promise<ApiResponse<Transaction>> => {
  try {
    const response = await apiClient.put(`/transactions/${id}`, transactionData);
    return response.data;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

const deleteTransaction = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// MikroTik API functions
const getPPPSecrets = async (routerId: string): Promise<ApiResponse<PPPSecret[]>> => {
  try {
    const response = await apiClient.get(`/routers/${routerId}/ppp-secrets`);
    return response.data;
  } catch (error) {
    console.error('Error fetching PPP secrets:', error);
    throw error;
  }
};

const getRouterPPPProfiles = async (routerId: string): Promise<ApiResponse<MikrotikProfile[]>> => {
  try {
    const response = await apiClient.get(`/mikrotik/${routerId}/ppp/profiles`);
    return response.data;
  } catch (error) {
    console.error('Error fetching PPP profiles:', error);
    throw error;
  }
};

const createPPPSecret = async (
  routerId: string,
  data: { name: string; password: string; profile?: string; service?: string; comment?: string }
): Promise<ApiResponse<{ name: string; profile?: string; service: string }>> => {
  try {
    const response = await apiClient.post(`/routers/${routerId}/ppp-secrets`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating PPP secret:', error);
    throw error;
  }
};

// PPP User Control API functions
const disablePPPUser = async (customerId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  try {
    const response = await apiClient.post(`/mikrotik/ppp/disable/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Error disabling PPP user:', error);
    throw error;
  }
};

const enablePPPUser = async (customerId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  try {
    const response = await apiClient.post(`/mikrotik/ppp/enable/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Error enabling PPP user:', error);
    throw error;
  }
};

const checkPPPUserStatus = async (customerId: string): Promise<ApiResponse<{ status: string; active: boolean }>> => {
  try {
    const response = await apiClient.get(`/mikrotik/ppp/status/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking PPP user status:', error);
    throw error;
  }
};

// Billing API functions
const triggerAutoSuspend = async (): Promise<ApiResponse<{ processed: number; suspended: number }>> => {
  try {
    const response = await apiClient.post('/billing/auto-suspend');
    return response.data;
  } catch (error) {
    console.error('Error triggering auto suspend:', error);
    throw error;
  }
};

const generateMonthlyBills = async (): Promise<ApiResponse<{ generated: number; total: number }>> => {
  try {
    const response = await apiClient.post('/billing/generate-monthly');
    return response.data;
  } catch (error) {
    console.error('Error generating monthly bills:', error);
    throw error;
  }
};

const suspendOverdueCustomers = async (): Promise<ApiResponse<{ suspended: number; total: number }>> => {
  try {
    const response = await apiClient.post('/billing/suspend-overdue');
    return response.data;
  } catch (error) {
    console.error('Error suspending overdue customers:', error);
    throw error;
  }
};

const testSuspendCustomer = async (customerId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  try {
    const response = await apiClient.post(`/billing/test-suspend/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Error testing customer suspension:', error);
    throw error;
  }
};

const testEnableCustomer = async (customerId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  try {
    const response = await apiClient.post(`/billing/test-enable/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Error testing customer enable:', error);
    throw error;
  }
};

const testSuspendCustomerByName = async (username: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  try {
    const response = await apiClient.post(`/billing/test-suspend-by-name/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error testing customer suspension by name:', error);
    throw error;
  }
};

const testEnableCustomerByName = async (username: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  try {
    const response = await apiClient.post(`/billing/test-enable-by-name/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error testing customer enable by name:', error);
    throw error;
  }
};

// Remove the first getVouchers function (around line 423) and keep only the one in the voucher section

// Dashboard API functions
const getDashboardStats = async (month?: string): Promise<ApiResponse<DashboardStats>> => {
  try {
    const url = month ? `/dashboard/stats?month=${month}` : '/dashboard/stats';
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Sales API functions
const getSales = async (): Promise<ApiResponse<Sales[]>> => {
  try {
    const response = await apiClient.get('/sales');
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

const createSales = async (salesData: { name: string; phone?: string; email?: string }): Promise<ApiResponse<Sales>> => {
  try {
    const response = await apiClient.post('/sales', salesData);
    return response.data;
  } catch (error) {
    console.error('Error creating sales:', error);
    throw error;
  }
};

const updateSales = async (id: string, salesData: Partial<Sales>): Promise<ApiResponse<Sales>> => {
  try {
    const response = await apiClient.put(`/sales/${id}`, salesData);
    return response.data;
  } catch (error) {
    console.error('Error updating sales:', error);
    throw error;
  }
};

const deleteSales = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete(`/sales/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting sales:', error);
    throw error;
  }
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes('/settings/waha')) {
      const wahaData = response.data?.data || response.data;
      localStorage.setItem('wahaConfig', JSON.stringify(wahaData));
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Voucher API functions
const getVoucherProfiles = async (): Promise<ApiResponse<VoucherProfile[]>> => {
  try {
    const response = await apiClient.get('/vouchers/profiles');
    return response.data;
  } catch (error) {
    console.error('Error fetching voucher profiles:', error);
    throw error;
  }
};

const createVoucherProfile = async (profileData: Omit<VoucherProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<VoucherProfile>> => {
  try {
    const response = await apiClient.post('/vouchers/profiles', profileData);
    return response.data;
  } catch (error) {
    console.error('Error creating voucher profile:', error);
    throw error;
  }
};

const updateVoucherProfile = async (id: string, profileData: Partial<VoucherProfile>): Promise<ApiResponse<VoucherProfile>> => {
  try {
    const response = await apiClient.put(`/vouchers/profiles/${id}`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating voucher profile:', error);
    throw error;
  }
};

const deleteVoucherProfile = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete(`/vouchers/profiles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting voucher profile:', error);
    throw error;
  }
};

const generateVouchers = async (generateData: VoucherGenerateRequest): Promise<ApiResponse<{ batchId: string; vouchers: Voucher[] }>> => {
  try {
    const response = await apiClient.post('/vouchers/generate', generateData);
    return response.data;
  } catch (error) {
    console.error('Error generating vouchers:', error);
    throw error;
  }
};

// Keep only this getVouchers function (remove the duplicate one)
const getVouchers = async (params?: { 
  batchId?: string; 
  profileId?: string; 
  status?: string; 
  page?: number; 
  limit?: number; 
}): Promise<ApiResponse<{ vouchers: Voucher[]; pagination: { total: number; totalPages: number; page: number; limit: number } }>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/vouchers?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    throw error;
  }
};

const getVoucherBatches = async (): Promise<ApiResponse<VoucherBatch[]>> => {
  try {
    const response = await apiClient.get('/vouchers/batches');
    return response.data;
  } catch (error) {
    console.error('Error fetching voucher batches:', error);
    throw error;
  }
};

const deleteVoucherBatch = async (batchId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete(`/vouchers/batches/${batchId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting voucher batch:', error);
    throw error;
  }
};

// Main API object
export const api = {
  // HTTP Methods
  get: async (url: string) => {
    const response = await apiClient.get(url);
    return response.data?.data || response.data;
  },
  
  post: async (url: string, data?: unknown) => {
    const response = await apiClient.post(url, data);
    return response.data?.data || response.data;
  },
  
  put: async (url: string, data?: unknown) => {
    const response = await apiClient.put(url, data);
    return response.data?.data || response.data;
  },
  
  delete: async (url: string) => {
    const response = await apiClient.delete(url);
    return response.data?.data || response.data;
  },

  // Auth
  logout: async () => {
    try {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
      if (backendMessage) {
        console.error('Error logout:', backendMessage);
      }
      return { success: false, message: 'Logout gagal' };
    }
  },

  // Router
  getRouters,
  createRouter,
  updateRouter,
  deleteRouter,
  testRouterConnection,
  
  // Area
  getAreas,
  createArea,
  updateArea,
  deleteArea,
  
  // ODP
  getODPs,
  createODP,
  updateODP,
  deleteODP,
  
  // Package
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  
  // Customer
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  
  // Transaction
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  
  // MikroTik
  getPPPSecrets,
  getRouterPPPProfiles,
  createPPPSecret,
  disablePPPUser,
  enablePPPUser,
  checkPPPUserStatus,
  
  // Billing
  triggerAutoSuspend,
  generateMonthlyBills,
  suspendOverdueCustomers,
  testSuspendCustomer,
  testEnableCustomer,
  testSuspendCustomerByName,
  testEnableCustomerByName,
  
  // Dashboard
  getDashboardStats,
  
  // Sales
  getSales,
  createSales,
  updateSales,
  deleteSales,
  
  // Voucher
  getVoucherProfiles,
  createVoucherProfile,
  updateVoucherProfile,
  deleteVoucherProfile,
  generateVouchers,
  getVouchers,
  getVoucherBatches,
  deleteVoucherBatch
};

export default api;
