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
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Monthly Budgets</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Overall Summary */}
          {budgets && budgets.length > 0 && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Spent</p>
                <p className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-destructive' : ''}`}>
                  {formatAmount(totalSpent)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Budget</p>
                <p className="text-2xl font-bold">{formatAmount(totalBudget)}</p>
              </div>
              <div className="hidden sm:block w-32">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Overall</span>
                  <span className="font-medium">{Math.round(overallPercentage)}%</span>
                </div>
                <Progress value={Math.min(overallPercentage, 100)} className={`h-2 ${getProgressColor(overallPercentage)}`} />
              </div>
              {availableCategories.length > 0 && !isAddingBudget && (
                <Button onClick={() => setIsAddingBudget(true)} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Budget
                </Button>
              )}
            </div>
          )}

          {(!budgets || budgets.length === 0) && availableCategories.length > 0 && !isAddingBudget && (
            <Button onClick={() => setIsAddingBudget(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Budget Form */}
        {isAddingBudget && (
          <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium">Category</label>
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
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium">Monthly Limit</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddBudget} disabled={!newCategory || !newLimit}>
                  <Check className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button variant="ghost" onClick={() => { setIsAddingBudget(false); setNewCategory(''); setNewLimit(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Budget Grid */}
        {budgets && budgets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {budgets.map(budget => {
              const spent = spendingByCategory[budget.category] || 0;
              const percentage = Math.min((spent / budget.monthly_limit) * 100, 100);
              const remaining = budget.monthly_limit - spent;

              return (
                <div 
                  key={budget.id} 
                  className="p-4 rounded-xl border bg-gradient-to-br from-card to-muted/30 hover:shadow-lg transition-all"
                >
                  {editingId === budget.id ? (
                    <div className="space-y-3">
                      <span className="font-semibold">{budget.category}</span>
                      <Input
                        type="number"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        className="h-9"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleSaveEdit(budget.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{budget.category}</span>
                          {getStatusBadge(percentage)}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleStartEdit(budget)}>
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Trash2 className="h-3 w-3 text-destructive" />
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

                      {/* Amount */}
                      <div className="mb-2">
                        <span className="text-xl font-bold">{formatAmount(spent)}</span>
                        <span className="text-sm text-muted-foreground"> / {formatAmount(budget.monthly_limit)}</span>
                      </div>

                      {/* Progress */}
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <div className={`flex items-center gap-1 text-xs ${remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {remaining < 0 ? (
                            <>
                              <AlertTriangle className="h-3 w-3" />
                              <span>{formatAmount(Math.abs(remaining))} over</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-3 w-3" />
                              <span>{formatAmount(remaining)} left</span>
                            </>
                          )}
                        </div>
                        <span className="text-xs font-medium">{Math.round(percentage)}%</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : !isAddingBudget ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No budgets set</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add budget limits to track your spending by category
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
