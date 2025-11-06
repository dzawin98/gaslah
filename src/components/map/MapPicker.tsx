import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Tooltip } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Search, Map, Satellite, Maximize, Minimize } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  latitude: string;
  longitude: string;
  onCoordinateChange: (lat: string, lng: string) => void;
  height?: string;
  existingMarkers?: Array<{
    lat: number;
    lng: number;
    label?: string;
  }>;
}

// Component to handle map clicks
const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
};

export const MapPicker: React.FC<MapPickerProps> = ({ 
  latitude, 
  longitude, 
  onCoordinateChange,
  height = '400px',
  existingMarkers = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Default center (Batam)
  const defaultCenter: [number, number] = [-0.698042, 103.017558];
  
  // Current marker position
  const markerPosition: [number, number] | null = 
    latitude && longitude 
      ? [parseFloat(latitude), parseFloat(longitude)]
      : null;

  // Map center - use marker position if available, otherwise default
  const mapCenter = markerPosition || defaultCenter;

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    onCoordinateChange(lat.toFixed(6), lng.toFixed(6));
  }, [onCoordinateChange]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          handleLocationSelect(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Tidak dapat mengakses lokasi. Pastikan izin lokasi telah diberikan.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Geolocation tidak didukung oleh browser ini.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Using Nominatim API for geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        handleLocationSelect(parseFloat(lat), parseFloat(lon));
      } else {
        alert('Lokasi tidak ditemukan. Coba dengan kata kunci yang berbeda.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Terjadi kesalahan saat mencari lokasi.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualInput = (field: 'lat' | 'lng', value: string) => {
    if (field === 'lat') {
      onCoordinateChange(value, longitude);
    } else {
      onCoordinateChange(latitude, value);
    }
  };

  return (
    <div className={`space-y-4 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' 
        : ''
    }`}>
      {/* Search and Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Cari alamat atau tempat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button 
            type="button" 
            onClick={handleSearch} 
            disabled={isSearching}
            variant="outline"
            size="icon"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            onClick={handleGetCurrentLocation}
            variant="outline"
            size="icon"
            title="Gunakan lokasi saat ini"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Layer Toggle */}
         <div className="flex items-center gap-2">
           <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
             <Button
               type="button"
               variant={mapLayer === 'street' ? 'default' : 'ghost'}
               size="sm"
               onClick={() => setMapLayer('street')}
               className="h-8 px-2 text-xs"
             >
               <Map className="h-3 w-3 mr-1" />
               Peta
             </Button>
             <Button
               type="button"
               variant={mapLayer === 'satellite' ? 'default' : 'ghost'}
               size="sm"
               onClick={() => setMapLayer('satellite')}
               className="h-8 px-2 text-xs"
             >
               <Satellite className="h-3 w-3 mr-1" />
               Satelit
             </Button>
           </div>
           {/* Fullscreen Toggle */}
           <div className="bg-gray-50 p-1 rounded-lg">
             <Button
               type="button"
               variant="ghost"
               size="sm"
               onClick={() => setIsFullscreen(!isFullscreen)}
               className="h-8 px-2 text-xs"
               title={isFullscreen ? 'Keluar dari layar penuh' : 'Layar penuh'}
             >
               {isFullscreen ? (
                 <Minimize className="h-3 w-3" />
               ) : (
                 <Maximize className="h-3 w-3" />
               )}
             </Button>
           </div>
         </div>

        {/* Manual coordinate input */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="manual-lat">Latitude</Label>
            <Input
              id="manual-lat"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => handleManualInput('lat', e.target.value)}
              placeholder="-0.698042"
            />
          </div>
          <div>
            <Label htmlFor="manual-lng">Longitude</Label>
            <Input
              id="manual-lng"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => handleManualInput('lng', e.target.value)}
              placeholder="103.017558"
            />
          </div>
        </div>
      </div>

      {/* Map */}
      <div 
        className="relative" 
        style={isFullscreen ? { height: 'calc(100vh - 200px)' } : { height }}
      >
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg border"
        >
          <>
            <TileLayer
              attribution={
                mapLayer === 'street' 
                  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  : '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              }
              url={
                mapLayer === 'street'
                  ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              }
              key={mapLayer}
            />
            
            <MapClickHandler onLocationSelect={handleLocationSelect} />

            {/* Existing ODP markers for context */}
            {existingMarkers.map((m, idx) => (
              <Marker key={`existing-${idx}`} position={[m.lat, m.lng]}>
                {m.label && (
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
                    {m.label}
                  </Tooltip>
                )}
              </Marker>
            ))}
            
            {markerPosition && (
              <Marker position={markerPosition}>
              </Marker>
            )}
          </>
        </MapContainer>
        
        {/* Instructions overlay */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 p-2 rounded shadow text-xs max-w-[200px]">
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin className="h-3 w-3" />
            <span>Klik pada peta untuk memilih lokasi</span>
          </div>
        </div>
      </div>

      {markerPosition && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Koordinat terpilih:</strong> {latitude}, {longitude}
        </div>
      )}
    </div>
  );
};
