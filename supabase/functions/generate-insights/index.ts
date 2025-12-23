import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
}

interface Budget {
  category: string;
  monthly_limit: number;
}

interface Insight {
  message: string;
  type: 'expense' | 'task' | 'budget';
  priority: 'info' | 'warning' | 'success';
  icon?: string;
  amounts?: number[]; // Raw amounts for client-side formatting
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    console.log("Generating insights for user:", user.id);

    // Fetch user data
    const [tasksResult, expensesResult, budgetsResult] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id),
      supabase.from("expenses").select("*").eq("user_id", user.id),
      supabase.from("budgets").select("*").eq("user_id", user.id),
    ]);

    const tasks: Task[] = tasksResult.data || [];
    const expenses: Expense[] = expensesResult.data || [];
    const budgets: Budget[] = budgetsResult.data || [];

    const insights: Insight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // ===== EXPENSE INSIGHTS =====
    
    // Calculate current month expenses by category
    const currentMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    const lastMonthCategoryTotals: Record<string, number> = {};

    currentMonthExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    lastMonthExpenses.forEach(e => {
      lastMonthCategoryTotals[e.category] = (lastMonthCategoryTotals[e.category] || 0) + e.amount;
    });

    // Highest spending category
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
      const [topCategory, amount] = sortedCategories[0];
      insights.push({
        message: `Your highest spending category this month is ${topCategory} ({amount})`,
        type: 'expense',
        priority: 'info',
        amounts: [amount],
      });
    }

    // Compare with last month
    for (const [category, currentAmount] of Object.entries(categoryTotals)) {
      const lastAmount = lastMonthCategoryTotals[category] || 0;
      if (lastAmount > 0) {
        const percentChange = ((currentAmount - lastAmount) / lastAmount) * 100;
        if (percentChange > 20) {
          insights.push({
            message: `You spent ${percentChange.toFixed(0)}% more on ${category} this month compared to last month`,
            type: 'expense',
            priority: 'warning',
          });
        } else if (percentChange < -20) {
          insights.push({
            message: `Great! You reduced ${category} spending by ${Math.abs(percentChange).toFixed(0)}% this month`,
            type: 'expense',
            priority: 'success',
          });
        }
      }
    }

    // ===== BUDGET ALERTS =====
    for (const budget of budgets) {
      const spent = categoryTotals[budget.category] || 0;
      const percentage = (spent / budget.monthly_limit) * 100;
      
      if (percentage >= 100) {
        insights.push({
          message: `⚠️ You've exceeded your ${budget.category} budget ({amount0} / {amount1})`,
          type: 'budget',
          priority: 'warning',
          amounts: [spent, budget.monthly_limit],
        });
      } else if (percentage >= 80) {
        insights.push({
          message: `You've used ${percentage.toFixed(0)}% of your ${budget.category} budget`,
          type: 'budget',
          priority: 'warning',
        });
      }
    }

    // ===== TASK INSIGHTS =====
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');

    if (tasks.length > 0) {
      const completionRate = (completedTasks.length / tasks.length) * 100;
      insights.push({
        message: `Your task completion rate is ${completionRate.toFixed(0)}% (${completedTasks.length}/${tasks.length} tasks)`,
        type: 'task',
        priority: completionRate >= 70 ? 'success' : 'info',
      });
    }

    // Tasks completed before due date
    const completedBeforeDue = completedTasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const completedDate = new Date(t.updated_at);
      return completedDate <= dueDate;
    });

    if (completedTasks.length > 0 && completedBeforeDue.length > 0) {
      const onTimeRate = (completedBeforeDue.length / completedTasks.length) * 100;
      if (onTimeRate >= 50) {
        insights.push({
          message: `You complete ${onTimeRate.toFixed(0)}% of tasks before their due date`,
          type: 'task',
          priority: 'success',
        });
      }
    }

    // Overdue tasks
    const overdueTasks = pendingTasks.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < now;
    });

    if (overdueTasks.length > 0) {
      insights.push({
        message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} that need attention`,
        type: 'task',
        priority: 'warning',
      });
    }

    // Task completion time patterns
    const completionHours = completedTasks.map(t => new Date(t.updated_at).getHours());
    if (completionHours.length >= 5) {
      const avgHour = completionHours.reduce((a, b) => a + b, 0) / completionHours.length;
      let timeOfDay = 'morning';
      if (avgHour >= 12 && avgHour < 17) timeOfDay = 'afternoon';
      else if (avgHour >= 17 && avgHour < 21) timeOfDay = 'evening';
      else if (avgHour >= 21 || avgHour < 5) timeOfDay = 'night';

      insights.push({
        message: `You tend to complete most tasks in the ${timeOfDay}`,
        type: 'task',
        priority: 'info',
      });
    }

    console.log(`Generated ${insights.length} insights`);

    return new Response(JSON.stringify({ insights }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
