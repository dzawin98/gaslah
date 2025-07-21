import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { Icon } from 'leaflet';
import { ODP } from '@/types/isp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different ODP status - smaller and more pointed
const createCustomIcon = (status: string) => {
  const color = status === 'active' ? '#10b981' : status === 'maintenance' ? '#f59e0b' : '#ef4444';
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 30" width="20" height="30">
        <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.52-4.48-10-10-10z" fill="${color}" stroke="white" stroke-width="1"/>
        <circle cx="10" cy="10" r="6" fill="white"/>
        <circle cx="10" cy="10" r="4" fill="${color}"/>
      </svg>
    `)}`,
    iconSize: [20, 30],
    iconAnchor: [10, 30],
    popupAnchor: [0, -30]
  });
};

interface ODPMapProps {
  odps: ODP[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onEdit?: (odp: ODP) => void;
  onDelete?: (odp: ODP) => void;
  onBack?: () => void;
}

export const ODPMap: React.FC<ODPMapProps> = ({ 
  odps, 
  center = [-0.698042, 103.017558], // Default to Batam coordinates
  zoom = 13,
  height = '500px',
  onEdit,
  onDelete,
  onBack
}) => {
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

  // Filter ODPs that have coordinates
  const odpsWithCoordinates = odps.filter(odp => odp.coordinates);

  // Calculate center based on ODP locations if available
  const mapCenter = odpsWithCoordinates.length > 0 
    ? [
        odpsWithCoordinates.reduce((sum, odp) => sum + odp.coordinates!.latitude, 0) / odpsWithCoordinates.length,
        odpsWithCoordinates.reduce((sum, odp) => sum + odp.coordinates!.longitude, 0) / odpsWithCoordinates.length
      ] as [number, number]
    : center;

  return (
    <div className="w-full relative" style={{ height, minHeight: '400px' }}>
      {/* Header dengan tombol kembali dan info */}
      <div className="absolute top-2 left-2 right-2 z-20 flex justify-between items-center">
        <div className="bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <span className="text-sm font-medium">
            {odpsWithCoordinates.length} ODP ditampilkan
          </span>
        </div>
        <div className="bg-white rounded-lg shadow-md px-3 py-2">
          <span className="text-xs text-gray-600">
            Klik marker untuk detail • Drag untuk navigasi
          </span>
        </div>
      </div>
      
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        className="rounded-lg border z-0"
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
      >
        <>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {odpsWithCoordinates.map((odp) => (
            <Marker
              key={odp.id}
              position={[odp.coordinates!.latitude, odp.coordinates!.longitude]}
              icon={createCustomIcon(odp.status)}
            >
              {/* Tooltip untuk menampilkan nama ODP saat hover */}
              <Tooltip 
                permanent={true} 
                direction="top" 
                offset={[0, -35]}
                className="odp-tooltip"
              >
                <div className="bg-white px-2 py-1 rounded shadow-md border text-xs font-medium text-gray-800">
                  {odp.name} (Client: {odp.usedSlots})
                </div>
              </Tooltip>
              
              {/* Popup untuk informasi lengkap saat diklik */}
              <Popup 
                closeButton={true} 
                maxWidth={220}
                minWidth={200}
                autoPan={true}
                keepInView={true}
                closeOnClick={false}
              >
                <div className="p-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-gray-800">{odp.name}</h3>
                    {getStatusBadge(odp.status)}
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Area:</span>
                      <span className="text-gray-800 font-medium">{odp.area}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lokasi:</span>
                      <span className="text-gray-800 font-medium">{odp.location}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-2 my-2">
                    <div className="grid grid-cols-3 gap-1 text-xs text-center">
                      <div>
                        <p className="text-blue-600 font-bold">{odp.totalSlots}</p>
                        <p className="text-gray-600 text-[10px]">Total</p>
                      </div>
                      <div>
                        <p className="text-red-600 font-bold">{odp.usedSlots}</p>
                        <p className="text-gray-600 text-[10px]">Terpakai</p>
                      </div>
                      <div>
                        <p className="text-green-600 font-bold">{odp.availableSlots}</p>
                        <p className="text-gray-600 text-[10px]">Tersedia</p>
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full" 
                          style={{ width: `${(odp.usedSlots / odp.totalSlots) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1 text-center">
                        Utilisasi: {Math.round((odp.usedSlots / odp.totalSlots) * 100)}%
                      </p>
                    </div>
                  </div>
                  
                  <a 
                    href={`https://www.google.com/maps?q=${odp.coordinates!.latitude},${odp.coordinates!.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                  >
                    📍 Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      </MapContainer>
      
      {odpsWithCoordinates.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border z-10">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Tidak ada ODP dengan koordinat</p>
            <p className="text-sm">Tambahkan koordinat pada ODP untuk menampilkan di peta</p>
          </div>
        </div>
      )}
    </div>
  );
};