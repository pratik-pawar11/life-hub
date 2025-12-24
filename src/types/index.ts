// Task types for Supabase
export type TaskStatus = 'pending' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'General' | 'Work' | 'Personal' | 'College' | 'Health' | 'Finance' | 'Shopping' | 'Travel';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

// For frontend display compatibility
export interface TaskDisplay {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
}

// Notification types
export type NotificationType = 'reminder' | 'overdue' | 'morning_digest';

export interface Notification {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  hour_before_reminder: boolean;
  morning_reminder: boolean;
  morning_reminder_time: string;
  overdue_alerts: boolean;
  created_at: string;
  updated_at: string;
}

// Expense types for Supabase
export type ExpenseCategory = 'Food' | 'Travel' | 'Rent' | 'Shopping' | 'Others';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// For frontend display compatibility
export interface ExpenseDisplay {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes: string;
  createdAt: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalExpenses: number;
  monthlyExpenses: number;
  expensesByCategory: Record<ExpenseCategory, number>;
}
