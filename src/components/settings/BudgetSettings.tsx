import { useState } from 'react';
import { useBudgets } from '@/hooks/useBudgets';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Plus, Trash2, Loader2, Edit2, Check, X } from 'lucide-react';

const CATEGORIES = ['Food', 'Travel', 'Rent', 'Shopping', 'Others'];

export function BudgetSettings() {
  const { budgets, isLoading, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { formatAmount } = useCurrency();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');

  const existingCategories = budgets.map(b => b.category);
  const availableCategories = CATEGORIES.filter(c => !existingCategories.includes(c));

  const handleAdd = async () => {
    if (!newCategory || !newLimit) return;
    
    await addBudget.mutateAsync({
      category: newCategory,
      monthly_limit: parseFloat(newLimit),
    });
    
    setNewCategory('');
    setNewLimit('');
    setIsAdding(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editLimit) return;
    
    await updateBudget.mutateAsync({
      id,
      monthly_limit: parseFloat(editLimit),
    });
    
    setEditingId(null);
    setEditLimit('');
  };

  const handleDelete = async (id: string) => {
    await deleteBudget.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Budget Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Budget Limits
        </CardTitle>
        <CardDescription>Set monthly spending limits per category to get alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Budgets */}
        {budgets.map((budget) => (
          <div 
            key={budget.id} 
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium">{budget.category}</span>
            </div>
            
            {editingId === budget.id ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-24 h-8"
                  placeholder="Amount"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleUpdate(budget.id)}
                  disabled={updateBudget.isPending}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditingId(null);
                    setEditLimit('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {formatAmount(budget.monthly_limit)}/month
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditingId(budget.id);
                    setEditLimit(budget.monthly_limit.toString());
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(budget.id)}
                  disabled={deleteBudget.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Add New Budget */}
        {isAdding ? (
          <div className="p-4 rounded-lg border border-dashed border-border bg-muted/20 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit</Label>
                <Input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={!newCategory || !newLimit || addBudget.isPending}
                size="sm"
              >
                {addBudget.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Budget
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewCategory('');
                  setNewLimit('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          availableCategories.length > 0 && (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Budget Limit
            </Button>
          )
        )}

        {budgets.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No budgets set. Add budget limits to track your spending.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
