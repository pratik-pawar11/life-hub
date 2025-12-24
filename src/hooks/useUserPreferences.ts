import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type Currency = 'INR' | 'USD';

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: Theme;
  currency: Currency;
  created_at: string;
  updated_at: string;
}

const CURRENCY_STORAGE_KEY = 'user-currency-preference';

// Get cached currency from localStorage for instant loading
function getCachedCurrency(): Currency {
  if (typeof window === 'undefined') return 'INR';
  const cached = localStorage.getItem(CURRENCY_STORAGE_KEY);
  return (cached === 'USD' || cached === 'INR') ? cached : 'INR';
}

// Cache currency to localStorage
function setCachedCurrency(currency: Currency) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }
}

export function useUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no preferences exist, create default ones
      if (!data) {
        const cachedCurrency = getCachedCurrency();
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id, currency: cachedCurrency })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPrefs as UserPreferences;
      }
      
      // Update cache when we get data from server
      setCachedCurrency(data.currency as Currency);
      return data as UserPreferences;
    },
    enabled: !!user,
    // Use stale data while revalidating for faster UI
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Provide cached values while loading
  const cachedCurrency = getCachedCurrency();
  const effectivePreferences = preferences ?? {
    id: '',
    user_id: user?.id || '',
    theme: 'dark' as Theme,
    currency: cachedCurrency,
    created_at: '',
    updated_at: '',
  };

  // Sync cache when preferences change
  useEffect(() => {
    if (preferences?.currency) {
      setCachedCurrency(preferences.currency);
    }
  }, [preferences?.currency]);

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<Pick<UserPreferences, 'theme' | 'currency'>>) => {
      if (!user) throw new Error('Not authenticated');
      
      // Immediately cache currency update
      if (updates.currency) {
        setCachedCurrency(updates.currency);
      }
      
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserPreferences;
    },
    // Optimistic update for instant UI feedback
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['userPreferences', user?.id] });
      const previousPrefs = queryClient.getQueryData(['userPreferences', user?.id]);
      
      queryClient.setQueryData(['userPreferences', user?.id], (old: UserPreferences | null) => 
        old ? { ...old, ...updates } : old
      );
      
      return { previousPrefs };
    },
    onError: (err, updates, context) => {
      // Rollback on error
      if (context?.previousPrefs) {
        queryClient.setQueryData(['userPreferences', user?.id], context.previousPrefs);
        if ((context.previousPrefs as UserPreferences)?.currency) {
          setCachedCurrency((context.previousPrefs as UserPreferences).currency);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.id] });
    },
  });

  return {
    preferences: effectivePreferences,
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}

// Currency conversion rates (base currency is INR)
// In a production app, you'd fetch these from an API
export const CONVERSION_RATES: Record<Currency, number> = {
  INR: 1,
  USD: 0.012, // 1 INR = 0.012 USD (approximately)
};

// Currency formatting utility with conversion
export function formatCurrency(amount: number, currency: Currency = 'INR', baseCurrency: Currency = 'INR'): string {
  const symbols = {
    INR: '₹',
    USD: '$',
  };
  
  // Convert amount from base currency to target currency
  let convertedAmount = amount;
  if (baseCurrency !== currency) {
    // First convert to INR (base), then to target currency
    const amountInINR = amount / CONVERSION_RATES[baseCurrency];
    convertedAmount = amountInINR * CONVERSION_RATES[currency];
  }
  
  const formatter = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${symbols[currency]}${formatter.format(convertedAmount)}`;
}

// Convert amount between currencies
export function convertCurrency(amount: number, fromCurrency: Currency, toCurrency: Currency): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to INR first, then to target
  const amountInINR = amount / CONVERSION_RATES[fromCurrency];
  return amountInINR * CONVERSION_RATES[toCurrency];
}
