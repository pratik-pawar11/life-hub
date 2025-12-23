-- Create budgets table for category-wise budget limits
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own budgets"
ON public.budgets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets"
ON public.budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
ON public.budgets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
ON public.budgets FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add recurring fields to tasks table
ALTER TABLE public.tasks
ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
ADD COLUMN recurrence_end_date DATE,
ADD COLUMN parent_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Add recurring fields to expenses table
ALTER TABLE public.expenses
ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
ADD COLUMN recurrence_end_date DATE,
ADD COLUMN parent_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL;

-- Create index for better search performance
CREATE INDEX idx_tasks_title_gin ON public.tasks USING gin(to_tsvector('english', title));
CREATE INDEX idx_tasks_description_gin ON public.tasks USING gin(to_tsvector('english', COALESCE(description, '')));
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_notes_gin ON public.expenses USING gin(to_tsvector('english', COALESCE(notes, '')));
CREATE INDEX idx_budgets_user_category ON public.budgets(user_id, category);