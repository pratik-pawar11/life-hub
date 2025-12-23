import { useBudgets } from '@/hooks/useBudgets';
import { useExpenses } from '@/hooks/useExpenses';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BudgetAlertsCard() {
  const { budgets, isLoading } = useBudgets();
  const { expenses } = useExpenses();
  const { formatAmount } = useCurrency();

  // Calculate current month spending by category
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const categoryTotals: Record<string, number> = {};
  expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

  const budgetStatus = budgets.map(budget => {
    const spent = categoryTotals[budget.category] || 0;
    const percentage = Math.min((spent / budget.monthly_limit) * 100, 100);
    const remaining = budget.monthly_limit - spent;
    
    return {
      ...budget,
      spent,
      remaining,
      percentage,
      status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok',
    };
  });

  const alertCount = budgetStatus.filter(b => b.status !== 'ok').length;

  if (isLoading) {
    return null;
  }

  if (budgets.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-primary" />
          Budget Status
          {alertCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-500">
              {alertCount} alert{alertCount > 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgetStatus.map((budget) => (
          <div key={budget.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {budget.status === 'exceeded' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                {budget.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                {budget.status === 'ok' && <CheckCircle className="h-4 w-4 text-green-500" />}
                <span className="font-medium text-sm">{budget.category}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatAmount(budget.spent)} / {formatAmount(budget.monthly_limit)}
              </span>
            </div>
            <Progress 
              value={budget.percentage} 
              className={cn(
                "h-2",
                budget.status === 'exceeded' && "[&>div]:bg-red-500",
                budget.status === 'warning' && "[&>div]:bg-amber-500",
                budget.status === 'ok' && "[&>div]:bg-green-500"
              )}
            />
            <p className={cn(
              "text-xs",
              budget.status === 'exceeded' ? "text-red-500" : 
              budget.status === 'warning' ? "text-amber-500" : 
              "text-muted-foreground"
            )}>
              {budget.remaining >= 0 
                ? `${formatAmount(budget.remaining)} remaining`
                : `${formatAmount(Math.abs(budget.remaining))} over budget`
              }
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
