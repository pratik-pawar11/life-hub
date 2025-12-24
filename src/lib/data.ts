import { ExpenseCategory, TaskStatus, TaskPriority, TaskCategory } from '@/types';

export const categoryColors: Record<ExpenseCategory, string> = {
  Food: '#10B981',
  Travel: '#3B82F6',
  Rent: '#8B5CF6',
  Shopping: '#F59E0B',
  Others: '#6B7280',
};

export const categoryLabels: Record<ExpenseCategory, string> = {
  Food: 'Food & Dining',
  Travel: 'Travel',
  Rent: 'Rent',
  Shopping: 'Shopping',
  Others: 'Other',
};

export const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  completed: 'bg-success/20 text-success border-success/30',
};

export const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
};

export const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-muted text-muted-foreground border-muted',
  medium: 'bg-primary/20 text-primary border-primary/30',
  high: 'bg-destructive/20 text-destructive border-destructive/30',
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const taskCategoryColors: Record<TaskCategory, string> = {
  General: 'bg-muted text-muted-foreground',
  Work: 'bg-blue-500/20 text-blue-600',
  Personal: 'bg-purple-500/20 text-purple-600',
  College: 'bg-green-500/20 text-green-600',
  Health: 'bg-red-500/20 text-red-600',
  Finance: 'bg-yellow-500/20 text-yellow-600',
  Shopping: 'bg-orange-500/20 text-orange-600',
  Travel: 'bg-cyan-500/20 text-cyan-600',
};

export const taskCategories: TaskCategory[] = [
  'General',
  'Work',
  'Personal',
  'College',
  'Health',
  'Finance',
  'Shopping',
  'Travel',
];
