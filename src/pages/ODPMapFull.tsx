import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ODPMap } from '@/components/map/ODPMap';
import { useODP } from '@/hooks/useODP';

const ODPMapFull: React.FC = () => {
  const [params] = useSearchParams();
  const odpIdParam = params.get('odpId');
  const initialODPId = odpIdParam ? Number(odpIdParam) : undefined;
  const { odp, loading } = useODP();

  // Temukan ODP terpilih untuk memusatkan peta
  const selected = initialODPId ? odp.find(o => o.id === initialODPId) : undefined;
  const centerOverride: [number, number] | undefined = (selected && selected.coordinates)
    ? [selected.coordinates.latitude, selected.coordinates.longitude]
    : undefined;

  return (
    <div className="w-screen h-screen overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center w-full h-full text-gray-600">Memuat peta...</div>
      ) : (
        <ODPMap 
          odps={odp}
          height={'100vh'}
          zoom={centerOverride ? 17 : 13}
          initialFullscreen={true}
          initialODPId={initialODPId}
          centerOverride={centerOverride}
        />
      )}
    </div>
  );
};

export default ODPMapFull;