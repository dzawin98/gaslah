import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Edit, Trash2, Map, List, Filter } from 'lucide-react';
import { ODPForm } from '@/components/ODPForm';
import { useODP } from '@/hooks/useODP';
import { useAreas } from '@/hooks/useAreas';
import { ODPMap } from '@/components/map/ODPMap';
import { ODP } from '@/types/isp';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ODPPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingODP, setEditingODP] = useState<ODP | null>(null);
  const [deletingODP, setDeletingODP] = useState<ODP | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const { odp, loading, addODP, updateODP, deleteODP, refreshODPs } = useODP();
  const { areas } = useAreas();

  // Filter ODP berdasarkan area yang dipilih
  const filteredODP = useMemo(() => {
    if (selectedArea === 'all') {
      return odp;
    }
    return odp.filter(item => item.area === selectedArea);
  }, [odp, selectedArea]);

  const handleAddODP = async (odpData: any) => {
    try {
      await addODP(odpData);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add ODP:', error);
    }
  };

  const handleEditODP = async (odpData: any) => {
    if (!editingODP) return;
    
    try {
      await updateODP(editingODP.id, odpData);
      setEditingODP(null);
    } catch (error) {
      console.error('Failed to update ODP:', error);
    }
  };

  const handleDeleteODP = async () => {
    if (!deletingODP) return;
    
    try {
      await deleteODP(deletingODP.id);
      setDeletingODP(null);
    } catch (error) {
      console.error('Failed to delete ODP:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-500 text-white">Maintenance</Badge>;
      case 'inactive':
        return <Badge className="bg-red-500 text-white">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (showForm) {
    return (
      <div className="p-6">
        <ODPForm 
          onClose={() => setShowForm(false)}
          onSubmit={handleAddODP}
          existingODP={odp}
        />
      </div>
    );
  }

  if (editingODP) {
    return (
      <div className="p-6">
        <ODPForm 
          odp={editingODP}
          onClose={() => setEditingODP(null)}
          onSubmit={handleEditODP}
          isEdit={true}
          existingODP={odp}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ODP</h1>
        <p className="text-gray-600">Pengelolaan data ODP</p>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-2 md:h-4 md:w-4" />
            Tambah ODP
          </Button>
          
          {/* Filter Area */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter berdasarkan area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Area</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.name}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
            size="sm"
          >
            <List className="h-4 w-4 mr-2" />
            Tabel
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            size="sm"
          >
            <Map className="h-4 w-4 mr-2" />
            Peta
          </Button>

          {/* Manual refresh */}
          <Button variant="outline" size="sm" onClick={() => refreshODPs()} title="Refresh ODP">
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className={viewMode === 'map' ? 'p-4' : 'p-0 overflow-x-auto'}>
          {viewMode === 'table' ? (
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">No</TableHead>
                  <TableHead className="whitespace-nowrap">Nama ODP</TableHead>
                  <TableHead className="whitespace-nowrap">Area</TableHead>
                  <TableHead className="hidden md:table-cell whitespace-nowrap">Lokasi</TableHead>
                  <TableHead className="whitespace-nowrap">Total Slot</TableHead>
                  <TableHead className="whitespace-nowrap">Terpakai</TableHead>
                  <TableHead className="whitespace-nowrap">Tersedia</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="hidden md:table-cell whitespace-nowrap">Koordinat</TableHead>
                  <TableHead className="whitespace-nowrap">Act</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredODP.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      {selectedArea === 'all' ? 'Tidak ada data ODP' : `Tidak ada ODP di area ${selectedArea}`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredODP.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-xs md:text-sm">{index + 1}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap text-xs md:text-sm">{item.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs md:text-sm">{item.area}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.coordinates ? 
                          `${item.coordinates.latitude.toFixed(6)}, ${item.coordinates.longitude.toFixed(6)}` : 
                          'Koordinat tidak tersedia'
                        }
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs md:text-sm">{item.totalSlots}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs md:text-sm">{item.usedSlots}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs md:text-sm">{item.availableSlots}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs md:text-sm">{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.coordinates ? (
                          <a 
                            href={`https://www.google.com/maps?q=${item.coordinates.latitude},${item.coordinates.longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline"
                          >
                            {`${item.coordinates.latitude},${item.coordinates.longitude}`}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 w-7 md:h-8 md:w-8 p-0 bg-yellow-100 text-yellow-600"
                            onClick={() => setEditingODP(item)}
                            title="Edit ODP"
                          >
                            <Edit className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 w-7 md:h-8 md:w-8 p-0 bg-red-100 text-red-600"
                            onClick={() => setDeletingODP(item)}
                            title="Delete ODP"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <div>
              {loading ? (
                <div className="text-center py-8">
                  Loading...
                </div>
              ) : filteredODP.length === 0 ? (
                <div className="text-center py-8">
                  {selectedArea === 'all' ? 'Tidak ada data ODP' : `Tidak ada ODP di area ${selectedArea}`}
                </div>
              ) : (
                <ODPMap 
                  odps={filteredODP} 
                  onEdit={(odpItem) => setEditingODP(odpItem)}
                  onDelete={(odpItem) => setDeletingODP(odpItem)}
                  onBack={() => setViewMode('table')}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingODP} onOpenChange={() => setDeletingODP(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus ODP</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus ODP "{deletingODP?.name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteODP}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ODPPage;
