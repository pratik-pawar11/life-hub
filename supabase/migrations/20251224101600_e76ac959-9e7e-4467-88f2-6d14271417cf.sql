-- Add new columns to tasks table for archive, priority, category, and due time
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'General',
ADD COLUMN IF NOT EXISTS due_time time WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Add check constraint for priority values
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high'));

-- Add check constraint for category values
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_category_check CHECK (category IN ('General', 'Work', 'Personal', 'College', 'Health', 'Finance', 'Shopping', 'Travel'));

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'reminder',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add check constraint for notification type
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check CHECK (type IN ('reminder', 'overdue', 'morning_digest'));

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  hour_before_reminder BOOLEAN NOT NULL DEFAULT true,
  morning_reminder BOOLEAN NOT NULL DEFAULT true,
  morning_reminder_time TIME NOT NULL DEFAULT '08:00:00',
  overdue_alerts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification preferences
CREATE POLICY "Users can view their own notification preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster notification queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_tasks_archived ON public.tasks(user_id, archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_tasks_due_date_time ON public.tasks(due_date, due_time) WHERE archived_at IS NULL;