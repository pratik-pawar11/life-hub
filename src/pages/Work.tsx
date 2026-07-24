import { useState, useMemo, DragEvent } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Plus, Search, X, Trash2, MessageSquare, ChevronRight, ChevronLeft, Send,
} from 'lucide-react';
import {
  useWorkBoard, formatTaskId, WorkTask, WorkStatus, WorkPriority,
} from '@/hooks/useWorkBoard';

const COLUMNS: { key: WorkStatus; label: string; accent: string }[] = [
  { key: 'todo', label: 'To do', accent: 'border-t-muted-foreground/40' },
  { key: 'in_progress', label: 'In progress', accent: 'border-t-primary' },
  { key: 'done', label: 'Done', accent: 'border-t-success' },
];

const PRIORITY_STYLES: Record<WorkPriority, string> = {
  high: 'bg-destructive/15 text-destructive border-destructive/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const ASSIGNEES = ['Unassigned', 'Alex', 'Priya', 'Jordan', 'Sam', 'Riley', 'Taylor'];

function fmtTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export function WorkPage() {
  const {
    tasks, comments, activity, isLoading,
    createTask, moveTask, deleteTask, addComment,
  } = useWorkBoard();

  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newOpen, setNewOpen] = useState(false);
  const [detail, setDetail] = useState<WorkTask | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter(t =>
      (q === '' || t.title.toLowerCase().includes(q) || formatTaskId(t.task_number).toLowerCase().includes(q)) &&
      (assigneeFilter === 'all' || t.assignee === assigneeFilter) &&
      (priorityFilter === 'all' || t.priority === priorityFilter),
    );
  }, [tasks, search, assigneeFilter, priorityFilter]);

  const commentsByTask = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of comments) m[c.task_id] = (m[c.task_id] || 0) + 1;
    return m;
  }, [comments]);

  const detailComments = useMemo(
    () => (detail ? comments.filter(c => c.task_id === detail.id) : []),
    [detail, comments],
  );

  const clearFilters = () => {
    setSearch(''); setAssigneeFilter('all'); setPriorityFilter('all');
  };

  const onDrop = (status: WorkStatus) => {
    if (!dragId) return;
    const t = tasks.find(x => x.id === dragId);
    if (t) moveTask.mutate({ task: t, to: status });
    setDragId(null);
  };

  return (
    <Layout title="Work" subtitle="Kanban board for corporate task management">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card/40 p-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 font-mono text-sm"
              />
            </div>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                {ASSIGNEES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" onClick={() => setNewOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> New task
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSidebarOpen(o => !o)}>
                {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                <span className="ml-1">Activity</span>
              </Button>
            </div>
          </div>

          {/* Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.key);
              return (
                <div
                  key={col.key}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => onDrop(col.key)}
                  className={cn(
                    'rounded-lg border border-border/60 bg-card/30 border-t-2 flex flex-col min-h-[400px]',
                    col.accent,
                  )}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold uppercase tracking-wide">{col.label}</span>
                      <Badge variant="secondary" className="font-mono text-xs">{colTasks.length}</Badge>
                    </div>
                  </div>
                  <div className="flex-1 p-2 space-y-2">
                    {isLoading ? (
                      <div className="text-xs text-muted-foreground p-4">Loading…</div>
                    ) : colTasks.length === 0 ? (
                      <div className="text-xs text-muted-foreground/70 p-4 text-center border border-dashed border-border/50 rounded-md">
                        Drop tasks here
                      </div>
                    ) : colTasks.map(task => (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={() => setDragId(task.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setDetail(task)}
                        className={cn(
                          'group cursor-pointer rounded-md border border-border/60 bg-card hover:border-primary/60 hover:shadow-md transition-all p-3 space-y-2',
                          dragId === task.id && 'opacity-50',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {formatTaskId(task.task_number)}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); deleteTask.mutate(task); }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                            aria-label="Delete task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h3 className="text-sm font-medium leading-snug">{task.title}</h3>
                        <div className="flex items-center justify-between pt-1">
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase', PRIORITY_STYLES[task.priority])}>
                            {task.priority}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {commentsByTask[task.id] ? (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {commentsByTask[task.id]}
                              </span>
                            ) : null}
                            <span className="truncate max-w-[80px]">{task.assignee}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity sidebar */}
        {sidebarOpen && (
          <aside className="w-72 shrink-0 rounded-lg border border-border/60 bg-card/40 flex flex-col max-h-[calc(100vh-9rem)] sticky top-4">
            <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide">Activity</span>
              <Badge variant="secondary" className="font-mono text-xs">{activity.length}</Badge>
            </div>
            <ScrollArea className="flex-1">
              <ul className="p-3 space-y-3">
                {activity.length === 0 && (
                  <li className="text-xs text-muted-foreground">No activity yet.</li>
                )}
                {activity.map(a => (
                  <li key={a.id} className="text-xs border-l-2 border-primary/40 pl-2">
                    <div className="text-foreground/90">{a.text}</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      {fmtTs(a.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </aside>
        )}
      </div>

      <NewTaskDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onSubmit={(v) => { createTask.mutate(v); setNewOpen(false); }}
      />

      <TaskDetail
        task={detail}
        comments={detailComments}
        onClose={() => setDetail(null)}
        onAddComment={(text) => detail && addComment.mutate({ task: detail, text })}
      />
    </Layout>
  );
}

function NewTaskDialog({
  open, onOpenChange, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (v: { title: string; assignee: string; priority: WorkPriority }) => void;
}) {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('Unassigned');
  const [priority, setPriority] = useState<WorkPriority>('medium');

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), assignee, priority });
    setTitle(''); setAssignee('Unassigned'); setPriority('medium');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Describe the work…" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Assignee</label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSIGNEES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as WorkPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDetail({
  task, comments, onClose, onAddComment,
}: {
  task: WorkTask | null;
  comments: { id: string; author: string; text: string; created_at: string }[];
  onClose: () => void;
  onAddComment: (text: string) => void;
}) {
  const [text, setText] = useState('');
  if (!task) return null;
  const statusLabel = { todo: 'To do', in_progress: 'In progress', done: 'Done' }[task.status];

  const send = () => {
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText('');
  };

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{formatTaskId(task.task_number)}</span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase', PRIORITY_STYLES[task.priority])}>
              {task.priority}
            </span>
          </div>
          <DialogTitle className="text-left">{task.title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 text-xs border-y border-border/50 py-3">
          <div><div className="text-muted-foreground uppercase tracking-wide mb-1">Assignee</div><div>{task.assignee}</div></div>
          <div><div className="text-muted-foreground uppercase tracking-wide mb-1">Column</div><div>{statusLabel}</div></div>
          <div><div className="text-muted-foreground uppercase tracking-wide mb-1">Created</div><div className="font-mono">{fmtTs(task.created_at)}</div></div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Comments</div>
          <ScrollArea className="max-h-52 pr-2">
            <ul className="space-y-2">
              {comments.length === 0 && <li className="text-xs text-muted-foreground">No comments yet.</li>}
              {comments.map(c => (
                <li key={c.id} className="rounded-md border border-border/50 bg-card/50 p-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{c.author}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{fmtTs(c.created_at)}</span>
                  </div>
                  <div className="text-sm mt-1">{c.text}</div>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <div className="flex items-center gap-2 mt-3">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment…"
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
            />
            <Button size="sm" onClick={send}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WorkPage;
