import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

// Generic settings hook using backend Settings API
export const useAppSetting = <T = any>(key: string, defaultValue?: T) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{ key: string; value: T | undefined}>({
    queryKey: ['appSetting', key],
    queryFn: async () => {
      try {
        const res = await api.get(`/settings/${key}`);
        // Backend returns { success, data: { key, value } }
        const payload = (res?.data?.data ?? res?.data) as { key?: string; value?: any };
        const value = payload?.value ?? undefined;
        return { key, value };
      } catch (err) {
        // If not found or error, return default
        return { key, value: defaultValue };
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const save = useMutation({
    mutationFn: async (value: T) => {
      // PUT expects { value }
      const res = await api.put(`/settings/${key}`, { value });
      return res?.data ?? res;
    },
    onSuccess: (_res, value) => {
      // Update cache immediately
      queryClient.setQueryData(['appSetting', key], { key, value } as any);
    }
  });

  return {
    setting: (data?.value ?? defaultValue) as T,
    isLoading,
    error,
    saveSetting: save,
  };
};

