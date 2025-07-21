import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ArrowLeft } from 'lucide-react';
import { api } from '@/utils/api';
import { RouterDevice, Sales, Package, MikrotikProfile } from '@/types/isp';
import { useRouters } from '@/hooks/useRouters';
import { useToast } from '@/hooks/use-toast';

interface PackageFormProps {
  pkg?: Package;
  isEdit?: boolean;
  onClose: () => void;
  onSubmit?: (packageData: any) => Promise<void>;
}

interface FormData {
  name: string;
  description: string;
  downloadSpeed: number;
  uploadSpeed: number;
  price: number;
  routerName: string;
  mikrotikProfile: string;
  salesId: string;
  commissionType: 'percentage' | 'nominal';
  commissionValue: number;
  isActive: boolean;
}

export const PackageForm: React.FC<PackageFormProps> = ({ pkg, isEdit = false, onClose, onSubmit }) => {
  const { toast } = useToast();
  const { routers, loading: routersLoading } = useRouters();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    downloadSpeed: 0,
    uploadSpeed: 0,
    price: 0,
    routerName: '',
    mikrotikProfile: '',
    salesId: '',
    commissionType: 'percentage',
    commissionValue: 0,
    isActive: true
  });
  
  const [salesList, setSalesList] = useState<Sales[]>([]);
  const [newSalesName, setNewSalesName] = useState('');
  const [showAddSales, setShowAddSales] = useState(false);
  const [pppProfiles, setPppProfiles] = useState<MikrotikProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Load sales data
  useEffect(() => {
    const loadSales = async () => {
      try {
        const response = await api.getSales();
        if (response.success && response.data) {
          setSalesList(response.data);
        }
      } catch (error) {
        console.error('Error loading sales:', error);
      }
    };
    loadSales();
  }, []);

  // Load package data when editing
  useEffect(() => {
    if (isEdit && pkg) {
      setFormData({
        name: pkg.name || '',
        description: pkg.description || '',
        downloadSpeed: pkg.bandwidth?.download || 0,
        uploadSpeed: pkg.bandwidth?.upload || 0,
        price: pkg.price || 0,
        routerName: pkg.routerName || '',
        mikrotikProfile: pkg.mikrotikProfile || '',
        salesId: pkg.salesId?.toString() || '',
        commissionType: pkg.commissionType || 'percentage',
        commissionValue: pkg.commissionValue || 0,
        isActive: pkg.isActive !== undefined ? pkg.isActive : true
      });
      
      // Load PPP profiles if router is already selected
      if (pkg.routerName) {
        const selectedRouter = routers.find(r => r.name === pkg.routerName);
        if (selectedRouter) {
          loadPPPProfiles(selectedRouter.id.toString());
        }
      }
    }
  }, [isEdit, pkg, routers]);

  const loadPPPProfiles = async (routerId: string) => {
    try {
      setLoadingProfiles(true);
      const response = await api.getRouterPPPProfiles(routerId);
      
      if (response.success && response.data) {
        setPppProfiles(response.data);
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat profile PPP",
          variant: "destructive"
        });
        setPppProfiles([]);
      }
    } catch (error) {
      console.error('Error loading PPP profiles:', error);
      toast({
        title: "Error",
        description: "Gagal memuat profile PPP",
        variant: "destructive"
      });
      setPppProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRouterChange = (routerName: string) => {
    handleInputChange('routerName', routerName);
    handleInputChange('mikrotikProfile', '');
    
    const selectedRouter = routers.find(r => r.name === routerName);
    if (selectedRouter) {
      loadPPPProfiles(selectedRouter.id.toString());
    } else {
      setPppProfiles([]);
    }
  };

  const handleAddSales = async () => {
    if (!newSalesName.trim()) {
      toast({
        title: "Error",
        description: "Nama sales harus diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await api.createSales({ name: newSalesName.trim() });
      if (response.success && response.data) {
        setSalesList(prev => [...prev, response.data]);
        setFormData(prev => ({ ...prev, salesId: response.data.id.toString() }));
        setNewSalesName('');
        setShowAddSales(false);
        toast({
          title: "Sukses",
          description: "Sales berhasil ditambahkan"
        });
      }
    } catch (error) {
      console.error('Error adding sales:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan sales",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Nama paket harus diisi",
        variant: "destructive"
      });
      return;
    }

    if (!formData.routerName) {
      toast({
        title: "Error",
        description: "Router harus dipilih",
        variant: "destructive"
      });
      return;
    }

    if (!formData.mikrotikProfile.trim()) {
      toast({
        title: "Error",
        description: "Mikrotik profile harus dipilih",
        variant: "destructive"
      });
      return;
    }

    if (formData.downloadSpeed <= 0) {
      toast({
        title: "Error",
        description: "Kecepatan download harus lebih dari 0",
        variant: "destructive"
      });
      return;
    }

    if (formData.uploadSpeed <= 0) {
      toast({
        title: "Error",
        description: "Kecepatan upload harus lebih dari 0",
        variant: "destructive"
      });
      return;
    }

    if (formData.price <= 0) {
      toast({
        title: "Error",
        description: "Harga harus lebih dari 0",
        variant: "destructive"
      });
      return;
    }

    const packageData = {
      name: formData.name,
      description: formData.description,
      downloadSpeed: formData.downloadSpeed,
      uploadSpeed: formData.uploadSpeed,
      price: formData.price,
      routerName: formData.routerName,
      mikrotikProfile: formData.mikrotikProfile,
      salesId: formData.salesId === 'none' ? null : formData.salesId || null,
      commissionType: formData.commissionType,
      commissionValue: formData.commissionValue,
      isActive: formData.isActive
    };

    if (onSubmit) {
      await onSubmit(packageData);
    } else {
      console.log('Package form submitted:', packageData);
      toast({
        title: "Sukses",
        description: isEdit ? 'Paket berhasil diperbarui' : 'Paket berhasil ditambahkan'
      });
      onClose();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={onClose}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Paket' : 'Tambah Paket Baru'}
        </h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Paket</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Paket *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama paket"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Masukkan deskripsi paket"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="router">Router *</Label>
                <Select
                  value={formData.routerName}
                  onValueChange={handleRouterChange}
                  disabled={routersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={routersLoading ? "Memuat router..." : "Pilih router"} />
                  </SelectTrigger>
                  <SelectContent>
                    {routers.map((router) => (
                      <SelectItem key={router.id.toString()} value={router.name}>
                        {router.name} ({router.ipAddress})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mikrotikProfile">Profile PPP Mikrotik *</Label>
                <Select
                  value={formData.mikrotikProfile}
                  onValueChange={(value) => handleInputChange('mikrotikProfile', value)}
                  disabled={!formData.routerName || loadingProfiles}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !formData.routerName 
                          ? "Pilih router terlebih dahulu" 
                          : loadingProfiles 
                          ? "Memuat profile..." 
                          : "Pilih profile PPP"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {pppProfiles.map((profile) => (
                      <SelectItem key={profile.name} value={profile.name}>
                        {profile.name} ({profile.rateLimit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="downloadSpeed">Kecepatan Download (Mbps) *</Label>
                  <Input
                    id="downloadSpeed"
                    type="number"
                    min="1"
                    value={formData.downloadSpeed}
                    onChange={(e) => handleInputChange('downloadSpeed', parseInt(e.target.value) || 0)}
                    placeholder="10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="uploadSpeed">Kecepatan Upload (Mbps) *</Label>
                  <Input
                    id="uploadSpeed"
                    type="number"
                    min="1"
                    value={formData.uploadSpeed}
                    onChange={(e) => handleInputChange('uploadSpeed', parseInt(e.target.value) || 0)}
                    placeholder="5"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="price">Harga (Rp) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                  placeholder="100000"
                  required
                />
              </div>

              {/* Sales and Commission Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Informasi Sales & Komisi</h3>
                
                <div>
                  <Label htmlFor="sales">Sales Person</Label>
                  {showAddSales ? (
                    <div className="flex gap-2">
                      <Input
                        value={newSalesName}
                        onChange={(e) => setNewSalesName(e.target.value)}
                        placeholder="Nama sales baru"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddSales}
                        size="sm"
                      >
                        Simpan
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddSales(false);
                          setNewSalesName('');
                        }}
                        size="sm"
                      >
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select
                        value={formData.salesId}
                        onValueChange={(value) => handleInputChange('salesId', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Pilih sales person (opsional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tidak ada sales</SelectItem>
                          {salesList.map((sales) => (
                            <SelectItem key={sales.id} value={sales.id.toString()}>
                              {sales.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddSales(true)}
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {formData.salesId && formData.salesId !== 'none' && (
                  <>
                    <div>
                      <Label htmlFor="commissionType">Tipe Komisi</Label>
                      <Select
                        value={formData.commissionType}
                        onValueChange={(value: 'percentage' | 'nominal') => handleInputChange('commissionType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Persentase (%)</SelectItem>
                          <SelectItem value="nominal">Nominal (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="commissionValue">
                        Nilai Komisi {formData.commissionType === 'percentage' ? '(%)' : '(Rp)'}
                      </Label>
                      <Input
                        id="commissionValue"
                        type="number"
                        min="0"
                        max={formData.commissionType === 'percentage' ? 100 : undefined}
                        value={formData.commissionValue}
                        onChange={(e) => handleInputChange('commissionValue', parseFloat(e.target.value) || 0)}
                        placeholder={formData.commissionType === 'percentage' ? '10' : '50000'}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Paket Aktif</Label>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Batal
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {isEdit ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};