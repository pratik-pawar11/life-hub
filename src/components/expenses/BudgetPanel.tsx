import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBudgets } from '@/hooks/useBudgets';
import { Plus, Loader2, Pencil, Trash2, Check, X, Target } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { useExpenses } from '@/hooks/useExpenses';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

export function BudgetPanel() {
  const { formatAmount } = useCurrency();
  const { budgets, isLoading, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { expenses } = useExpenses();
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');

  const existingCategories = budgets?.map(b => b.category) || [];
  const availableCategories = CATEGORIES.filter(c => !existingCategories.includes(c));

  // Calculate current month spending per category
  const now = new Date();
  const currentMonthExpenses = expenses?.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }) || [];

  const spendingByCategory: Record<string, number> = {};
  currentMonthExpenses.forEach(e => {
    spendingByCategory[e.category] = (spendingByCategory[e.category] || 0) + Number(e.amount);
  });

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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-primary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Monthly Budgets
          </CardTitle>
          {availableCategories.length > 0 && !isAddingBudget && (
            <Button variant="outline" size="sm" onClick={() => setIsAddingBudget(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Budget Form */}
        {isAddingBudget && (
          <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
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
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleAddBudget} disabled={!newCategory || !newLimit}>
                Add Budget
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setIsAddingBudget(false); setNewCategory(''); setNewLimit(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Budget List */}
        {budgets && budgets.length > 0 ? (
          <div className="space-y-3">
            {budgets.map(budget => {
              const spent = spendingByCategory[budget.category] || 0;
              const percentage = Math.min((spent / budget.monthly_limit) * 100, 100);
              const remaining = budget.monthly_limit - spent;

              return (
                <div key={budget.id} className="p-3 rounded-lg border bg-card">
                  {editingId === budget.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{budget.category}</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editLimit}
                            onChange={(e) => setEditLimit(e.target.value)}
                            className="h-8 w-28"
                            autoFocus
                          />
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleSaveEdit(budget.id)}>
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCancelEdit}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{budget.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatAmount(spent)} / {formatAmount(budget.monthly_limit)}
                          </span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleStartEdit(budget)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
                      <Progress value={percentage} className={`h-2 ${getProgressColor(percentage)}`} />
                      <div className="flex justify-between mt-1">
                        <span className={`text-xs ${remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {remaining >= 0 ? `${formatAmount(remaining)} remaining` : `${formatAmount(Math.abs(remaining))} over budget`}
                        </span>
                        <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : !isAddingBudget ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No budgets set</p>
            <p className="text-xs">Add budget limits to track your spending</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}