import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Insight {
  message: string;
  type: 'expense' | 'task' | 'budget';
  priority: 'info' | 'warning' | 'success';
  amounts?: number[];
}

export function useInsights() {
  const { user, session } = useAuth();

  const insightsQuery = useQuery({
    queryKey: ['insights', user?.id],
    queryFn: async () => {
      if (!session?.access_token) return [];
      
      const { data, error } = await supabase.functions.invoke('generate-insights');

      if (error) {
        console.error('Error fetching insights:', error);
        throw error;
      }
      
      return (data?.insights || []) as Insight[];
    },
    enabled: !!user && !!session,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    insights: insightsQuery.data ?? [],
    isLoading: insightsQuery.isLoading,
    error: insightsQuery.error,
    refetch: insightsQuery.refetch,
  };
}
