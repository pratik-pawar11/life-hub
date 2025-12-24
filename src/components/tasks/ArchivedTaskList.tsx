import { Task } from '@/types';
import { taskCategoryColors, priorityColors, priorityLabels } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Calendar, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface ArchivedTaskListProps {
  tasks: Task[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ArchivedTaskList({ tasks, onRestore, onDelete }: ArchivedTaskListProps) {
  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="glass-card p-4 animate-slide-up opacity-75"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-success bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-muted-foreground line-through">
                  {task.title}
                </h3>
                
                {/* Priority badge */}
                <span className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium opacity-60",
                  priorityColors[task.priority]
                )}>
                  {priorityLabels[task.priority]}
                </span>
                
                {/* Category badge */}
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium opacity-60",
                  taskCategoryColors[task.category]
                )}>
                  {task.category}
                </span>
              </div>
              
              {task.description && (
                <p className="mt-1 text-sm text-muted-foreground/60 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              <div className="mt-2 flex items-center gap-4 flex-wrap text-xs text-muted-foreground/60">
                {task.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Was due {format(new Date(task.due_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {task.archived_at && (
                  <span>
                    Archived {format(new Date(task.archived_at), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRestore(task.id)}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                title="Restore task"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Delete permanently"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task permanently?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The task "{task.title}" will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(task.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No archived tasks</p>
          <p className="text-sm mt-1">Completed tasks will appear here</p>
        </div>
      )}
    </div>
  );
}
