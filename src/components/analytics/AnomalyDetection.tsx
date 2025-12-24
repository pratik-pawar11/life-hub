import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info,
  ShieldAlert,
  Sparkles,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SpendingAnomaly } from '@/hooks/useSpendingAnalysis';
import { format, parseISO } from 'date-fns';

interface AnomalyDetectionProps {
  anomalies: SpendingAnomaly[] | null;
  insights: string[] | null;
  isLoading: boolean;
  onAnalyze: () => void;
}

export function AnomalyDetection({ 
  anomalies, 
  insights,
  isLoading, 
  onAnalyze 
}: AnomalyDetectionProps) {
  const { formatAmount } = useCurrency();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (!anomalies && !isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-amber-500/10 p-4 mb-4">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Anomaly Detection</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            AI-powered detection of unusual spending patterns and outliers
          </p>
          <Button onClick={onAnalyze} variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Detect Anomalies
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Scanning for unusual patterns...</p>
        </CardContent>
      </Card>
    );
  }

  const hasAnomalies = anomalies && anomalies.length > 0;
  const highSeverityCount = anomalies?.filter(a => a.severity === 'high').length || 0;
  const mediumSeverityCount = anomalies?.filter(a => a.severity === 'medium').length || 0;

  return (
    <div className="space-y-6">
      {/* Anomaly Detection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Anomaly Detection
              </CardTitle>
              <CardDescription>
                {hasAnomalies 
                  ? `Found ${anomalies.length} unusual transaction${anomalies.length > 1 ? 's' : ''}`
                  : 'No unusual patterns detected'
                }
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onAnalyze} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasAnomalies ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-3">
                {highSeverityCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {highSeverityCount} High
                  </Badge>
                )}
                {mediumSeverityCount > 0 && (
                  <Badge variant="default" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {mediumSeverityCount} Medium
                  </Badge>
                )}
              </div>

              {/* Anomaly List */}
              <div className="space-y-3">
                {anomalies.map((anomaly, index) => (
                  <div
                    key={anomaly.id || index}
                    className={`rounded-lg border p-4 ${getSeverityColor(anomaly.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getSeverityIcon(anomaly.severity)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {formatAmount(anomaly.amount)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {anomaly.category}
                            </Badge>
                          </div>
                          <p className="text-sm">{anomaly.reason}</p>
                          <p className="text-xs opacity-70">
                            {format(parseISO(anomaly.date), 'MMM d, yyyy')} • 
                            {anomaly.deviation.toFixed(1)}σ deviation
                          </p>
                        </div>
                      </div>
                      <Badge variant={getSeverityBadge(anomaly.severity) as any} className="capitalize shrink-0">
                        {anomaly.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="rounded-full bg-green-500/10 p-3 w-fit mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <p className="font-medium text-green-600">All Clear!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your spending patterns look normal
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights Card */}
      {insights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <Info className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
