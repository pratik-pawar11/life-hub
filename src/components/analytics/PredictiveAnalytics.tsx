import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Brain, 
  Target,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SpendingPrediction } from '@/hooks/useSpendingAnalysis';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface PredictiveAnalyticsProps {
  predictions: SpendingPrediction | null;
  isLoading: boolean;
  onAnalyze: () => void;
  lastMonthTotal: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#22c55e',
  Travel: '#3b82f6',
  Rent: '#f59e0b',
  Shopping: '#ec4899',
  Others: '#8b5cf6',
};

export function PredictiveAnalytics({ 
  predictions, 
  isLoading, 
  onAnalyze,
  lastMonthTotal 
}: PredictiveAnalyticsProps) {
  const { formatAmount } = useCurrency();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-5 w-5 text-destructive" />;
      case 'decreasing':
        return <TrendingDown className="h-5 w-5 text-green-500" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-destructive';
      case 'decreasing':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const chartData = predictions
    ? Object.entries(predictions.categoryBreakdown).map(([category, amount]) => ({
        category,
        amount,
        color: CATEGORY_COLORS[category] || '#6b7280',
      }))
    : [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].payload.category}</p>
          <p className="text-primary">{formatAmount(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (!predictions && !isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Spending Predictions</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            Use AI to forecast next month's spending based on your historical patterns
          </p>
          <Button onClick={onAnalyze} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Predictions
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
          <p className="text-muted-foreground">Analyzing your spending patterns...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Next Month Forecast
            </CardTitle>
            <CardDescription>AI-powered spending predictions</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onAnalyze} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Prediction */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              Predicted Total
            </div>
            <div className="text-2xl font-bold">
              {formatAmount(predictions!.nextMonthTotal)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {getTrendIcon(predictions!.trend)}
              <span className={`text-sm font-medium ${getTrendColor(predictions!.trend)}`}>
                {predictions!.percentageChange > 0 ? '+' : ''}
                {predictions!.percentageChange.toFixed(1)}% vs last month
              </span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 border">
            <div className="text-sm text-muted-foreground mb-1">Last Month</div>
            <div className="text-xl font-semibold">{formatAmount(lastMonthTotal)}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              Baseline for prediction
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 border">
            <div className="text-sm text-muted-foreground mb-1">Confidence Level</div>
            <div className="text-xl font-semibold">{predictions!.confidence}%</div>
            <Progress value={predictions!.confidence} className="mt-3 h-2" />
          </div>
        </div>

        {/* Category Breakdown Chart */}
        {chartData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Predicted by Category</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trend Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Spending Trend:</span>
          <Badge 
            variant={
              predictions!.trend === 'increasing' ? 'destructive' : 
              predictions!.trend === 'decreasing' ? 'default' : 
              'secondary'
            }
            className="capitalize"
          >
            {predictions!.trend}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
