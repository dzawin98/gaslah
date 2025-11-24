import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

// Default WAHA configuration
const DEFAULT_WAHA_CONFIG = {
  baseUrl: 'https://whatsapp.latansa.my.id',
  session: 'default',
  apiKey: '3b0de781f77844f6953060226a24b56d',
  sendDelayMs: 5000
};

export const useWahaConfig = () => {
  const queryClient = useQueryClient();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['wahaConfig'],
    queryFn: async () => {
      try {
        const payload = await api.get('/waha-config');
        const merged = {
          ...DEFAULT_WAHA_CONFIG,
          ...payload,
          apiKey: payload?.apiKey || DEFAULT_WAHA_CONFIG.apiKey,
          session: payload?.session || DEFAULT_WAHA_CONFIG.session,
          baseUrl:
            !payload?.baseUrl || payload?.baseUrl === 'http://localhost:3000'
              ? DEFAULT_WAHA_CONFIG.baseUrl
              : payload?.baseUrl,
          sendDelayMs: typeof payload?.sendDelayMs === 'number' ? payload.sendDelayMs : DEFAULT_WAHA_CONFIG.sendDelayMs
        };
        return merged;
      } catch (error) {
        return DEFAULT_WAHA_CONFIG;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });

  const updateConfig = useMutation({
    mutationFn: async (newConfig: any) => {
      const saved = await api.put('/waha-config', newConfig);
      return saved;
    },
    onSuccess: (payload) => {
      const merged = {
        ...DEFAULT_WAHA_CONFIG,
        ...payload,
        apiKey: payload?.apiKey || DEFAULT_WAHA_CONFIG.apiKey,
        session: payload?.session || DEFAULT_WAHA_CONFIG.session,
        baseUrl:
          !payload?.baseUrl || payload?.baseUrl === 'http://localhost:3000'
            ? DEFAULT_WAHA_CONFIG.baseUrl
            : payload?.baseUrl,
        sendDelayMs: typeof payload?.sendDelayMs === 'number' ? payload.sendDelayMs : DEFAULT_WAHA_CONFIG.sendDelayMs
      };
      queryClient.setQueryData(['wahaConfig'], merged);
    },
  });

  return {
    config,
    isLoading,
    error,
    updateConfig
  };
};
