import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
}

interface AnalysisResult {
  predictions: {
    nextMonthTotal: number;
    confidence: number;
    categoryBreakdown: Record<string, number>;
    trend: "increasing" | "decreasing" | "stable";
    percentageChange: number;
  };
  anomalies: Array<{
    id: string;
    date: string;
    amount: number;
    category: string;
    reason: string;
    severity: "low" | "medium" | "high";
    deviation: number;
  }>;
  insights: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user's expenses
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (expensesError) {
      console.error("Error fetching expenses:", expensesError);
      return new Response(JSON.stringify({ error: "Failed to fetch expenses" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!expenses || expenses.length === 0) {
      return new Response(JSON.stringify({
        predictions: {
          nextMonthTotal: 0,
          confidence: 0,
          categoryBreakdown: {},
          trend: "stable",
          percentageChange: 0,
        },
        anomalies: [],
        insights: ["Add more expenses to get predictions and anomaly detection."],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare data summary for AI
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    
    const recentExpenses = expenses.filter((e: Expense) => new Date(e.date) >= sixMonthsAgo);
    
    // Calculate monthly totals
    const monthlyTotals: Record<string, number> = {};
    const categoryTotals: Record<string, number[]> = {};
    
    recentExpenses.forEach((expense: Expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(expense.amount);
      
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = [];
      }
      categoryTotals[expense.category].push(Number(expense.amount));
    });

    // Calculate statistics for anomaly detection
    const allAmounts = recentExpenses.map((e: Expense) => Number(e.amount));
    const mean = allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length;
    const stdDev = Math.sqrt(
      allAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allAmounts.length
    );

    // Category averages
    const categoryStats: Record<string, { mean: number; stdDev: number }> = {};
    Object.entries(categoryTotals).forEach(([cat, amounts]) => {
      const catMean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const catStdDev = Math.sqrt(
        amounts.reduce((sum, val) => sum + Math.pow(val - catMean, 2), 0) / amounts.length
      );
      categoryStats[cat] = { mean: catMean, stdDev: catStdDev };
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Analyze this expense data and provide predictions and anomaly detection.

EXPENSE DATA:
- Total expenses in dataset: ${recentExpenses.length}
- Monthly totals (last 6 months): ${JSON.stringify(monthlyTotals)}
- Category statistics (mean, stdDev): ${JSON.stringify(categoryStats)}
- Overall mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}
- Recent transactions (last 20): ${JSON.stringify(recentExpenses.slice(0, 20).map((e: Expense) => ({
  date: e.date,
  amount: e.amount,
  category: e.category,
  notes: e.notes
})))}

Based on this data, provide:
1. Predicted total spending for next month
2. Confidence level (0-100)
3. Predicted breakdown by category
4. Overall spending trend
5. Any anomalies (transactions that deviate significantly from patterns)
6. Key insights for the user

Focus on statistical patterns and provide actionable insights.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a financial data analyst AI. Analyze expense data and provide predictions and anomaly detection. Be precise with numbers and provide actionable insights.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_analysis",
              description: "Provide spending predictions and anomaly detection results",
              parameters: {
                type: "object",
                properties: {
                  predictions: {
                    type: "object",
                    properties: {
                      nextMonthTotal: { type: "number", description: "Predicted total spending for next month" },
                      confidence: { type: "number", description: "Confidence level 0-100" },
                      categoryBreakdown: {
                        type: "object",
                        description: "Predicted spending by category",
                        additionalProperties: { type: "number" },
                      },
                      trend: { type: "string", enum: ["increasing", "decreasing", "stable"] },
                      percentageChange: { type: "number", description: "Expected percentage change from last month" },
                    },
                    required: ["nextMonthTotal", "confidence", "categoryBreakdown", "trend", "percentageChange"],
                  },
                  anomalies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        date: { type: "string" },
                        amount: { type: "number" },
                        category: { type: "string" },
                        reason: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high"] },
                        deviation: { type: "number", description: "How many standard deviations from mean" },
                      },
                      required: ["date", "amount", "category", "reason", "severity", "deviation"],
                    },
                  },
                  insights: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key insights and recommendations",
                  },
                },
                required: ["predictions", "anomalies", "insights"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse));

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "provide_analysis") {
      console.error("Unexpected AI response format");
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis: AnalysisResult = JSON.parse(toolCall.function.arguments);

    // Add expense IDs to anomalies if they match
    analysis.anomalies = analysis.anomalies.map((anomaly) => {
      const matchingExpense = recentExpenses.find(
        (e: Expense) =>
          e.date === anomaly.date &&
          Number(e.amount) === anomaly.amount &&
          e.category === anomaly.category
      );
      return {
        ...anomaly,
        id: matchingExpense?.id || `anomaly-${anomaly.date}`,
      };
    });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-spending:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
