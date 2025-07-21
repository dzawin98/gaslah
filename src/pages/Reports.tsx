import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { api } from '@/utils/api';
import { Transaction, Package, Customer } from '@/types/isp';
import { toast } from '@/hooks/use-toast';

interface ChartDataItem {
  period: string;
  revenue: number;
  transactionCount: number;
  commission: number;
  netRevenue: number;
  month: number;
  year: number;
}

interface ReportStats {
  totalRevenue: number;
  totalTransactions: number;
  totalCommission: number;
  netRevenue: number;
  averagePerTransaction: number;
  growthPercentage: number;
}

const Reports = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');

  // Load transactions, packages, and customers
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
        console.log('All transactions:', transactionsResponse.data.length, transactionsResponse.data);
        setTransactions(transactionsResponse.data);
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data transaksi",
          variant: "destructive"
        });
      }
      
      if (packagesResponse.success) {
        console.log('Packages:', packagesResponse.data);
        setPackages(packagesResponse.data);
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data paket",
          variant: "destructive"
        });
      }
      
      if (customersResponse.success) {
        console.log('Customers:', customersResponse.data);
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
    console.log('=== COMMISSION CALCULATION ===');
    console.log('Package:', pkg);
    console.log('Amount:', amount);
    console.log('Package salesId:', pkg?.salesId);
    console.log('Package commissionValue:', pkg?.commissionValue);
    console.log('Package commissionType:', pkg?.commissionType);
    
    // Return 0 if no package or no sales commission setup
    if (!pkg?.salesId || !pkg.commissionValue || !amount) {
      console.log('Commission = 0 (missing salesId, commissionValue, or amount)');
      return 0;
    }
    
    // Convert commissionValue to number (it comes as string from database)
    const commissionValue = Number(pkg.commissionValue);
    console.log('Commission value converted to number:', commissionValue, typeof commissionValue);
    
    if (isNaN(commissionValue) || commissionValue <= 0) {
      console.log('Commission = 0 (invalid commissionValue)');
      return 0;
    }
    
    let commission = 0;
    if (pkg.commissionType === 'percentage') {
      commission = (amount * commissionValue) / 100;
      console.log(`Commission (percentage): ${amount} * ${commissionValue} / 100 = ${commission}`);
    } else {
      commission = commissionValue;
      console.log(`Commission (nominal): ${commission}`);
    }
    
    return commission;
  };

  // Filter paid transactions
  const paidTransactions = useMemo(() => {
    return transactions.filter(transaction => 
      transaction.status === 'paid'
    );
  }, [transactions]);

  // Generate available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(transaction => {
      const year = new Date(transaction.paidAt || transaction.createdAt).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Process data for charts
  const chartData = useMemo(() => {
    console.log('=== CHART DATA CALCULATION ===');
    console.log('Paid transactions:', paidTransactions.length);
    console.log('Packages:', packages.length, packages);
    console.log('Customers:', customers.length);
    
    // Debug packages with commission setup
    const packagesWithCommission = packages.filter(pkg => pkg.salesId && pkg.commissionValue);
    console.log('Packages with commission setup:', packagesWithCommission.length, packagesWithCommission);
    
    if (viewType === 'yearly') {
      // Group by year
      const yearlyData = new Map<number, { revenue: number; count: number; commission: number }>();
      
      paidTransactions.forEach(transaction => {
        const year = new Date(transaction.paidAt || transaction.createdAt).getFullYear();
        const current = yearlyData.get(year) || { revenue: 0, count: 0, commission: 0 };
        
        const amount = Number(transaction.amount) || 0;
        let commission = 0;
        
        // Calculate commission
        console.log(`\n--- Processing Transaction ${transaction.id} ---`);
        console.log('Transaction breakdown:', transaction.breakdown);
        
        if (transaction.breakdown) {
          try {
            const breakdown = JSON.parse(transaction.breakdown);
            console.log('Parsed breakdown:', breakdown);
            if (breakdown.package && breakdown.package.salesId) {
              console.log('Looking for package with salesId:', breakdown.package.salesId);
              const pkg = packages.find(p => p.salesId === breakdown.package.salesId);
              console.log('Found package from breakdown:', pkg);
              if (pkg && pkg.salesId) {
                commission = calculateCommission(pkg, amount);
              }
            } else {
              console.log('No salesId in breakdown package');
            }
          } catch (error) {
            console.error('Error parsing breakdown:', error);
          }
        } else {
          console.log('No breakdown data in transaction');
        }
        
        // Fallback: find package by customer
        if (commission === 0) {
          console.log('Commission still 0, trying customer package fallback');
          const customer = customers.find(c => c.id === transaction.customerId);
          console.log('Found customer:', customer);
          if (customer && customer.package) {
            console.log('Customer package name:', customer.package);
            const pkg = packages.find(p => p.name === customer.package);
            console.log('Found package by name:', pkg);
            if (pkg && pkg.salesId) {
              commission = calculateCommission(pkg, amount);
            } else {
              console.log('Package found but no salesId or commission setup');
            }
          } else {
            console.log('No customer found or customer has no package');
          }
        }
        
        console.log(`Transaction ${transaction.id}: amount=${amount}, commission=${commission}`);
        
        yearlyData.set(year, {
          revenue: current.revenue + amount,
          count: current.count + 1,
          commission: current.commission + commission
        });
      });
      
      const result = Array.from(yearlyData.entries())
        .map(([year, data]) => ({
          period: year.toString(),
          revenue: data.revenue,
          transactionCount: data.count,
          commission: data.commission,
          netRevenue: data.revenue - data.commission,
          month: 0,
          year
        }))
        .sort((a, b) => a.year - b.year);
        
      console.log('Yearly data result:', result);
      return result;
    } else {
      // Group by month for selected year
      const monthlyData = new Map<string, { revenue: number; count: number; commission: number }>();
      
      const filteredTransactions = paidTransactions.filter(transaction => {
        const transactionYear = new Date(transaction.paidAt || transaction.createdAt).getFullYear();
        return transactionYear.toString() === selectedYear;
      });
      
      console.log(`Filtered transactions for year ${selectedYear}:`, filteredTransactions.length);
      
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.paidAt || transaction.createdAt);
        const month = date.getMonth();
        const monthKey = month.toString();
        
        const current = monthlyData.get(monthKey) || { revenue: 0, count: 0, commission: 0 };
        
        const amount = Number(transaction.amount) || 0;
        let commission = 0;
        
        // Calculate commission
        console.log(`\n--- Processing Monthly Transaction ${transaction.id} ---`);
        console.log('Transaction breakdown:', transaction.breakdown);
        
        if (transaction.breakdown) {
          try {
            const breakdown = JSON.parse(transaction.breakdown);
            console.log('Parsed breakdown:', breakdown);
            if (breakdown.package && breakdown.package.salesId) {
              console.log('Looking for package with salesId:', breakdown.package.salesId);
              const pkg = packages.find(p => p.salesId === breakdown.package.salesId);
              console.log('Found package from breakdown:', pkg);
              if (pkg && pkg.salesId) {
                commission = calculateCommission(pkg, amount);
              }
            } else {
              console.log('No salesId in breakdown package');
            }
          } catch (error) {
            console.error('Error parsing breakdown:', error);
          }
        } else {
          console.log('No breakdown data in transaction');
        }
        
        // Fallback: find package by customer
        if (commission === 0) {
          console.log('Commission still 0, trying customer package fallback');
          const customer = customers.find(c => c.id === transaction.customerId);
          console.log('Found customer:', customer);
          if (customer && customer.package) {
            console.log('Customer package name:', customer.package);
            const pkg = packages.find(p => p.name === customer.package);
            console.log('Found package by name:', pkg);
            if (pkg && pkg.salesId) {
              commission = calculateCommission(pkg, amount);
            } else {
              console.log('Package found but no salesId or commission setup');
            }
          } else {
            console.log('No customer found or customer has no package');
          }
        }
        
        console.log(`Month ${month}: Transaction ${transaction.id}: amount=${amount}, commission=${commission}`);
        
        monthlyData.set(monthKey, {
          revenue: current.revenue + amount,
          count: current.count + 1,
          commission: current.commission + commission
        });
      });
      
      // Generate data for all 12 months
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      
      const result = monthNames.map((name, index) => {
        const data = monthlyData.get(index.toString()) || { revenue: 0, count: 0, commission: 0 };
        return {
          period: name,
          revenue: data.revenue,
          transactionCount: data.count,
          commission: data.commission,
          netRevenue: data.revenue - data.commission,
          month: index,
          year: parseInt(selectedYear)
        };
      });
      
      console.log('Monthly data result:', result);
      return result;
    }
  }, [paidTransactions, packages, customers, selectedYear, selectedMonth, viewType]);

  // Filter data by selected month if not 'all'
  const filteredChartData = useMemo(() => {
    if (selectedMonth === 'all' || viewType === 'yearly') {
      return chartData;
    }
    return chartData.filter(data => data.month === parseInt(selectedMonth));
  }, [chartData, selectedMonth, viewType]);

  // Calculate statistics with NaN protection
  const stats = useMemo((): ReportStats => {
    const currentData = filteredChartData;
    const totalRevenue = currentData.reduce((sum, item) => {
      const revenue = typeof item.revenue === 'number' && !isNaN(item.revenue) ? item.revenue : 0;
      return sum + revenue;
    }, 0);
    const totalTransactions = currentData.reduce((sum, item) => sum + item.transactionCount, 0);
    const totalCommission = currentData.reduce((sum, item) => {
      const commission = typeof item.commission === 'number' && !isNaN(item.commission) ? item.commission : 0;
      return sum + commission;
    }, 0);
    const netRevenue = totalRevenue - totalCommission;
    const averagePerTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate growth percentage (compare with previous period)
    let growthPercentage = 0;
    if (viewType === 'yearly' && currentData.length > 1) {
      const currentYear = currentData[currentData.length - 1];
      const previousYear = currentData[currentData.length - 2];
      if (previousYear && previousYear.revenue > 0) {
        growthPercentage = ((currentYear.revenue - previousYear.revenue) / previousYear.revenue) * 100;
      }
    } else if (viewType === 'monthly' && selectedMonth !== 'all') {
      const currentMonth = currentData[0];
      const allMonthsData = chartData;
      const currentMonthIndex = parseInt(selectedMonth);
      const previousMonthIndex = currentMonthIndex > 0 ? currentMonthIndex - 1 : 11;
      const previousMonth = allMonthsData.find(d => d.month === previousMonthIndex);
      
      if (currentMonth && previousMonth && previousMonth.revenue > 0) {
        growthPercentage = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
      }
    }

    return {
      totalRevenue,
      totalTransactions,
      totalCommission,
      netRevenue,
      averagePerTransaction,
      growthPercentage
    };
  }, [filteredChartData, chartData, viewType, selectedMonth]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Memuat data laporan...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Laporan Keuangan</h1>
        <div className="flex items-center space-x-4">
          <Button
            variant={viewType === 'monthly' ? 'default' : 'outline'}
            onClick={() => setViewType('monthly')}
          >
            Bulanan
          </Button>
          <Button
            variant={viewType === 'yearly' ? 'default' : 'outline'}
            onClick={() => setViewType('yearly')}
          >
            Tahunan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year">Tahun</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {viewType === 'monthly' && (
              <div>
                <Label htmlFor="month">Bulan</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bulan</SelectItem>
                    <SelectItem value="0">Januari</SelectItem>
                    <SelectItem value="1">Februari</SelectItem>
                    <SelectItem value="2">Maret</SelectItem>
                    <SelectItem value="3">April</SelectItem>
                    <SelectItem value="4">Mei</SelectItem>
                    <SelectItem value="5">Juni</SelectItem>
                    <SelectItem value="6">Juli</SelectItem>
                    <SelectItem value="7">Agustus</SelectItem>
                    <SelectItem value="8">September</SelectItem>
                    <SelectItem value="9">Oktober</SelectItem>
                    <SelectItem value="10">November</SelectItem>
                    <SelectItem value="11">Desember</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pendapatan</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Komisi Sales</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.totalCommission)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendapatan Bersih</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.netRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transaksi</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalTransactions.toLocaleString('id-ID')}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rata-rata per Transaksi</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stats.averagePerTransaction)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Grafik Pendapatan (Bar Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Pendapatan']}
                    labelFormatter={(label) => `Periode: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Pendapatan (Line Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Pendapatan']}
                    labelFormatter={(label) => `Periode: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Periode</th>
                  <th className="text-right p-2 font-medium">Total Pendapatan</th>
                  <th className="text-right p-2 font-medium">Komisi Sales</th>
                  <th className="text-right p-2 font-medium">Pendapatan Bersih</th>
                  <th className="text-right p-2 font-medium">Jumlah Transaksi</th>
                  <th className="text-right p-2 font-medium">Rata-rata per Transaksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredChartData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2">{item.period}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(item.revenue)}</td>
                    <td className="p-2 text-right text-orange-600">{formatCurrency(item.commission)}</td>
                    <td className="p-2 text-right text-blue-600 font-medium">{formatCurrency(item.netRevenue)}</td>
                    <td className="p-2 text-right">{item.transactionCount.toLocaleString('id-ID')}</td>
                    <td className="p-2 text-right">
                      {item.transactionCount > 0 ? formatCurrency(item.revenue / item.transactionCount) : '-'}
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

export default Reports;