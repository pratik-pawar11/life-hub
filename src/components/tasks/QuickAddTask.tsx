import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseTaskInput, getParsingHints } from '@/lib/taskParser';
import { Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TaskInsert } from '@/hooks/useTasks';

interface QuickAddTaskProps {
  onAdd: (task: TaskInsert) => void;
  isLoading?: boolean;
}

export function QuickAddTask({ onAdd, isLoading }: QuickAddTaskProps) {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof parseTaskInput> | null>(null);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) {
      setPreview(parseTaskInput(value));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const parsed = parseTaskInput(input);
    onAdd({
      title: parsed.title,
      due_date: parsed.due_date,
      due_time: parsed.due_time,
      priority: parsed.priority,
      category: parsed.category,
      status: 'pending',
    });

    setInput('');
    setPreview(null);
  };

  const hints = getParsingHints();

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Zap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder='Quick add: "Submit report tomorrow 5pm #work !high"'
            className="pl-9 pr-10"
            disabled={isLoading}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  {hints.map((hint, i) => (
                    <p key={i}>{hint}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button type="submit" disabled={!input.trim() || isLoading}>
          Add
        </Button>
      </form>

      {preview && (
        <div className="flex flex-wrap gap-2 text-xs px-1">
          <span className="text-muted-foreground">Preview:</span>
          <span className="font-medium">{preview.title}</span>
          {preview.due_date && (
            <span className="text-primary">{preview.due_date}</span>
          )}
          {preview.due_time && (
            <span className="text-primary">{preview.due_time.slice(0, 5)}</span>
          )}
          <span
            className={cn(
              "px-1.5 rounded",
              preview.priority === 'high' && "bg-destructive/20 text-destructive",
              preview.priority === 'medium' && "bg-primary/20 text-primary",
              preview.priority === 'low' && "bg-muted text-muted-foreground"
            )}
          >
            {preview.priority}
          </span>
          <span className="bg-muted px-1.5 rounded">{preview.category}</span>
        </div>
      )}
    </div>
  );
}
