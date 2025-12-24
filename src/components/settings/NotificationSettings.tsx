import { useNotifications } from '@/hooks/useNotifications';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Clock, AlertTriangle, Sun } from 'lucide-react';

export function NotificationSettings() {
  const { preferences, updatePreferences, isLoading } = useNotifications();

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Loading preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure when and how you receive task reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hour before reminder */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <Label htmlFor="hour-before" className="text-base">1 Hour Before Reminder</Label>
              <p className="text-sm text-muted-foreground">
                Get notified 1 hour before a task is due
              </p>
            </div>
          </div>
          <Switch
            id="hour-before"
            checked={preferences.hour_before_reminder}
            onCheckedChange={(checked) => 
              updatePreferences.mutate({ hour_before_reminder: checked })
            }
          />
        </div>

        {/* Morning reminder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-yellow-500" />
              <div>
                <Label htmlFor="morning-reminder" className="text-base">Morning Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Daily summary of tasks due today
                </p>
              </div>
            </div>
            <Switch
              id="morning-reminder"
              checked={preferences.morning_reminder}
              onCheckedChange={(checked) => 
                updatePreferences.mutate({ morning_reminder: checked })
              }
            />
          </div>
          
          {preferences.morning_reminder && (
            <div className="ml-8 flex items-center gap-3">
              <Label htmlFor="morning-time" className="text-sm">Time:</Label>
              <Input
                id="morning-time"
                type="time"
                value={preferences.morning_reminder_time?.slice(0, 5) || '08:00'}
                onChange={(e) => 
                  updatePreferences.mutate({ morning_reminder_time: `${e.target.value}:00` })
                }
                className="w-32"
              />
            </div>
          )}
        </div>

        {/* Overdue alerts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <Label htmlFor="overdue-alerts" className="text-base">Overdue Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when tasks become overdue
              </p>
            </div>
          </div>
          <Switch
            id="overdue-alerts"
            checked={preferences.overdue_alerts}
            onCheckedChange={(checked) => 
              updatePreferences.mutate({ overdue_alerts: checked })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
