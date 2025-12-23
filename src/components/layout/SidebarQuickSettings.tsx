import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useExpenses } from '@/hooks/useExpenses';
import { useBudgets } from '@/hooks/useBudgets';
import { Currency } from '@/hooks/useUserPreferences';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

// Conversion rate: 1 USD = 83 INR (approximate)
const CONVERSION_RATE = 83;

export function SidebarQuickSettings() {
  const { currency, setCurrency } = useCurrency();
  const { budgets, updateBudget } = useBudgets();
  const { expenses, updateExpense } = useExpenses();
  const { toast } = useToast();
  const [isConverting, setIsConverting] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<Currency | null>(null);
  const [showConversionDialog, setShowConversionDialog] = useState(false);

  const totalItemsToConvert = (budgets?.length || 0) + (expenses?.length || 0);

  const convertAmount = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount;
    if (toCurrency === 'INR' && fromCurrency === 'USD') {
      return amount * CONVERSION_RATE;
    } else if (toCurrency === 'USD' && fromCurrency === 'INR') {
      return amount / CONVERSION_RATE;
    }
    return amount;
  };

  const handleCurrencySelect = (newCurrency: Currency) => {
    if (newCurrency === currency) return;
    
    if (totalItemsToConvert > 0) {
      setPendingCurrency(newCurrency);
      setShowConversionDialog(true);
    } else {
      setCurrency(newCurrency);
    }
  };

  const handleConfirmConversion = async () => {
    if (!pendingCurrency) return;
    
    setShowConversionDialog(false);
    setIsConverting(true);
    
    try {
      if (budgets && budgets.length > 0) {
        for (const budget of budgets) {
          const convertedAmount = convertAmount(budget.monthly_limit, currency, pendingCurrency);
          updateBudget.mutate({ id: budget.id, monthly_limit: Math.round(convertedAmount * 100) / 100 });
        }
      }

      if (expenses && expenses.length > 0) {
        for (const expense of expenses) {
          const convertedAmount = convertAmount(Number(expense.amount), currency, pendingCurrency);
          updateExpense.mutate({ id: expense.id, amount: Math.round(convertedAmount * 100) / 100 });
        }
      }

      setCurrency(pendingCurrency);
      
      toast({
        title: 'Currency converted',
        description: `All amounts have been converted to ${pendingCurrency}.`,
      });
    } catch (error) {
      toast({
        title: 'Conversion error',
        description: 'Failed to convert some amounts.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
      setPendingCurrency(null);
    }
  };

  const handleCancelConversion = () => {
    setShowConversionDialog(false);
    setPendingCurrency(null);
  };

  const getCurrencySymbol = (curr: Currency) => curr === 'INR' ? '₹' : '$';

  return (
    <div className="space-y-2">
      <AlertDialog open={showConversionDialog} onOpenChange={setShowConversionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert All Amounts?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to convert all amounts from {getCurrencySymbol(currency)} {currency} to {getCurrencySymbol(pendingCurrency || 'USD')} {pendingCurrency}.
              </p>
              <p className="font-medium">
                This will update {budgets?.length || 0} budget(s) and {expenses?.length || 0} expense(s).
              </p>
              <p className="text-xs text-muted-foreground">
                Conversion rate: 1 USD = {CONVERSION_RATE} INR
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConversion}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmConversion}>Convert All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Currency</span>
      <Select value={currency} onValueChange={handleCurrencySelect} disabled={isConverting}>
        <SelectTrigger className="w-full h-9 bg-sidebar-accent/50">
          {isConverting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Converting...</span>
            </div>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="INR">₹ INR</SelectItem>
          <SelectItem value="USD">$ USD</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}