import { Bell, LogOut, User, Moon, Sun, Settings, KeyRound, AlertTriangle, Wallet, Clock, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useBudgets } from '@/hooks/useBudgets';
import { useExpenses } from '@/hooks/useExpenses';
import { useTasks } from '@/hooks/useTasks';
import { useCurrency } from '@/contexts/CurrencyContext';
import { isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode;
}

interface BudgetAlert {
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'exceeded' | 'warning';
}

interface TaskAlert {
  id: string;
  title: string;
  dueDate: string;
  status: 'overdue' | 'today' | 'tomorrow';
  daysOverdue?: number;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const { budgets } = useBudgets();
  const { expenses } = useExpenses();
  const { tasks } = useTasks();
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

  // Calculate task alerts (overdue, due today, due tomorrow)
  const taskAlerts: TaskAlert[] = tasks
    .filter(task => task.status !== 'completed' && task.due_date)
    .map(task => {
      const dueDate = new Date(task.due_date!);
      
      if (isPast(dueDate) && !isToday(dueDate)) {
        const daysOverdue = Math.abs(differenceInDays(dueDate, now));
        return { id: task.id, title: task.title, dueDate: task.due_date!, status: 'overdue' as const, daysOverdue } as TaskAlert;
      }
      if (isToday(dueDate)) {
        return { id: task.id, title: task.title, dueDate: task.due_date!, status: 'today' as const } as TaskAlert;
      }
      if (isTomorrow(dueDate)) {
        return { id: task.id, title: task.title, dueDate: task.due_date!, status: 'tomorrow' as const } as TaskAlert;
      }
      return null;
    })
    .filter((alert): alert is TaskAlert => alert !== null)
    .sort((a, b) => {
      const order = { overdue: 0, today: 1, tomorrow: 2 };
      return order[a.status] - order[b.status];
    });

  const totalAlerts = budgetAlerts.length + taskAlerts.length;
  const hasUrgentAlerts = budgetAlerts.some(a => a.status === 'exceeded') || taskAlerts.some(a => a.status === 'overdue');

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

          {/* Notification Bell with Alerts */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {totalAlerts > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground ${hasUrgentAlerts ? 'bg-destructive' : 'bg-primary'}`}>
                    {totalAlerts}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <Tabs defaultValue="tasks" className="w-full">
                <div className="p-3 border-b border-border">
                  <h3 className="font-semibold text-foreground mb-2">Notifications</h3>
                  <TabsList className="w-full">
                    <TabsTrigger value="tasks" className="flex-1 text-xs">
                      Tasks {taskAlerts.length > 0 && `(${taskAlerts.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="budgets" className="flex-1 text-xs">
                      Budgets {budgetAlerts.length > 0 && `(${budgetAlerts.length})`}
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="tasks" className="m-0">
                  <div className="max-h-64 overflow-y-auto">
                    {taskAlerts.length > 0 ? (
                      taskAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                            alert.status === 'overdue' ? 'bg-destructive/5' : 
                            alert.status === 'today' ? 'bg-yellow-500/5' : 'bg-orange-500/5'
                          }`}
                          onClick={() => navigate('/tasks')}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                              alert.status === 'overdue' ? 'bg-destructive/10' : 
                              alert.status === 'today' ? 'bg-yellow-500/10' : 'bg-orange-500/10'
                            }`}>
                              {alert.status === 'overdue' ? (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              ) : (
                                <Clock className={`h-4 w-4 ${alert.status === 'today' ? 'text-yellow-600' : 'text-orange-600'}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {alert.title}
                              </p>
                              <p className={`text-xs mt-0.5 ${
                                alert.status === 'overdue' ? 'text-destructive' : 
                                alert.status === 'today' ? 'text-yellow-600' : 'text-orange-600'
                              }`}>
                                {alert.status === 'overdue' 
                                  ? `${alert.daysOverdue} day${alert.daysOverdue !== 1 ? 's' : ''} overdue` 
                                  : alert.status === 'today' 
                                    ? 'Due today' 
                                    : 'Due tomorrow'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No task alerts</p>
                        <p className="text-xs mt-1">All tasks are on track!</p>
                      </div>
                    )}
                  </div>
                  {taskAlerts.length > 0 && (
                    <div className="p-2 border-t border-border">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => navigate('/tasks')}
                      >
                        View All Tasks
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="budgets" className="m-0">
                  <div className="max-h-64 overflow-y-auto">
                    {budgetAlerts.length > 0 ? (
                      budgetAlerts.map((alert) => (
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
                        <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
                </TabsContent>
              </Tabs>
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
