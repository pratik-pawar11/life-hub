import { useState, useMemo } from 'react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useExpenses, Expense } from '@/hooks/useExpenses';

interface SearchResult {
  type: 'task' | 'expense';
  id: string;
  title: string;
  subtitle: string;
  data: Task | Expense;
}

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const { tasks } = useTasks();
  const { expenses } = useExpenses();

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const matchedResults: SearchResult[] = [];

    // Search tasks
    tasks.forEach((task) => {
      const titleMatch = task.title.toLowerCase().includes(searchTerm);
      const descMatch = task.description?.toLowerCase().includes(searchTerm);
      
      if (titleMatch || descMatch) {
        matchedResults.push({
          type: 'task',
          id: task.id,
          title: task.title,
          subtitle: task.status === 'completed' ? 'Completed' : `Due: ${task.due_date || 'No date'}`,
          data: task,
        });
      }
    });

    // Search expenses
    expenses.forEach((expense) => {
      const categoryMatch = expense.category.toLowerCase().includes(searchTerm);
      const notesMatch = expense.notes?.toLowerCase().includes(searchTerm);
      
      if (categoryMatch || notesMatch) {
        matchedResults.push({
          type: 'expense',
          id: expense.id,
          title: `${expense.category} - ₹${expense.amount}`,
          subtitle: expense.notes || expense.date,
          data: expense,
        });
      }
    });

    return matchedResults.slice(0, 10); // Limit to 10 results
  }, [query, tasks, expenses]);

  const taskResults = results.filter(r => r.type === 'task');
  const expenseResults = results.filter(r => r.type === 'expense');

  return {
    query,
    setQuery,
    results,
    taskResults,
    expenseResults,
    hasResults: results.length > 0,
  };
}
