export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
}

export type ExpenseCategory = 'food' | 'travel' | 'rent' | 'shopping' | 'entertainment' | 'utilities' | 'other';

export interface Expense {
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
