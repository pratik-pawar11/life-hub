import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { TaskList } from '@/components/tasks/TaskList';
import { ArchivedTaskList } from '@/components/tasks/ArchivedTaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { QuickAddTask } from '@/components/tasks/QuickAddTask';
import { useTasks } from '@/hooks/useTasks';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, Loader2, Archive } from 'lucide-react';

export function TasksPage() {
  const { 
    tasks, 
    archivedTasks,
    isLoading, 
    addTask, 
    updateTask, 
    archiveTask,
    restoreTask,
    deleteTask,
    updateStatus 
  } = useTasks();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  const filteredArchivedTasks = archivedTasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleSubmit = (taskData: { 
    title: string; 
    description: string | null; 
    due_date: string | null; 
    due_time: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    category: TaskCategory;
  }) => {
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, ...taskData });
    } else {
      addTask.mutate(taskData);
    }
    setEditingTask(null);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingTask(null);
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateStatus.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <Layout title="Tasks" subtitle="Manage your tasks and stay organized">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tasks" subtitle="Manage your tasks and stay organized">
      <div className="space-y-6">
        {/* Quick Add */}
        <QuickAddTask 
          onAdd={(task) => addTask.mutate(task)} 
          isLoading={addTask.isPending}
        />

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-input/50 border-border/50">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setIsFormOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Tabs for Active/Archived */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">
              Active ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archive ({archivedTasks.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            <TaskList
              tasks={filteredTasks}
              onEdit={handleEdit}
              onArchive={(id) => archiveTask.mutate(id)}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>
          
          <TabsContent value="archived" className="mt-4">
            <ArchivedTaskList
              tasks={filteredArchivedTasks}
              onRestore={(id) => restoreTask.mutate(id)}
              onDelete={(id) => deleteTask.mutate(id)}
            />
          </TabsContent>
        </Tabs>

        {/* Task Form Modal */}
        <TaskForm
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          onSubmit={handleSubmit}
          editingTask={editingTask}
        />
      </div>
    </Layout>
  );
}
