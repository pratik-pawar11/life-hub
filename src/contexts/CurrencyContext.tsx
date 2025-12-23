import { createContext, useContext, ReactNode } from 'react';
import { useUserPreferences, Currency, formatCurrency } from '@/hooks/useUserPreferences';

interface CurrencyContextType {
  currency: Currency;
  formatAmount: (amount: number) => string;
  setCurrency: (currency: Currency) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  
  const currency = preferences?.currency || 'INR';
  
  const formatAmount = (amount: number) => formatCurrency(amount, currency);
  
  const setCurrency = (newCurrency: Currency) => {
    updatePreferences({ currency: newCurrency });
  };

  return (
    <CurrencyContext.Provider value={{ currency, formatAmount, setCurrency, isLoading }}>
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
