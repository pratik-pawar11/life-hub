import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/hooks/useTasks';
import { Expense } from '@/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Calculator,
  Percent,
  Calendar
} from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';

interface StatisticalSummaryProps {
  tasks: Task[];
  expenses: Expense[];
}

export function StatisticalSummary({ tasks, expenses }: StatisticalSummaryProps) {
  const { formatAmount } = useCurrency();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Filter expenses by month
    const thisMonthExpenses = expenses.filter(e => {
      const date = parseISO(e.date);
      return isWithinInterval(date, { start: thisMonthStart, end: thisMonthEnd });
    });

    const lastMonthExpenses = expenses.filter(e => {
      const date = parseISO(e.date);
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
    });

    // Calculate totals
    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate change percentage
    const expenseChange = lastMonthTotal > 0 
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : thisMonthTotal > 0 ? 100 : 0;

    // Task statistics
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return parseISO(t.due_date) < now;
    }).length;

    // Expense statistics
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
    const maxExpense = expenses.length > 0 ? Math.max(...expenses.map(e => Number(e.amount))) : 0;
    const minExpense = expenses.length > 0 ? Math.min(...expenses.map(e => Number(e.amount))) : 0;

    // Category analysis
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const topExpenseCategory = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)[0];

    const tasksByCategory = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTaskCategory = Object.entries(tasksByCategory)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      thisMonthTotal,
      lastMonthTotal,
      expenseChange,
      completedTasks,
      pendingTasks,
      highPriorityTasks,
      overdueTasks,
      totalExpenses,
      avgExpense,
      maxExpense,
      minExpense,
      topExpenseCategory,
      topTaskCategory,
      completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
      totalTransactions: expenses.length,
      uniqueCategories: new Set(expenses.map(e => e.category)).size,
    };
  }, [tasks, expenses]);

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5" />
        Statistical Summary
      </h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Comparison */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.thisMonthTotal)}</div>
            <div className="flex items-center gap-1 text-sm mt-1">
              {getTrendIcon(stats.expenseChange)}
              <span className={stats.expenseChange > 0 ? 'text-destructive' : stats.expenseChange < 0 ? 'text-green-500' : 'text-muted-foreground'}>
                {Math.abs(stats.expenseChange).toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">
              {stats.completedTasks} of {stats.completedTasks + stats.pendingTasks} tasks
            </div>
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Avg Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.avgExpense)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Range: {formatAmount(stats.minExpense)} - {formatAmount(stats.maxExpense)}
            </div>
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Priority Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.highPriorityTasks}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {stats.overdueTasks} overdue
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3 mt-4">
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Top Expense Category</div>
          <div className="text-lg font-semibold mt-1">
            {stats.topExpenseCategory ? stats.topExpenseCategory[0] : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.topExpenseCategory ? formatAmount(stats.topExpenseCategory[1]) : '-'}
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Most Active Category</div>
          <div className="text-lg font-semibold mt-1">
            {stats.topTaskCategory ? stats.topTaskCategory[0] : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.topTaskCategory ? `${stats.topTaskCategory[1]} tasks` : '-'}
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Transactions</div>
          <div className="text-lg font-semibold mt-1">{stats.totalTransactions}</div>
          <div className="text-sm text-muted-foreground">
            Across {stats.uniqueCategories} categories
          </div>
        </div>
      </div>
    </div>
  );
}
