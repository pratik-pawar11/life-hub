import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, ClipboardList } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { Expense } from '@/types';
import { toast } from 'sonner';

interface DataExportProps {
  tasks: Task[];
  expenses: Expense[];
}

export function DataExport({ tasks, expenses }: DataExportProps) {
  const exportToCSV = (data: Record<string, any>[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${filename} exported successfully`);
  };

  const exportTasks = () => {
    const taskData = tasks.map(task => ({
      Title: task.title,
      Description: task.description || '',
      Status: task.status,
      Priority: task.priority,
      Category: task.category,
      'Due Date': task.due_date || '',
      'Due Time': task.due_time || '',
      'Created At': new Date(task.created_at).toLocaleDateString(),
      'Archived At': task.archived_at ? new Date(task.archived_at).toLocaleDateString() : '',
    }));
    exportToCSV(taskData, 'tasks_report');
  };

  const exportExpenses = () => {
    const expenseData = expenses.map(expense => ({
      Category: expense.category,
      Amount: expense.amount,
      Date: expense.date,
      Notes: expense.notes || '',
      'Created At': new Date(expense.created_at).toLocaleDateString(),
    }));
    exportToCSV(expenseData, 'expenses_report');
  };

  const exportSummary = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const tasksByCategory = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summaryData = [
      { Metric: 'Total Tasks', Value: tasks.length },
      { Metric: 'Completed Tasks', Value: completedTasks },
      { Metric: 'Pending Tasks', Value: pendingTasks },
      { Metric: 'Completion Rate', Value: `${tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%` },
      { Metric: 'Total Expenses', Value: totalExpenses.toFixed(2) },
      { Metric: 'Average Expense', Value: expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : '0' },
      { Metric: 'Total Transactions', Value: expenses.length },
      { Metric: '---', Value: '---' },
      ...Object.entries(expensesByCategory).map(([cat, amount]) => ({
        Metric: `Expenses - ${cat}`,
        Value: amount.toFixed(2),
      })),
      { Metric: '---', Value: '---' },
      ...Object.entries(tasksByCategory).map(([cat, count]) => ({
        Metric: `Tasks - ${cat}`,
        Value: count,
      })),
    ];

    exportToCSV(summaryData, 'analytics_summary');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportTasks} className="gap-2 cursor-pointer">
          <ClipboardList className="h-4 w-4" />
          Export Tasks (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExpenses} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          Export Expenses (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportSummary} className="gap-2 cursor-pointer">
          <Download className="h-4 w-4" />
          Export Summary Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
