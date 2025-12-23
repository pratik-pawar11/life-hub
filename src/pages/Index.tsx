import { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { TasksPage } from './Tasks';
import { ExpensesPage } from './Expenses';
import { AnalyticsPage } from './Analytics';
import { Task, Expense, TaskStatus } from '@/types';
import { initialTasks, initialExpenses } from '@/lib/data';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('lifemanager-tasks', initialTasks);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('lifemanager-expenses', initialExpenses);
  const { toast } = useToast();

  // Task handlers
  const handleAddTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
    toast({
      title: "Task created",
      description: `"${taskData.title}" has been added to your tasks.`,
    });
  }, [setTasks, toast]);

  const handleUpdateTask = useCallback((id: string, taskData: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...taskData } : task
    ));
    toast({
      title: "Task updated",
      description: "Your task has been updated successfully.",
    });
  }, [setTasks, toast]);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    toast({
      title: "Task deleted",
      description: "The task has been removed.",
      variant: "destructive",
    });
  }, [setTasks, toast]);

  const handleStatusChange = useCallback((id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, status } : task
    ));
  }, [setTasks]);

  // Expense handlers
  const handleAddExpense = useCallback((expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [...prev, newExpense]);
    toast({
      title: "Expense added",
      description: `$${expenseData.amount.toFixed(2)} expense has been recorded.`,
    });
  }, [setExpenses, toast]);

  const handleUpdateExpense = useCallback((id: string, expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, ...expenseData } : expense
    ));
    toast({
      title: "Expense updated",
      description: "Your expense has been updated successfully.",
    });
  }, [setExpenses, toast]);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    toast({
      title: "Expense deleted",
      description: "The expense has been removed.",
      variant: "destructive",
    });
  }, [setExpenses, toast]);

  return (
    <Routes>
      <Route path="/" element={<Dashboard tasks={tasks} expenses={expenses} />} />
      <Route 
        path="/tasks" 
        element={
          <TasksPage 
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        } 
      />
      <Route 
        path="/expenses" 
        element={
          <ExpensesPage 
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        } 
      />
      <Route path="/analytics" element={<AnalyticsPage tasks={tasks} expenses={expenses} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default Index;
