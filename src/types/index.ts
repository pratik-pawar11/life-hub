// Task types for Supabase
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
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
