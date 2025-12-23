import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { Expense, ExpenseCategory } from '@/types';
import { categoryLabels } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';

interface ExpensesPageProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (id: string, expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
}

const categories: ExpenseCategory[] = ['food', 'travel', 'rent', 'shopping', 'entertainment', 'utilities', 'other'];

export function ExpensesPage({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense }: ExpensesPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch = expense.notes.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleSubmit = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (editingExpense) {
      onUpdateExpense(editingExpense.id, expenseData);
    } else {
      onAddExpense(expenseData);
    }
    setEditingExpense(null);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingExpense(null);
  };

  return (
    <Layout title="Expenses" subtitle="Track and manage your spending">
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {categoryFilter === 'all' ? 'Total Expenses' : `${categoryLabels[categoryFilter as ExpenseCategory]} Expenses`}
              </p>
              <p className="text-3xl font-bold gradient-text">
                ${totalFiltered.toFixed(2)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'transaction' : 'transactions'}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 bg-input/50 border-border/50">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setIsFormOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Expense List */}
        <ExpenseList
          expenses={filteredExpenses}
          onEdit={handleEdit}
          onDelete={onDeleteExpense}
        />

        {/* Expense Form Modal */}
        <ExpenseForm
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          onSubmit={handleSubmit}
          editingExpense={editingExpense}
        />
      </div>
    </Layout>
  );
}
