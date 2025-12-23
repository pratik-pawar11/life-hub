import { Task } from '@/hooks/useTasks';
import { statusColors, statusLabels } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Calendar, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskStatus } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export function TaskList({ tasks, onEdit, onDelete, onStatusChange }: TaskListProps) {
  const getNextStatus = (currentStatus: TaskStatus): TaskStatus => {
    return currentStatus === 'pending' ? 'completed' : 'pending';
  };

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="glass-card-hover p-4 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => onStatusChange(task.id, getNextStatus(task.status))}
              className={cn(
                "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                task.status === 'completed'
                  ? "border-success bg-success text-success-foreground"
                  : "border-border hover:border-primary"
              )}
            >
              {task.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className={cn(
                  "font-medium text-foreground",
                  task.status === 'completed' && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h3>
                <span className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  statusColors[task.status]
                )}>
                  {statusLabels[task.status]}
                </span>
              </div>
              
              {task.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}
              
              {task.due_date && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Due {new Date(task.due_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(task.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No tasks found</p>
          <p className="text-sm mt-1">Create a new task to get started</p>
        </div>
      )}
    </div>
  );
}
