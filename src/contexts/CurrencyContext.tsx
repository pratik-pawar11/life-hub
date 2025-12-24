import { createContext, useContext, ReactNode } from 'react';

interface CurrencyContextType {
  currency: 'INR';
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Format amount in INR
function formatINR(amount: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatter.format(amount)}`;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const formatAmount = (amount: number) => formatINR(amount);

  return (
    <CurrencyContext.Provider value={{ currency: 'INR', formatAmount }}>
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
