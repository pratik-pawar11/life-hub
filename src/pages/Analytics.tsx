import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { TasksChart } from '@/components/analytics/TasksChart';
import { ExpenseTrendChart } from '@/components/analytics/ExpenseTrendChart';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { StatisticalSummary } from '@/components/analytics/StatisticalSummary';
import { ComparisonChart } from '@/components/analytics/ComparisonChart';
import { CategoryBreakdown } from '@/components/analytics/CategoryBreakdown';
import { DataExport } from '@/components/analytics/DataExport';
import { DateRangeFilter, DateRange } from '@/components/analytics/DateRangeFilter';
import { PredictiveAnalytics } from '@/components/analytics/PredictiveAnalytics';
import { AnomalyDetection } from '@/components/analytics/AnomalyDetection';
import { useTasks } from '@/hooks/useTasks';
import { useExpenses } from '@/hooks/useExpenses';
import { useSpendingAnalysis } from '@/hooks/useSpendingAnalysis';
import { Loader2 } from 'lucide-react';
import { isWithinInterval, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function AnalyticsPage() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { analysis, isLoading: analysisLoading, analyzeSpending } = useSpendingAnalysis();
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const isLoading = tasksLoading || expensesLoading;

  // Calculate last month's total for predictions comparison
  const lastMonthTotal = useMemo(() => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const start = startOfMonth(lastMonth);
    const end = endOfMonth(lastMonth);
    
    return expenses
      .filter(e => {
        const date = parseISO(e.date);
        return isWithinInterval(date, { start, end });
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  // Filter data by date range
  const filteredTasks = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return tasks;
    
    return tasks.filter(task => {
      if (!task.due_date) return true; // Include tasks without due date
      const taskDate = parseISO(task.due_date);
      
      if (dateRange.from && dateRange.to) {
        return isWithinInterval(taskDate, { start: dateRange.from, end: dateRange.to });
      }
      if (dateRange.from) return taskDate >= dateRange.from;
      if (dateRange.to) return taskDate <= dateRange.to;
      return true;
    });
  }, [tasks, dateRange]);

  const filteredExpenses = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return expenses;
    
    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      
      if (dateRange.from && dateRange.to) {
        return isWithinInterval(expenseDate, { start: dateRange.from, end: dateRange.to });
      }
      if (dateRange.from) return expenseDate >= dateRange.from;
      if (dateRange.to) return expenseDate <= dateRange.to;
      return true;
    });
  }, [expenses, dateRange]);

  if (isLoading) {
    return (
      <Layout title="Analytics" subtitle="Insights into your productivity and spending">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics" subtitle="Insights into your productivity and spending">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          <DataExport tasks={filteredTasks} expenses={filteredExpenses} />
        </div>

        {/* Statistical Summary - Data Analyst Focus */}
        <StatisticalSummary tasks={filteredTasks} expenses={filteredExpenses} />

        {/* AI-Powered Analytics Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PredictiveAnalytics 
            predictions={analysis?.predictions || null}
            isLoading={analysisLoading}
            onAnalyze={analyzeSpending}
            lastMonthTotal={lastMonthTotal}
          />
          <AnomalyDetection 
            anomalies={analysis?.anomalies || null}
            insights={analysis?.insights || null}
            isLoading={analysisLoading}
            onAnalyze={analyzeSpending}
          />
        </div>

        {/* Monthly Comparison Chart */}
        <ComparisonChart expenses={expenses} />

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TasksChart tasks={filteredTasks} />
          <ExpenseChart expenses={filteredExpenses} />
        </div>

        {/* Category Breakdown with Pie Charts */}
        <CategoryBreakdown expenses={filteredExpenses} tasks={filteredTasks} />

        {/* Expense Trend */}
        <ExpenseTrendChart expenses={filteredExpenses} />
      </div>
    </Layout>
  );
}
