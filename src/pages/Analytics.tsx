import { Layout } from '@/components/layout/Layout';
import { TasksChart } from '@/components/analytics/TasksChart';
import { ExpenseTrendChart } from '@/components/analytics/ExpenseTrendChart';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { Task, Expense } from '@/types';
import { Target, TrendingUp, Wallet, PieChart } from 'lucide-react';

interface AnalyticsPageProps {
  tasks: Task[];
  expenses: Expense[];
}

export function AnalyticsPage({ tasks, expenses }: AnalyticsPageProps) {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

  // Find top spending category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategory = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)[0];

  return (
    <Layout title="Analytics" subtitle="Insights into your productivity and spending">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Completion Rate"
            value={`${completionRate}%`}
            icon={<Target className="h-5 w-5" />}
            trend={{ value: completionRate, isPositive: completionRate >= 50 }}
            delay={0}
          />
          <StatCard
            title="Total Spending"
            value={`$${totalExpenses.toFixed(2)}`}
            icon={<Wallet className="h-5 w-5" />}
            delay={50}
          />
          <StatCard
            title="Avg. Transaction"
            value={`$${avgExpense.toFixed(2)}`}
            icon={<TrendingUp className="h-5 w-5" />}
            delay={100}
          />
          <StatCard
            title="Top Category"
            value={topCategory ? topCategory[0].charAt(0).toUpperCase() + topCategory[0].slice(1) : 'N/A'}
            icon={<PieChart className="h-5 w-5" />}
            delay={150}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TasksChart tasks={tasks} />
          <ExpenseChart expenses={expenses} />
        </div>

        {/* Expense Trend */}
        <ExpenseTrendChart expenses={expenses} />
      </div>
    </Layout>
  );
}
