import { Bell, LogOut, User, Moon, Sun, Settings, KeyRound, AlertTriangle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useBudgets } from '@/hooks/useBudgets';
import { useExpenses } from '@/hooks/useExpenses';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface BudgetAlert {
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'exceeded' | 'warning';
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const { budgets } = useBudgets();
  const { expenses } = useExpenses();
  const { formatAmount } = useCurrency();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Calculate budget alerts
  const now = new Date();
  const currentMonthExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate.getMonth() === now.getMonth() && 
           expenseDate.getFullYear() === now.getFullYear();
  });

  const spendingByCategory = currentMonthExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const budgetAlerts: BudgetAlert[] = budgets
    .map(budget => {
      const spent = spendingByCategory[budget.category] || 0;
      const percentage = (spent / budget.monthly_limit) * 100;
      
      if (percentage >= 100) {
        return { category: budget.category, spent, limit: budget.monthly_limit, percentage, status: 'exceeded' as const };
      } else if (percentage >= 80) {
        return { category: budget.category, spent, limit: budget.monthly_limit, percentage, status: 'warning' as const };
      }
      return null;
    })
    .filter((alert): alert is BudgetAlert => alert !== null)
    .sort((a, b) => b.percentage - a.percentage);

  const hasAlerts = budgetAlerts.length > 0;
  const exceededCount = budgetAlerts.filter(a => a.status === 'exceeded').length;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6 gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
          )}
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </Button>

          {/* Notification Bell with Budget Alerts */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {hasAlerts && (
                  <span className={`absolute -right-0.5 -top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground ${exceededCount > 0 ? 'bg-destructive' : 'bg-primary'}`}>
                    {budgetAlerts.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Budget Alerts</h3>
                <p className="text-xs text-muted-foreground">Notifications for this month</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {budgetAlerts.length > 0 ? (
                  budgetAlerts.map((alert, index) => (
                    <div
                      key={alert.category}
                      className={`p-3 border-b border-border last:border-b-0 ${
                        alert.status === 'exceeded' ? 'bg-destructive/5' : 'bg-yellow-500/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          alert.status === 'exceeded' ? 'bg-destructive/10' : 'bg-yellow-500/10'
                        }`}>
                          {alert.status === 'exceeded' ? (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Wallet className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {alert.status === 'exceeded' ? 'Budget Exceeded' : 'Budget Warning'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {alert.category}: {formatAmount(alert.spent)} of {formatAmount(alert.limit)} ({Math.round(alert.percentage)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No budget alerts</p>
                    <p className="text-xs mt-1">You're within all budget limits!</p>
                  </div>
                )}
              </div>
              {budgetAlerts.length > 0 && (
                <div className="p-2 border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => navigate('/settings')}
                  >
                    Manage Budgets
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Change Username
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {resolvedTheme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
