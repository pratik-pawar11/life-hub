import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTasks } from '@/components/dashboard/RecentTasks';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { Task, Expense } from '@/types';
import { CheckSquare, Clock, Wallet, TrendingUp } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  expenses: Expense[];
}

export function Dashboard({ tasks, expenses }: DashboardProps) {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate this month's expenses
  const now = new Date();
  const thisMonthExpenses = expenses
    .filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <Layout title="Dashboard" subtitle="Welcome back! Here's your overview.">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tasks"
            value={tasks.length}
            icon={<CheckSquare className="h-5 w-5" />}
            delay={0}
          />
          <StatCard
            title="Completed"
            value={completedTasks}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: completedTasks > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0, isPositive: true }}
            delay={50}
          />
          <StatCard
            title="Pending"
            value={pendingTasks}
            icon={<Clock className="h-5 w-5" />}
            delay={100}
          />
          <StatCard
            title="This Month"
            value={`$${thisMonthExpenses.toFixed(2)}`}
            icon={<Wallet className="h-5 w-5" />}
            delay={150}
          />
        </div>

        {/* Charts and Tasks */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTasks tasks={tasks} />
          <ExpenseChart expenses={expenses} />
        </div>
      </div>
    </Layout>
  );
}
