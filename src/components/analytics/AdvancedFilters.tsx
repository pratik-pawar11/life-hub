import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Filter, X } from 'lucide-react';
import { Expense } from '@/types';

export interface FilterState {
  categories: string[];
  amountRange: [number, number];
  hasNotes: 'all' | 'with' | 'without';
}

interface AdvancedFiltersProps {
  expenses: Expense[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function AdvancedFilters({ expenses, filters, onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Calculate available categories and amount range from data
  const { categories, minAmount, maxAmount } = useMemo(() => {
    const cats = [...new Set(expenses.map(e => e.category))].sort();
    const amounts = expenses.map(e => Number(e.amount));
    return {
      categories: cats,
      minAmount: amounts.length > 0 ? Math.min(...amounts) : 0,
      maxAmount: amounts.length > 0 ? Math.max(...amounts) : 1000,
    };
  }, [expenses]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0 && filters.categories.length < categories.length) count++;
    if (filters.amountRange[0] > minAmount || filters.amountRange[1] < maxAmount) count++;
    if (filters.hasNotes !== 'all') count++;
    return count;
  }, [filters, categories.length, minAmount, maxAmount]);

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleSelectAllCategories = () => {
    onFiltersChange({ ...filters, categories: categories });
  };

  const handleClearCategories = () => {
    onFiltersChange({ ...filters, categories: [] });
  };

  const handleAmountChange = (values: number[]) => {
    onFiltersChange({ ...filters, amountRange: [values[0], values[1]] });
  };

  const handleNotesFilterChange = (value: 'all' | 'with' | 'without') => {
    onFiltersChange({ ...filters, hasNotes: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      categories: categories,
      amountRange: [minAmount, maxAmount],
      hasNotes: 'all',
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass-card p-4 animate-slide-up">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="font-semibold">Advanced Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-6">
          {/* Category Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Categories</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAllCategories} className="h-6 text-xs">
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearCategories} className="h-6 text-xs">
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <label
                  key={category}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={filters.categories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Amount Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Amount Range</Label>
            <div className="px-2">
              <Slider
                value={[filters.amountRange[0], filters.amountRange[1]]}
                min={minAmount}
                max={maxAmount}
                step={Math.max(1, Math.floor((maxAmount - minAmount) / 100))}
                onValueChange={handleAmountChange}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>₹{filters.amountRange[0].toLocaleString('en-IN')}</span>
                <span>₹{filters.amountRange[1].toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Notes Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Notes</Label>
            <div className="flex gap-2">
              {(['all', 'with', 'without'] as const).map(value => (
                <Button
                  key={value}
                  variant={filters.hasNotes === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleNotesFilterChange(value)}
                  className="capitalize"
                >
                  {value === 'all' ? 'All' : value === 'with' ? 'With Notes' : 'Without Notes'}
                </Button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Reset All Filters
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Utility to apply filters
export function applyFilters(expenses: Expense[], filters: FilterState): Expense[] {
  return expenses.filter(expense => {
    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(expense.category)) {
      return false;
    }

    // Amount range filter
    const amount = Number(expense.amount);
    if (amount < filters.amountRange[0] || amount > filters.amountRange[1]) {
      return false;
    }

    // Notes filter
    if (filters.hasNotes === 'with' && !expense.notes) {
      return false;
    }
    if (filters.hasNotes === 'without' && expense.notes) {
      return false;
    }

    return true;
  });
}
