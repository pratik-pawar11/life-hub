import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPrefs as UserPreferences;
      }
      
      return data as UserPreferences;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<Pick<UserPreferences, 'theme' | 'currency'>>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.id] });
    },
  });

  return {
    preferences,
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
