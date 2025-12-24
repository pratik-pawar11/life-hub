import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBudgets } from '@/hooks/useBudgets';
import { Plus, Loader2, Pencil, Trash2, Check, X, Target, TrendingUp, AlertTriangle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

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

  // Calculate totals
  const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.monthly_limit), 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + (spendingByCategory[b.category] || 0), 0) || 0;

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

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) {
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Exceeded</Badge>;
    }
    if (percentage >= 80) {
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500 text-yellow-500">Warning</Badge>;
    }
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500 text-green-500">On Track</Badge>;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <Card className="h-fit">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Monthly Budgets</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          {availableCategories.length > 0 && !isAddingBudget && (
            <Button variant="outline" size="sm" onClick={() => setIsAddingBudget(true)} className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        {budgets && budgets.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Budget</p>
              <p className="text-lg font-bold mt-1">{formatAmount(totalBudget)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Spent</p>
              <p className={`text-lg font-bold mt-1 ${totalSpent > totalBudget ? 'text-destructive' : ''}`}>
                {formatAmount(totalSpent)}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Add Budget Form */}
        {isAddingBudget && (
          <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Add Budget Limit</p>
            </div>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="bg-background">
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
              className="bg-background"
            />
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="flex-1" onClick={handleAddBudget} disabled={!newCategory || !newLimit}>
                <Check className="h-4 w-4 mr-1" />
                Add Budget
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsAddingBudget(false); setNewCategory(''); setNewLimit(''); }}>
                <X className="h-4 w-4" />
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
                <div 
                  key={budget.id} 
                  className="p-4 rounded-xl border bg-gradient-to-br from-card to-muted/30 hover:shadow-md transition-shadow"
                >
                  {editingId === budget.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{budget.category}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editLimit}
                            onChange={(e) => setEditLimit(e.target.value)}
                            className="h-9 w-28"
                            autoFocus
                          />
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-green-500/10" onClick={() => handleSaveEdit(budget.id)}>
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-destructive/10" onClick={handleCancelEdit}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{budget.category}</span>
                          {getStatusBadge(percentage)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" onClick={() => handleStartEdit(budget)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10">
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

                      {/* Amount Display */}
                      <div className="flex items-baseline justify-between mb-2">
                        <div>
                          <span className="text-2xl font-bold">{formatAmount(spent)}</span>
                          <span className="text-sm text-muted-foreground ml-1">/ {formatAmount(budget.monthly_limit)}</span>
                        </div>
                        <span className="text-lg font-semibold text-muted-foreground">{Math.round(percentage)}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative">
                        <Progress value={percentage} className="h-2.5 bg-muted" />
                        <div 
                          className={`absolute top-0 left-0 h-2.5 rounded-full transition-all ${getProgressColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Remaining/Over */}
                      <div className="flex items-center justify-between mt-2">
                        <div className={`flex items-center gap-1.5 text-sm ${remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {remaining < 0 ? (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>{formatAmount(Math.abs(remaining))} over budget</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-3.5 w-3.5" />
                              <span>{formatAmount(remaining)} remaining</span>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : !isAddingBudget ? (
          <div className="text-center py-10 px-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No budgets set</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Add budget limits to track your spending by category
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsAddingBudget(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create First Budget
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
