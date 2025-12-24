import { createContext, useContext, ReactNode } from 'react';
import { useUserPreferences, Currency, formatCurrency, convertCurrency, CONVERSION_RATES } from '@/hooks/useUserPreferences';

interface CurrencyContextType {
  currency: Currency;
  baseCurrency: Currency;
  formatAmount: (amount: number, fromCurrency?: Currency) => string;
  convertAmount: (amount: number, fromCurrency?: Currency) => number;
  setCurrency: (currency: Currency) => void;
  isLoading: boolean;
  conversionRate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Base currency for all stored amounts in the database
const BASE_CURRENCY: Currency = 'INR';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  
  const currency = preferences?.currency || 'INR';
  
  // Format amount - converts from base currency (INR) to display currency
  const formatAmount = (amount: number, fromCurrency: Currency = BASE_CURRENCY) => {
    return formatCurrency(amount, currency, fromCurrency);
  };
  
  // Convert amount - returns numeric value converted from base currency to display currency
  const convertAmount = (amount: number, fromCurrency: Currency = BASE_CURRENCY) => {
    return convertCurrency(amount, fromCurrency, currency);
  };
  
  const setCurrency = (newCurrency: Currency) => {
    updatePreferences({ currency: newCurrency });
  };
  
  // Current conversion rate from INR to selected currency
  const conversionRate = CONVERSION_RATES[currency];

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      baseCurrency: BASE_CURRENCY,
      formatAmount, 
      convertAmount,
      setCurrency, 
      isLoading,
      conversionRate
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
