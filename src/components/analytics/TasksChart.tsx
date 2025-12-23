import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Task } from '@/hooks/useTasks';

interface TasksChartProps {
  tasks: Task[];
}

export function TasksChart({ tasks }: TasksChartProps) {
  const statusCounts = {
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  };

  const data = [
    { name: 'Completed', value: statusCounts.completed, color: '#10B981' },
    { name: 'Pending', value: statusCounts.pending, color: '#F59E0B' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card px-3 py-2 text-sm">
          <p className="font-medium text-foreground">{payload[0].payload.name}</p>
          <p className="text-muted-foreground">{payload[0].value} tasks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Tasks Overview</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
