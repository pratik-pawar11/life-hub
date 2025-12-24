import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { BudgetPanel } from '@/components/expenses/BudgetPanel';
import { useExpenses, Expense } from '@/hooks/useExpenses';
import { ExpenseCategory } from '@/types';
import { categoryLabels } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';

const categories: ExpenseCategory[] = ['Food', 'Travel', 'Rent', 'Shopping', 'Others'];

export function ExpensesPage() {
  const { expenses, isLoading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { formatAmount } = useCurrency();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch = expense.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesSearch || (searchQuery === '' && matchesCategory);
    })
    .filter(expense => categoryFilter === 'all' || expense.category === categoryFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleSubmit = (expenseData: { amount: number; category: ExpenseCategory; date: string; notes: string | null }) => {
    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, ...expenseData });
    } else {
      addExpense.mutate(expenseData);
    }
    setEditingExpense(null);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingExpense(null);
  };

  const handleDelete = (id: string) => {
    deleteExpense.mutate(id);
  };

  if (isLoading) {
    return (
      <Layout title="Expenses" subtitle="Track and manage your spending">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

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
                {formatAmount(totalFiltered)}
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
          onDelete={handleDelete}
        />

        {/* Budget Panel - Full Width at Bottom */}
        <BudgetPanel />

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
