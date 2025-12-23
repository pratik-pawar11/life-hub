import { useInsights, Insight } from '@/hooks/useInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InsightsCard() {
  const { insights, isLoading, refetch } = useInsights();

  const getIcon = (insight: Insight) => {
    if (insight.priority === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    if (insight.priority === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (insight.type === 'expense') return <TrendingUp className="h-4 w-4 text-blue-500" />;
    return <Lightbulb className="h-4 w-4 text-primary" />;
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      default:
        return 'bg-muted/50 border-border/50';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          Smart Insights
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => refetch()}
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add more tasks and expenses to get personalized insights!
          </p>
        ) : (
          insights.slice(0, 5).map((insight, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                getPriorityStyles(insight.priority)
              )}
            >
              <div className="mt-0.5">{getIcon(insight)}</div>
              <p className="text-sm">{insight.message}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
