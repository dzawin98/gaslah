import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { MapPicker } from '@/components/map/MapPicker';
import { toast } from 'sonner';
import { ODP } from '@/types/isp';
import { useAreas } from '@/hooks/useAreas';

interface ODPFormProps {
  onClose: () => void;
  onSubmit?: (odpData: any) => void;
  odp?: ODP;
  isEdit?: boolean;
}

export const ODPForm = ({ onClose, onSubmit, odp, isEdit = false }: ODPFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    area: '', // Gunakan area sebagai field utama
    totalSlots: 8,
    usedSlots: 0,
    latitude: '',
    longitude: '',
    status: 'active' as 'active' | 'maintenance' | 'inactive'
  });

  const { areas, loading: areasLoading } = useAreas();

  // Load ODP data when editing
  useEffect(() => {
    if (isEdit && odp) {
      console.log('Loading ODP data for edit:', odp);
      console.log('Available areas:', areas);
      setFormData({
        name: odp.name || '',
        area: odp.area || '', // Load area untuk data existing
        totalSlots: odp.totalSlots || 8,
        usedSlots: odp.usedSlots || 0,
        latitude: odp.coordinates?.latitude?.toString() || '',
        longitude: odp.coordinates?.longitude?.toString() || '',
        status: odp.status || 'active'
      });
    }
  }, [isEdit, odp, areas]); // Tambahkan areas sebagai dependency

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nama ODP harus diisi');
      return;
    }

    if (!formData.area) {
      toast.error('Wilayah harus dipilih');
      return;
    }

    if (formData.totalSlots < 1) {
      toast.error('Total slot harus lebih dari 0');
      return;
    }

    if (formData.usedSlots > formData.totalSlots) {
      toast.error('Slot terpakai tidak boleh lebih dari total slot');
      return;
    }

    const odpData = {
      name: formData.name,
      area: formData.area, // Simpan area yang dipilih
      totalSlots: formData.totalSlots,
      usedSlots: formData.usedSlots,
      availableSlots: formData.totalSlots - formData.usedSlots,
      status: formData.status,
      // Kirim latitude dan longitude sebagai field terpisah sesuai dengan backend
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null
    };

    if (onSubmit) {
      await onSubmit(odpData);
    } else {
      console.log('ODP form submitted:', odpData);
      toast.success(isEdit ? 'ODP berhasil diperbarui' : 'ODP berhasil ditambahkan');
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
          {isEdit ? 'Edit ODP' : 'Tambah ODP Baru'}
        </h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Informasi ODP</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama ODP *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama ODP"
                  required
                />
              </div>

              <div>
                <Label htmlFor="area">Wilayah *</Label>
                <Select value={formData.area} onValueChange={(value) => handleInputChange('area', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    {areasLoading ? (
                      <SelectItem value="loading" disabled>Loading wilayah...</SelectItem>
                    ) : areas.length === 0 ? (
                      <SelectItem value="no-areas" disabled>Tidak ada wilayah tersedia</SelectItem>
                    ) : (
                      areas.map(area => (
                        <SelectItem key={area.id} value={area.name}>
                          {area.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalSlots">Total Slot *</Label>
                  <Input
                    id="totalSlots"
                    type="number"
                    min="1"
                    value={formData.totalSlots}
                    onChange={(e) => handleInputChange('totalSlots', parseInt(e.target.value) || 0)}
                    placeholder="8"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="usedSlots">Slot Terpakai</Label>
                  <Input
                    id="usedSlots"
                    type="number"
                    min="0"
                    max={formData.totalSlots}
                    value={formData.usedSlots}
                    onChange={(e) => handleInputChange('usedSlots', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label>Koordinat Lokasi</Label>
                <MapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onCoordinateChange={(lat, lng) => {
                    handleInputChange('latitude', lat);
                    handleInputChange('longitude', lng);
                  }}
                  height="300px"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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