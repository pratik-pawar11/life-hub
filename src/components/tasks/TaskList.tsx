import { Task, TaskStatus } from '@/types';
import { statusColors, statusLabels, priorityColors, priorityLabels, taskCategoryColors } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Calendar, Archive, Edit2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onArchive: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

function getTimeRemaining(dueDate: string) {
  const due = new Date(dueDate);
  const now = new Date();
  
  if (isPast(due) && !isToday(due)) {
    const daysOverdue = Math.abs(differenceInDays(due, now));
    return { text: `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`, status: 'overdue' as const };
  }
  
  if (isToday(due)) {
    return { text: 'Due today', status: 'today' as const };
  }
  
  if (isTomorrow(due)) {
    return { text: 'Due tomorrow', status: 'tomorrow' as const };
  }
  
  const days = differenceInDays(due, now);
  if (days <= 3) {
    return { text: `${days} day${days !== 1 ? 's' : ''} left`, status: 'soon' as const };
  }
  
  if (days <= 7) {
    return { text: `${days} days left`, status: 'upcoming' as const };
  }
  
  return { text: `${days} days left`, status: 'normal' as const };
}

export function TaskList({ tasks, onEdit, onArchive, onStatusChange }: TaskListProps) {
  const getNextStatus = (currentStatus: TaskStatus): TaskStatus => {
    return currentStatus === 'pending' ? 'completed' : 'pending';
  };

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => {
        const timeInfo = task.due_date && task.status !== 'completed' 
          ? getTimeRemaining(task.due_date) 
          : null;
        
        return (
          <div
            key={task.id}
            className={cn(
              "glass-card-hover p-4 animate-slide-up",
              timeInfo?.status === 'overdue' && "border-destructive/50 bg-destructive/5"
            )}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={cn(
                    "font-medium text-foreground",
                    task.status === 'completed' && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </h3>
                  
                  {/* Priority badge */}
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                    priorityColors[task.priority]
                  )}>
                    {priorityLabels[task.priority]}
                  </span>
                  
                  {/* Category badge */}
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    taskCategoryColors[task.category]
                  )}>
                    {task.category}
                  </span>
                </div>
                
                {task.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                {task.due_date && (
                  <div className="mt-2 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(task.due_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                        {task.due_time && ` at ${task.due_time.slice(0, 5)}`}
                      </span>
                    </div>
                    
                    {timeInfo && task.status !== 'completed' && (
                      <div className={cn(
                        "flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
                        timeInfo.status === 'overdue' && "bg-destructive/10 text-destructive",
                        timeInfo.status === 'today' && "bg-yellow-500/10 text-yellow-600",
                        timeInfo.status === 'tomorrow' && "bg-orange-500/10 text-orange-600",
                        timeInfo.status === 'soon' && "bg-primary/10 text-primary",
                        timeInfo.status === 'upcoming' && "bg-muted text-muted-foreground",
                        timeInfo.status === 'normal' && "bg-muted text-muted-foreground"
                      )}>
                        {timeInfo.status === 'overdue' ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {timeInfo.text}
                      </div>
                    )}
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
                  onClick={() => onArchive(task.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-muted-foreground/80"
                  title="Archive task"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No tasks found</p>
          <p className="text-sm mt-1">Create a new task to get started</p>
        </div>
      )}
    </div>
  );
}
