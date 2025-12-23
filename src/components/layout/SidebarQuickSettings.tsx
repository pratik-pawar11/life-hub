import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBudgets } from '@/hooks/useBudgets';
import { Currency } from '@/hooks/useUserPreferences';
import { Plus, Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

// Conversion rate: 1 USD = 83 INR (approximate)
const CONVERSION_RATE = 83;

export function SidebarQuickSettings() {
  const { currency, setCurrency, formatAmount } = useCurrency();
  const { budgets, isLoading, addBudget, updateBudget, deleteBudget } = useBudgets();
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');

  const existingCategories = budgets?.map(b => b.category) || [];
  const availableCategories = CATEGORIES.filter(c => !existingCategories.includes(c));

  const handleAddBudget = () => {
    if (newCategory && newLimit) {
      addBudget.mutate({ category: newCategory, monthly_limit: parseFloat(newLimit) });
      setNewCategory('');
      setNewLimit('');
      setIsAddingBudget(false);
    }
  };

  const handleStartEdit = (budget: { id: string; monthly_limit: number }) => {
    setEditingId(budget.id);
    setEditLimit(budget.monthly_limit.toString());
  };

  const handleSaveEdit = (id: string) => {
    if (editLimit) {
      updateBudget.mutate({ id, monthly_limit: parseFloat(editLimit) });
      setEditingId(null);
      setEditLimit('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLimit('');
  };

  const handleDelete = (id: string) => {
    deleteBudget.mutate(id);
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    if (newCurrency !== currency && budgets && budgets.length > 0) {
      // Convert all budget limits when currency changes
      budgets.forEach(budget => {
        let convertedAmount: number;
        if (newCurrency === 'INR' && currency === 'USD') {
          // USD to INR
          convertedAmount = budget.monthly_limit * CONVERSION_RATE;
        } else if (newCurrency === 'USD' && currency === 'INR') {
          // INR to USD
          convertedAmount = budget.monthly_limit / CONVERSION_RATE;
        } else {
          convertedAmount = budget.monthly_limit;
        }
        updateBudget.mutate({ id: budget.id, monthly_limit: Math.round(convertedAmount * 100) / 100 });
      });
    }
    setCurrency(newCurrency);
  };

  return (
    <div className="space-y-4">
      {/* Currency Setting */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Currency</span>
        <Select value={currency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="w-full h-9 bg-sidebar-accent/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INR">₹ INR</SelectItem>
            <SelectItem value="USD">$ USD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Budget Limits */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Budgets</span>
          {availableCategories.length > 0 && (
            <Popover open={isAddingBudget} onOpenChange={setIsAddingBudget}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end" side="right">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Add Budget</p>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Limit"
                    className="h-8 text-sm"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                  />
                  <Button size="sm" className="w-full h-8" onClick={handleAddBudget} disabled={!newCategory || !newLimit}>
                    Add
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : budgets && budgets.length > 0 ? (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {budgets.map(budget => (
              <div key={budget.id} className="group flex items-center justify-between text-sm py-1.5 px-2 rounded bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors">
                {editingId === budget.id ? (
                  <>
                    <span className="text-xs text-muted-foreground truncate flex-shrink-0 w-16">{budget.category}</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        className="h-6 w-20 text-xs px-1"
                        autoFocus
                      />
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleSaveEdit(budget.id)}>
                        <Check className="h-3 w-3 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancelEdit}>
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground truncate">{budget.category}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">{formatAmount(budget.monthly_limit)}</span>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleStartEdit(budget)}>
                          <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                              <Trash2 className="h-2.5 w-2.5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the budget for {budget.category}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(budget.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">No budgets set</p>
        )}
      </div>
    </div>
  );
}