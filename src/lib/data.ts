import { Task, Expense, ExpenseCategory } from '@/types';

// Initial mock data for tasks
export const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Complete project proposal',
    description: 'Draft and submit the Q1 project proposal document',
    dueDate: '2024-01-15',
    status: 'completed',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    title: 'Review budget allocations',
    description: 'Analyze and review the monthly budget allocations',
    dueDate: '2024-01-20',
    status: 'in_progress',
    createdAt: '2024-01-05',
  },
  {
    id: '3',
    title: 'Team meeting preparation',
    description: 'Prepare slides and agenda for the weekly team meeting',
    dueDate: '2024-01-18',
    status: 'pending',
    createdAt: '2024-01-10',
  },
  {
    id: '4',
    title: 'Update portfolio website',
    description: 'Add recent projects and update skills section',
    dueDate: '2024-01-25',
    status: 'pending',
    createdAt: '2024-01-12',
  },
  {
    id: '5',
    title: 'Learn TypeScript advanced patterns',
    description: 'Complete the advanced TypeScript course modules',
    dueDate: '2024-01-30',
    status: 'in_progress',
    createdAt: '2024-01-08',
  },
];

// Initial mock data for expenses
export const initialExpenses: Expense[] = [
  { id: '1', amount: 45.50, category: 'food', date: '2024-01-15', notes: 'Grocery shopping', createdAt: '2024-01-15' },
  { id: '2', amount: 120.00, category: 'utilities', date: '2024-01-10', notes: 'Electricity bill', createdAt: '2024-01-10' },
  { id: '3', amount: 35.00, category: 'travel', date: '2024-01-12', notes: 'Uber rides', createdAt: '2024-01-12' },
  { id: '4', amount: 89.99, category: 'shopping', date: '2024-01-08', notes: 'New headphones', createdAt: '2024-01-08' },
  { id: '5', amount: 1200.00, category: 'rent', date: '2024-01-01', notes: 'Monthly rent', createdAt: '2024-01-01' },
  { id: '6', amount: 25.00, category: 'entertainment', date: '2024-01-14', notes: 'Netflix + Spotify', createdAt: '2024-01-14' },
  { id: '7', amount: 62.30, category: 'food', date: '2024-01-13', notes: 'Restaurant dinner', createdAt: '2024-01-13' },
  { id: '8', amount: 150.00, category: 'shopping', date: '2024-01-05', notes: 'Winter jacket', createdAt: '2024-01-05' },
];

export const categoryColors: Record<ExpenseCategory, string> = {
  food: '#10B981',
  travel: '#3B82F6',
  rent: '#8B5CF6',
  shopping: '#F59E0B',
  entertainment: '#EC4899',
  utilities: '#06B6D4',
  other: '#6B7280',
};

export const categoryLabels: Record<ExpenseCategory, string> = {
  food: 'Food & Dining',
  travel: 'Travel',
  rent: 'Rent',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  utilities: 'Utilities',
  other: 'Other',
};

export const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  in_progress: 'bg-primary/20 text-primary border-primary/30',
  completed: 'bg-success/20 text-success border-success/30',
};

export const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};
