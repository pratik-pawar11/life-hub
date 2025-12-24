import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Notification, NotificationPreferences, NotificationType } from '@/types';
import { useEffect, useCallback } from 'react';
import { differenceInHours, isToday, isPast, parseISO, format } from 'date-fns';

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const notificationsQuery = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Fetch notification preferences
  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no preferences exist, create default ones
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();
          
        if (insertError) throw insertError;
        return newData as NotificationPreferences;
      }
      
      return data as NotificationPreferences;
    },
    enabled: !!user,
  });

  // Create notification
  const createNotification = useMutation({
    mutationFn: async (notification: {
      task_id?: string | null;
      title: string;
      message: string;
      type: NotificationType;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Show toast for the notification
      toast({
        title: data.title,
        description: data.message,
      });
    },
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Update preferences
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.',
      });
    },
  });

  // Check and create reminders for due tasks
  const checkTaskReminders = useCallback(async () => {
    if (!user || !preferencesQuery.data) return;
    
    const preferences = preferencesQuery.data;
    
    // Fetch active tasks with due dates
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .is('archived_at', null)
      .not('due_date', 'is', null);
      
    if (error || !tasks) return;
    
    const now = new Date();
    
    for (const task of tasks) {
      if (!task.due_date) continue;
      
      const dueDate = parseISO(task.due_date);
      const dueDateWithTime = task.due_time 
        ? parseISO(`${task.due_date}T${task.due_time}`)
        : dueDate;
      
      // Check for overdue tasks
      if (preferences.overdue_alerts && isPast(dueDateWithTime) && !isToday(dueDate)) {
        // Check if we already sent an overdue notification recently
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('task_id', task.id)
          .eq('type', 'overdue')
          .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();
          
        if (!existingNotif) {
          await createNotification.mutateAsync({
            task_id: task.id,
            title: 'Task Overdue',
            message: `"${task.title}" was due ${format(dueDate, 'MMM d')}`,
            type: 'overdue',
          });
        }
      }
      
      // Check for 1 hour before reminder
      if (preferences.hour_before_reminder && task.due_time) {
        const hoursUntilDue = differenceInHours(dueDateWithTime, now);
        
        if (hoursUntilDue > 0 && hoursUntilDue <= 1) {
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('task_id', task.id)
            .eq('type', 'reminder')
            .gte('created_at', new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString())
            .maybeSingle();
            
          if (!existingNotif) {
            await createNotification.mutateAsync({
              task_id: task.id,
              title: 'Task Due Soon',
              message: `"${task.title}" is due in about 1 hour`,
              type: 'reminder',
            });
          }
        }
      }
    }
  }, [user, preferencesQuery.data, createNotification]);

  // Run reminder check periodically
  useEffect(() => {
    if (!user) return;
    
    // Check on mount
    const timeoutId = setTimeout(() => {
      checkTaskReminders();
    }, 5000);
    
    // Check every 15 minutes
    const intervalId = setInterval(() => {
      checkTaskReminders();
    }, 15 * 60 * 1000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [user, checkTaskReminders]);

  const unreadCount = notificationsQuery.data?.filter(n => !n.read).length ?? 0;

  return {
    notifications: notificationsQuery.data ?? [],
    preferences: preferencesQuery.data,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
  };
}
