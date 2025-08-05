import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';
import { api } from '@/utils/api';
import { Transaction, Package, Customer } from '@/types/isp';
import { toast } from '@/hooks/use-toast';

interface SalesCommissionData {
  salesId: string;
  salesName: string;
  totalCommission: number;
  transactionCount: number;
  averageCommission: number;
  monthlyData: { month: string; commission: number; count: number }[];
}

interface ChartDataItem {
  period: string;
  [key: string]: string | number; // Dynamic keys for different sales
}

interface CommissionStats {
  totalCommission: number;
  totalTransactions: number;
  averageCommissionPerTransaction: number;
  topSales: string;
  activeSalesCount: number;
}

const CommissionReports = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedSales, setSelectedSales] = useState<string>('all');
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsResponse, packagesResponse, customersResponse] = await Promise.all([
        api.getTransactions(),
        api.getPackages(),
        api.getCustomers()
      ]);
      
      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data);
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data transaksi",
          variant: "destructive"
        });
      }
      
      if (packagesResponse.success) {
        setPackages(packagesResponse.data);
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data paket",
          variant: "destructive"
        });
      }
      
      if (customersResponse.success) {
        setCustomers(customersResponse.data);
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data customer",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate commission for a package and amount
  const calculateCommission = (pkg: Package, amount: number): number => {
    if (!pkg?.salesId || !pkg.commissionValue || !amount) {
      return 0;
    }
    
    const commissionValue = Number(pkg.commissionValue);
    
    if (isNaN(commissionValue) || commissionValue <= 0) {
      return 0;
    }
    
    let commission = 0;
    if (pkg.commissionType === 'percentage') {
      commission = (amount * commissionValue) / 100;
    } else {
      commission = commissionValue;
    }
    
    return commission;
  };

  // Filter paid transactions
  const paidTransactions = useMemo(() => {
    return transactions.filter(transaction => 
      transaction.status === 'paid'
    );
  }, [transactions]);

  // Get unique sales from packages
  const salesList = useMemo(() => {
    const salesMap = new Map<string, string>();
    packages.forEach(pkg => {
      if (pkg.salesId && pkg.sales?.name) {
        salesMap.set(pkg.salesId.toString(), pkg.sales.name);
      }
    });
    return Array.from(salesMap.entries()).map(([id, name]) => ({ id, name }));
  }, [packages]);

  // Generate available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(transaction => {
      const year = new Date(transaction.paidAt || transaction.createdAt).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Process commission data by sales
  const salesCommissionData = useMemo(() => {
    const salesData = new Map<string, SalesCommissionData>();
    
    // Initialize sales data
    salesList.forEach(sales => {
      salesData.set(sales.id, {
        salesId: sales.id,
        salesName: sales.name,
        totalCommission: 0,
        transactionCount: 0,
        averageCommission: 0,
        monthlyData: []
      });
    });

    // Filter transactions by year
    const filteredTransactions = paidTransactions.filter(transaction => {
      const transactionYear = new Date(transaction.paidAt || transaction.createdAt).getFullYear();
      return transactionYear.toString() === selectedYear;
    });

    // Process each transaction
    filteredTransactions.forEach(transaction => {
      const amount = Number(transaction.amount) || 0;
      let commission = 0;
      let salesId = '';
      
      // Try to get sales from transaction breakdown
      if (transaction.breakdown) {
        try {
          const breakdown = JSON.parse(transaction.breakdown);
          if (breakdown.package && breakdown.package.salesId) {
            const pkg = packages.find(p => p.salesId?.toString() === breakdown.package.salesId.toString());
            if (pkg && pkg.salesId) {
              commission = calculateCommission(pkg, amount);
              salesId = pkg.salesId.toString();
            }
          }
        } catch (error) {
          console.error('Error parsing breakdown:', error);
        }
      }
      
      // Fallback: find package by customer
      if (commission === 0) {
        const customer = customers.find(c => c.id === transaction.customerId);
        if (customer && customer.package) {
          const pkg = packages.find(p => p.name === customer.package);
          if (pkg && pkg.salesId) {
            commission = calculateCommission(pkg, amount);
            salesId = pkg.salesId.toString();
          }
        }
      }
      
      // Add to sales data if commission found
      if (commission > 0 && salesId && salesData.has(salesId)) {
        const current = salesData.get(salesId)!;
        current.totalCommission += commission;
        current.transactionCount += 1;
        
        // Add to monthly data
        const month = new Date(transaction.paidAt || transaction.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        const existingMonth = current.monthlyData.find(m => m.month === month);
        if (existingMonth) {
          existingMonth.commission += commission;
          existingMonth.count += 1;
        } else {
          current.monthlyData.push({ month, commission, count: 1 });
        }
      }
    });

    // Calculate averages
    salesData.forEach(data => {
      if (data.transactionCount > 0) {
        data.averageCommission = data.totalCommission / data.transactionCount;
      }
      // Sort monthly data
      data.monthlyData.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    });

    return Array.from(salesData.values()).filter(data => data.totalCommission > 0);
  }, [paidTransactions, packages, customers, selectedYear, salesList]);

  // Chart data for visualization
  const chartData = useMemo(() => {
    if (viewType === 'yearly') {
      // Group by year
      const yearlyData = new Map<number, { [key: string]: number }>();
      
      availableYears.forEach(year => {
        const yearData: { [key: string]: number } = { period: year };
        salesList.forEach(sales => {
          yearData[sales.name] = 0;
        });
        yearlyData.set(year, yearData);
      });
      
      paidTransactions.forEach(transaction => {
        const year = new Date(transaction.paidAt || transaction.createdAt).getFullYear();
        const amount = Number(transaction.amount) || 0;
        let commission = 0;
        let salesName = '';
        
        // Calculate commission and get sales name
        if (transaction.breakdown) {
          try {
            const breakdown = JSON.parse(transaction.breakdown);
            if (breakdown.package && breakdown.package.salesId) {
              const pkg = packages.find(p => p.salesId?.toString() === breakdown.package.salesId.toString());
              if (pkg && pkg.salesId) {
                commission = calculateCommission(pkg, amount);
                salesName = pkg.sales?.name || '';
              }
            }
          } catch (error) {
            console.error('Error parsing breakdown:', error);
          }
        }
        
        if (commission === 0) {
          const customer = customers.find(c => c.id === transaction.customerId);
          if (customer && customer.package) {
            const pkg = packages.find(p => p.name === customer.package);
            if (pkg && pkg.salesId) {
              commission = calculateCommission(pkg, amount);
              salesName = pkg.sales?.name || '';
            }
          }
        }
        
        if (commission > 0 && salesName && yearlyData.has(year)) {
          const yearData = yearlyData.get(year)!;
          yearData[salesName] = (yearData[salesName] || 0) + commission;
        }
      });
      
      return Array.from(yearlyData.values()).sort((a, b) => a.period - b.period);
    } else {
      // Monthly data for selected year
      const monthlyData = new Map<string, { [key: string]: string | number }>();
      
      // Initialize 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date(Number(selectedYear), i, 1);
        const monthKey = date.toLocaleDateString('id-ID', { month: 'short' });
        const monthData: { [key: string]: string | number } = { period: monthKey };
        salesList.forEach(sales => {
          monthData[sales.name] = 0;
        });
        monthlyData.set(monthKey, monthData);
      }
      
      const filteredTransactions = paidTransactions.filter(transaction => {
        const transactionYear = new Date(transaction.paidAt || transaction.createdAt).getFullYear();
        return transactionYear.toString() === selectedYear;
      });
      
      filteredTransactions.forEach(transaction => {
        const month = new Date(transaction.paidAt || transaction.createdAt).toLocaleDateString('id-ID', { month: 'short' });
        const amount = Number(transaction.amount) || 0;
        let commission = 0;
        let salesName = '';
        
        // Calculate commission and get sales name
        if (transaction.breakdown) {
          try {
            const breakdown = JSON.parse(transaction.breakdown);
            if (breakdown.package && breakdown.package.salesId) {
              const pkg = packages.find(p => p.salesId?.toString() === breakdown.package.salesId.toString());
              if (pkg && pkg.salesId) {
                commission = calculateCommission(pkg, amount);
                salesName = pkg.sales?.name || '';
              }
            }
          } catch (error) {
            console.error('Error parsing breakdown:', error);
          }
        }
        
        if (commission === 0) {
          const customer = customers.find(c => c.id === transaction.customerId);
          if (customer && customer.package) {
            const pkg = packages.find(p => p.name === customer.package);
            if (pkg && pkg.salesId) {
              commission = calculateCommission(pkg, amount);
              salesName = pkg.sales?.name || '';
            }
          }
        }
        
        if (commission > 0 && salesName && monthlyData.has(month)) {
          const monthData = monthlyData.get(month)!;
          monthData[salesName] = (Number(monthData[salesName]) || 0) + commission;
        }
      });
      
      return Array.from(monthlyData.values());
    }
  }, [paidTransactions, packages, customers, selectedYear, viewType, salesList, availableYears]);

  // Calculate statistics
  const stats = useMemo((): CommissionStats => {
    const filteredData = selectedSales === 'all' 
      ? salesCommissionData 
      : salesCommissionData.filter(data => data.salesId === selectedSales);
    
    const totalCommission = filteredData.reduce((sum, data) => sum + data.totalCommission, 0);
    const totalTransactions = filteredData.reduce((sum, data) => sum + data.transactionCount, 0);
    const averageCommissionPerTransaction = totalTransactions > 0 ? totalCommission / totalTransactions : 0;
    
    const topSalesData = salesCommissionData.reduce((max, current) => 
      current.totalCommission > max.totalCommission ? current : max, 
      { totalCommission: 0, salesName: '-' }
    );
    
    return {
      totalCommission,
      totalTransactions,
      averageCommissionPerTransaction,
      topSales: topSalesData.salesName,
      activeSalesCount: salesCommissionData.length
    };
  }, [salesCommissionData, selectedSales]);

  // Colors for charts
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ff0000'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Laporan Komisi Sales</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="viewType">Tampilan</Label>
              <Select value={viewType} onValueChange={(value: 'monthly' | 'yearly') => setViewType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {viewType === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="year">Tahun</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="sales">Sales</Label>
              <Select value={selectedSales} onValueChange={setSelectedSales}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Sales</SelectItem>
                  {salesList.map(sales => (
                    <SelectItem key={sales.id} value={sales.id}>{sales.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={loadData} className="w-full">
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Komisi</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.totalCommission.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata per Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.averageCommissionPerTransaction.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Sales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topSales}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSalesCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Komisi Sales {viewType === 'monthly' ? 'Bulanan' : 'Tahunan'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                <Tooltip 
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Komisi']}
                  labelFormatter={(label) => `Periode: ${label}`}
                />
                {salesList.map((sales, index) => (
                  <Bar 
                    key={sales.id} 
                    dataKey={sales.name} 
                    fill={colors[index % colors.length]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Komisi per Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesCommissionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ salesName, percent }) => `${salesName} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalCommission"
                >
                  {salesCommissionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Total Komisi']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sales Commission Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Komisi Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Sales</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total Komisi</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Jumlah Transaksi</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Rata-rata Komisi</th>
                </tr>
              </thead>
              <tbody>
                {salesCommissionData
                  .filter(data => selectedSales === 'all' || data.salesId === selectedSales)
                  .sort((a, b) => b.totalCommission - a.totalCommission)
                  .map((data) => (
                    <tr key={data.salesId} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">{data.salesName}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        Rp {data.totalCommission.toLocaleString('id-ID')}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{data.transactionCount}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        Rp {data.averageCommission.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionReports;