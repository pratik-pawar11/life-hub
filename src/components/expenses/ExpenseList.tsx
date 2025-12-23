import { Expense } from '@/hooks/useExpenses';
import { categoryColors, categoryLabels } from '@/lib/data';
import { Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  return (
    <div className="space-y-3">
      {expenses.map((expense, index) => (
        <div
          key={expense.id}
          className="glass-card-hover p-4 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${categoryColors[expense.category]}20` }}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: categoryColors[expense.category] }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: `${categoryColors[expense.category]}20`,
                    color: categoryColors[expense.category]
                  }}
                >
                  {categoryLabels[expense.category]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              {expense.notes && (
                <p className="mt-1 text-sm text-muted-foreground truncate">
                  {expense.notes}
                </p>
              )}
            </div>

            <p className="text-lg font-semibold text-foreground">
              ${Number(expense.amount).toFixed(2)}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(expense)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(expense.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {expenses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No expenses found</p>
          <p className="text-sm mt-1">Add an expense to start tracking</p>
        </div>
      )}
    </div>
  );
}
