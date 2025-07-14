import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

// Default WAHA configuration
const DEFAULT_WAHA_CONFIG = {
  baseUrl: 'https://whatsapp.latansa.my.id',
  session: 'default',
  apiKey: 'dzawinwaha878472873129@#'
};

export const useWahaConfig = () => {
  const queryClient = useQueryClient();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['wahaConfig'],
    queryFn: async () => {
      try {
        const response = await api.get('/settings/waha');
        console.log('WAHA config from API:', response);
        
        const wahaData = response?.data || response;
        
        // Handle API response format: {key: 'waha', value: {baseUrl, session, apiKey}}
        let finalConfig;
        if (wahaData && wahaData.value) {
          finalConfig = wahaData.value;
        } else if (wahaData && wahaData.baseUrl) {
          finalConfig = wahaData;
        } else {
          throw new Error('Invalid API response format');
        }
        
        localStorage.setItem('wahaConfig', JSON.stringify(finalConfig));
        return finalConfig;
      } catch (error) {
        console.error('Error fetching WAHA config from API:', error);
        
        // Cek localStorage
        const localConfig = localStorage.getItem('wahaConfig');
        if (localConfig) {
          try {
            const parsedConfig = JSON.parse(localConfig);
            console.log('Using WAHA config from localStorage:', parsedConfig);
            return parsedConfig;
          } catch (parseError) {
            console.error('Error parsing localStorage WAHA config:', parseError);
            localStorage.removeItem('wahaConfig');
          }
        }
        
        // Gunakan default config jika semua gagal
        console.log('Using default WAHA config:', DEFAULT_WAHA_CONFIG);
        localStorage.setItem('wahaConfig', JSON.stringify(DEFAULT_WAHA_CONFIG));
        return DEFAULT_WAHA_CONFIG;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });

  const updateConfig = useMutation({
    mutationFn: async (newConfig: any) => {
      console.log('Updating WAHA config:', newConfig);
      
      try {
        const response = await api.put('/settings/waha', newConfig);
        
        localStorage.setItem('wahaConfig', JSON.stringify(newConfig));
        console.log('WAHA config updated successfully');
        
        return response;
      } catch (error) {
        console.error('Error updating WAHA config:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['wahaConfig'], variables);
      queryClient.invalidateQueries({ queryKey: ['wahaConfig'] });
    },
  });

  return {
    config,
    isLoading,
    error,
    updateConfig
  };
};