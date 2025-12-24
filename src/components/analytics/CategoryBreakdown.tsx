import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Expense } from '@/types';
import { Task } from '@/hooks/useTasks';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { categoryColors } from '@/lib/data';

interface CategoryBreakdownProps {
  expenses: Expense[];
  tasks: Task[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(221, 83%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 65%, 60%)',
  'hsl(180, 70%, 45%)',
  'hsl(320, 70%, 50%)',
];

export function CategoryBreakdown({ expenses, tasks }: CategoryBreakdownProps) {
  const { formatAmount } = useCurrency();

  const expenseData = useMemo(() => {
    const byCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(byCategory).reduce((sum, val) => sum + val, 0);

    return Object.entries(byCategory)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const taskData = useMemo(() => {
    const byCategory = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(byCategory).reduce((sum, val) => sum + val, 0);

    return Object.entries(byCategory)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0,
        color: categoryColors[name as keyof typeof categoryColors] || COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [tasks]);

  const ExpenseTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card px-3 py-2 text-sm">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-muted-foreground">{formatAmount(data.value)}</p>
          <p className="text-muted-foreground">{data.percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  const TaskTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card px-3 py-2 text-sm">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-muted-foreground">{data.value} tasks</p>
          <p className="text-muted-foreground">{data.percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = (data: typeof expenseData, tooltipContent: any) => (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={tooltipContent} />
          <Legend 
            layout="vertical" 
            align="right" 
            verticalAlign="middle"
            formatter={(value, entry: any) => (
              <span className="text-foreground text-sm">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const renderTable = (data: typeof expenseData, isExpense: boolean) => (
    <div className="mt-4 space-y-2">
      {data.map((item, index) => (
        <div 
          key={item.name} 
          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium">{item.name}</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {isExpense ? formatAmount(item.value) : `${item.value} tasks`}
            </div>
            <div className="text-sm text-muted-foreground">{item.percentage}%</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
      
      <Tabs defaultValue="expenses">
        <TabsList className="mb-4">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          {expenseData.length > 0 ? (
            <>
              {renderPieChart(expenseData, <ExpenseTooltip />)}
              {renderTable(expenseData, true)}
            </>
          ) : (
            <div className="flex h-72 items-center justify-center text-muted-foreground">
              <p>No expense data available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          {taskData.length > 0 ? (
            <>
              {renderPieChart(taskData, <TaskTooltip />)}
              {renderTable(taskData, false)}
            </>
          ) : (
            <div className="flex h-72 items-center justify-center text-muted-foreground">
              <p>No task data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
