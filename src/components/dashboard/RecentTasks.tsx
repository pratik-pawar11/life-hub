import { Task } from '@/hooks/useTasks';
import { statusColors, statusLabels } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface RecentTasksProps {
  tasks: Task[];
}

export function RecentTasks({ tasks }: RecentTasksProps) {
  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Tasks</h3>
        <Link to="/tasks">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {recentTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-4 rounded-lg border border-border/50 bg-secondary/30 p-3 transition-all duration-200 hover:border-primary/30 hover:bg-secondary/50"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{task.title}</p>
              {task.due_date && (
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.due_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
            </div>
            <span className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              statusColors[task.status]
            )}>
              {statusLabels[task.status]}
            </span>
          </div>
        ))}

        {recentTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks yet. Create your first task!</p>
          </div>
        )}
      </div>
    </div>
  );
}
