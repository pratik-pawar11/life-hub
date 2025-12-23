import { ExpenseCategory, TaskStatus } from '@/types';

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
