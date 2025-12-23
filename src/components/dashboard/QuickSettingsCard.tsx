import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBudgets } from '@/hooks/useBudgets';
import { Currency } from '@/hooks/useUserPreferences';
import { Settings, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

export function QuickSettingsCard() {
  const { currency, setCurrency, formatAmount } = useCurrency();
  const { budgets, isLoading, addBudget } = useBudgets();
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Quick Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currency Setting */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Currency</span>
          <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
            <SelectTrigger className="w-32">
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
            <span className="text-sm font-medium">Budget Limits</span>
            {availableCategories.length > 0 && (
              <Popover open={isAddingBudget} onOpenChange={setIsAddingBudget}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Add Budget Limit</p>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Monthly limit"
                      value={newLimit}
                      onChange={(e) => setNewLimit(e.target.value)}
                    />
                    <Button size="sm" className="w-full" onClick={handleAddBudget} disabled={!newCategory || !newLimit}>
                      Add Budget
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : budgets && budgets.length > 0 ? (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {budgets.slice(0, 4).map(budget => (
                <div key={budget.id} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">{budget.category}</span>
                  <span className="font-medium">{formatAmount(budget.monthly_limit)}</span>
                </div>
              ))}
              {budgets.length > 4 && (
                <p className="text-xs text-muted-foreground text-center">+{budgets.length - 4} more</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">No budgets set</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
