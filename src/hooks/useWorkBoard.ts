import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type WorkStatus = 'todo' | 'in_progress' | 'done';
export type WorkPriority = 'low' | 'medium' | 'high';

export interface WorkTask {
  id: string;
  task_number: number;
  title: string;
  assignee: string;
  priority: WorkPriority;
  status: WorkStatus;
  created_at: string;
}
export interface WorkComment {
  id: string;
  task_id: string;
  author: string;
  text: string;
  created_at: string;
}
export interface WorkActivity {
  id: string;
  task_id: string | null;
  text: string;
  created_at: string;
}

// The auto-generated Database types don't yet know about these tables,
// so we access them via an untyped client cast.
const db = supabase as any;

export function formatTaskId(n: number) {
  return `TASK-${String(n).padStart(3, '0')}`;
}

function authorName(user: any) {
  return (
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Unknown'
  );
}

export function useWorkBoard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const tasksQ = useQuery({
    queryKey: ['work_tasks'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('work_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WorkTask[];
    },
  });

  const commentsQ = useQuery({
    queryKey: ['work_comments'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('work_comments')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as WorkComment[];
    },
  });

  const activityQ = useQuery({
    queryKey: ['work_activity'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('work_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as WorkActivity[];
    },
  });

  const logActivity = async (task_id: string | null, text: string) => {
    await db.from('work_activity').insert({ task_id, text });
  };

  const createTask = useMutation({
    mutationFn: async (input: { title: string; assignee: string; priority: WorkPriority }) => {
      const { data, error } = await db
        .from('work_tasks')
        .insert({ ...input, status: 'todo', created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      await logActivity(data.id, `${authorName(user)} created ${formatTaskId(data.task_number)} "${data.title}"`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work_tasks'] });
      qc.invalidateQueries({ queryKey: ['work_activity'] });
      toast({ title: 'Task created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const moveTask = useMutation({
    mutationFn: async ({ task, to }: { task: WorkTask; to: WorkStatus }) => {
      if (task.status === to) return;
      const { error } = await db.from('work_tasks').update({ status: to }).eq('id', task.id);
      if (error) throw error;
      const label = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
      await logActivity(
        task.id,
        `${authorName(user)} moved ${formatTaskId(task.task_number)} from ${label[task.status]} to ${label[to]}`
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work_tasks'] });
      qc.invalidateQueries({ queryKey: ['work_activity'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (task: WorkTask) => {
      const { error } = await db.from('work_tasks').delete().eq('id', task.id);
      if (error) throw error;
      await logActivity(null, `${authorName(user)} deleted ${formatTaskId(task.task_number)} "${task.title}"`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work_tasks'] });
      qc.invalidateQueries({ queryKey: ['work_activity'] });
      toast({ title: 'Task deleted' });
    },
  });

  const addComment = useMutation({
    mutationFn: async ({ task, text }: { task: WorkTask; text: string }) => {
      const author = authorName(user);
      const { error } = await db
        .from('work_comments')
        .insert({ task_id: task.id, author, text });
      if (error) throw error;
      await logActivity(task.id, `${author} commented on ${formatTaskId(task.task_number)}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work_comments'] });
      qc.invalidateQueries({ queryKey: ['work_activity'] });
    },
  });

  return {
    tasks: tasksQ.data ?? [],
    comments: commentsQ.data ?? [],
    activity: activityQ.data ?? [],
    isLoading: tasksQ.isLoading,
    createTask,
    moveTask,
    deleteTask,
    addComment,
  };
}
