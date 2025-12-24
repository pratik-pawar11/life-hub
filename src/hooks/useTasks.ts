import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '@/types';

export type { Task };

export type TaskInsert = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
};

export type TaskUpdate = Partial<TaskInsert> & { archived_at?: string | null };

export function useTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Active tasks (not archived)
  const tasksQuery = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });

  // Archived tasks
  const archivedTasksQuery = useQuery({
    queryKey: ['tasks', 'archived', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });

  const addTask = useMutation({
    mutationFn: async (task: TaskInsert) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description || null,
          due_date: task.due_date || null,
          due_time: task.due_time || null,
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          category: task.category || 'General',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Task created',
        description: `"${data.title}" has been added to your tasks.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Task updated',
        description: 'Your task has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Task deleted',
        description: 'The task has been permanently removed.',
        variant: 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const archiveTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Task archived',
        description: 'The task has been moved to archive.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error archiving task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const restoreTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ archived_at: null, status: 'pending' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Task restored',
        description: 'The task has been restored to your active tasks.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error restoring task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      // If marking as completed, also archive the task
      const updates: TaskUpdate = { status };
      if (status === 'completed') {
        updates.archived_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (status === 'completed') {
        toast({
          title: 'Task completed',
          description: 'Great job! The task has been archived.',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    archivedTasks: archivedTasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    isLoadingArchived: archivedTasksQuery.isLoading,
    error: tasksQuery.error,
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
    restoreTask,
    updateStatus,
  };
}
