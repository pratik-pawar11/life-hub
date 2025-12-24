import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Expense } from '@/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, format } from 'date-fns';

interface ComparisonChartProps {
  expenses: Expense[];
}

export function ComparisonChart({ expenses }: ComparisonChartProps) {
  const { formatAmount } = useCurrency();

  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];

    // Get last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthExpenses = expenses.filter(e => {
        const date = parseISO(e.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const count = monthExpenses.length;

      months.push({
        month: format(monthDate, 'MMM'),
        fullMonth: format(monthDate, 'MMMM yyyy'),
        total,
        count,
        average: count > 0 ? total / count : 0,
      });
    }

    return months;
  }, [expenses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card px-4 py-3 text-sm">
          <p className="font-semibold text-foreground">{data.fullMonth}</p>
          <p className="text-muted-foreground">Total: {formatAmount(data.total)}</p>
          <p className="text-muted-foreground">Transactions: {data.count}</p>
          <p className="text-muted-foreground">Average: {formatAmount(data.average)}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate month-over-month changes
  const monthlyChanges = useMemo(() => {
    if (chartData.length < 2) return null;

    const current = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    const percentChange = previous.total > 0 
      ? ((current.total - previous.total) / previous.total) * 100 
      : current.total > 0 ? 100 : 0;

    return {
      current: current.total,
      previous: previous.total,
      change: percentChange,
      currentMonth: current.fullMonth,
      previousMonth: previous.fullMonth,
    };
  }, [chartData]);

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Monthly Comparison</h3>
        {monthlyChanges && (
          <div className="text-sm">
            <span className={monthlyChanges.change > 0 ? 'text-destructive' : monthlyChanges.change < 0 ? 'text-green-500' : 'text-muted-foreground'}>
              {monthlyChanges.change > 0 ? '↑' : monthlyChanges.change < 0 ? '↓' : '→'} 
              {Math.abs(monthlyChanges.change).toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-1">vs last month</span>
          </div>
        )}
      </div>

      {chartData.some(d => d.total > 0) ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => formatAmount(value)}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              <Legend />
              <Bar 
                dataKey="total" 
                name="Total Spending"
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center text-muted-foreground">
          <p>No expense data available</p>
        </div>
      )}

      {/* Summary Cards */}
      {monthlyChanges && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Month</div>
            <div className="text-xl font-bold">{formatAmount(monthlyChanges.current)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Previous Month</div>
            <div className="text-xl font-bold">{formatAmount(monthlyChanges.previous)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
