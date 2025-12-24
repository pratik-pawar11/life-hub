import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useBudgets } from '@/hooks/useBudgets';
import { useExpenses } from '@/hooks/useExpenses';
import { useTasks } from '@/hooks/useTasks';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Clock, Sun, Wallet, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { NotificationType } from '@/types';
import { useNavigate } from 'react-router-dom';

const notificationIcons: Record<NotificationType, typeof Bell> = {
  reminder: Clock,
  overdue: AlertTriangle,
  morning_digest: Sun,
};

const notificationColors: Record<NotificationType, string> = {
  reminder: 'text-primary',
  overdue: 'text-destructive',
  morning_digest: 'text-yellow-500',
};

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

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  
  const { budgets } = useBudgets();
  const { expenses } = useExpenses();
  const { tasks } = useTasks();
  const { formatAmount } = useCurrency();

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

  const totalAlerts = unreadCount + budgetAlerts.length + taskAlerts.length;
  const hasUrgentAlerts = budgetAlerts.some(a => a.status === 'exceeded') || 
                          taskAlerts.some(a => a.status === 'overdue') ||
                          notifications.some(n => !n.read && n.type === 'overdue');

  const handleNotificationClick = (id: string, read: boolean) => {
    if (!read) {
      markAsRead.mutate(id);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalAlerts > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center text-primary-foreground",
              hasUrgentAlerts ? "bg-destructive" : "bg-primary"
            )}>
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Tabs defaultValue="notifications" className="w-full">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                className="text-xs h-7"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="notifications" className="flex-1 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Reminders {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Tasks {taskAlerts.length > 0 && `(${taskAlerts.length})`}
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex-1 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Budgets {budgetAlerts.length > 0 && `(${budgetAlerts.length})`}
            </TabsTrigger>
          </TabsList>
          
          {/* Reminders/Notifications Tab */}
          <TabsContent value="notifications" className="m-0">
            <ScrollArea className="h-64">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.slice(0, 10).map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 hover:bg-muted/50 transition-colors cursor-pointer group",
                          !notification.read && "bg-primary/5"
                        )}
                        onClick={() => handleNotificationClick(notification.id, notification.read)}
                      >
                        <div className="flex gap-3">
                          <div className={cn("mt-0.5", notificationColors[notification.type])}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                "text-sm",
                                !notification.read && "font-medium"
                              )}>
                                {notification.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification.mutate(notification.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          {/* Tasks Tab */}
          <TabsContent value="tasks" className="m-0">
            <ScrollArea className="h-64">
              {taskAlerts.length > 0 ? (
                <div className="divide-y divide-border">
                  {taskAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-3 cursor-pointer hover:bg-muted/50",
                        alert.status === 'overdue' ? 'bg-destructive/5' : 
                        alert.status === 'today' ? 'bg-yellow-500/5' : 'bg-orange-500/5'
                      )}
                      onClick={() => {
                        navigate('/tasks');
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          alert.status === 'overdue' ? 'bg-destructive/10' : 
                          alert.status === 'today' ? 'bg-yellow-500/10' : 'bg-orange-500/10'
                        )}>
                          {alert.status === 'overdue' ? (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Clock className={cn(
                              "h-4 w-4",
                              alert.status === 'today' ? 'text-yellow-600' : 'text-orange-600'
                            )} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {alert.title}
                          </p>
                          <p className={cn(
                            "text-xs mt-0.5",
                            alert.status === 'overdue' ? 'text-destructive' : 
                            alert.status === 'today' ? 'text-yellow-600' : 'text-orange-600'
                          )}>
                            {alert.status === 'overdue' 
                              ? `${alert.daysOverdue} day${alert.daysOverdue !== 1 ? 's' : ''} overdue` 
                              : alert.status === 'today' 
                                ? 'Due today' 
                                : 'Due tomorrow'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                  <CheckSquare className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No task alerts</p>
                  <p className="text-xs mt-1">All tasks are on track!</p>
                </div>
              )}
            </ScrollArea>
            {taskAlerts.length > 0 && (
              <div className="p-2 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => {
                    navigate('/tasks');
                    setOpen(false);
                  }}
                >
                  View All Tasks
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Budgets Tab */}
          <TabsContent value="budgets" className="m-0">
            <ScrollArea className="h-64">
              {budgetAlerts.length > 0 ? (
                <div className="divide-y divide-border">
                  {budgetAlerts.map((alert) => (
                    <div
                      key={alert.category}
                      className={cn(
                        "p-3",
                        alert.status === 'exceeded' ? 'bg-destructive/5' : 'bg-yellow-500/5'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          alert.status === 'exceeded' ? 'bg-destructive/10' : 'bg-yellow-500/10'
                        )}>
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
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                  <Wallet className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No budget alerts</p>
                  <p className="text-xs mt-1">You're within all budget limits!</p>
                </div>
              )}
            </ScrollArea>
            {budgetAlerts.length > 0 && (
              <div className="p-2 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => {
                    navigate('/expenses');
                    setOpen(false);
                  }}
                >
                  Manage Budgets
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
