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
  const { user, session, loading } = useAuth();

  const insightsQuery = useQuery({
    queryKey: ['insights', user?.id],
    queryFn: async () => {
      // Double-check we have a valid session before calling
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        console.log('No valid session for insights');
        return [];
      }
      
      const { data, error } = await supabase.functions.invoke('generate-insights');

      if (error) {
        // Don't throw for auth errors, just return empty
        if (error.message?.includes('Invalid user token') || error.message?.includes('401')) {
          console.log('Auth error fetching insights, will retry on next auth change');
          return [];
        }
        console.error('Error fetching insights:', error);
        throw error;
      }
      
      return (data?.insights || []) as Insight[];
    },
    enabled: !!user && !!session && !loading,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error?.message?.includes('Invalid user token')) return false;
      return failureCount < 2;
    },
  });

  return {
    insights: insightsQuery.data ?? [],
    isLoading: insightsQuery.isLoading,
    error: insightsQuery.error,
    refetch: insightsQuery.refetch,
  };
}
