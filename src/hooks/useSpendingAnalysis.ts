import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SpendingPrediction {
  nextMonthTotal: number;
  confidence: number;
  categoryBreakdown: Record<string, number>;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
}

export interface SpendingAnomaly {
  id: string;
  date: string;
  amount: number;
  category: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  deviation: number;
}

export interface SpendingAnalysis {
  predictions: SpendingPrediction;
  anomalies: SpendingAnomaly[];
  insights: string[];
}

export function useSpendingAnalysis() {
  const [analysis, setAnalysis] = useState<SpendingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSpending = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-spending');

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      toast.success('Spending analysis complete');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze spending';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analysis,
    isLoading,
    error,
    analyzeSpending,
  };
}
