# TaskFlow - Personal Task & Expense Manager

A modern full-stack web application for managing tasks and tracking expenses with advanced analytics capabilities.

## What is TaskFlow?

TaskFlow is a personal productivity app that combines:
- **Task Management** - Create, organize, and track your to-dos
- **Expense Tracking** - Monitor your spending and set budgets
- **Advanced Analytics** - Visualize data with interactive charts, statistical summaries, and exportable reports

---

## Features

### Tasks
- ✅ **Quick Add** - Type naturally like "Buy groceries tomorrow at 5pm high priority"
- 📊 **Priority Levels** - Low, Medium, High to organize what matters most
- 📁 **Categories** - Work, Personal, Health, Finance, Education, Shopping
- 📅 **Due Dates & Times** - Never miss a deadline
- 🔄 **Recurring Tasks** - Set tasks to repeat daily, weekly, or monthly
- 📦 **Archive** - Keep completed tasks for reference

### Expenses
- 💰 **Track Spending** - Log expenses with categories and notes
- 📈 **Budget Limits** - Set monthly limits per category
- ⚠️ **Budget Alerts** - Get warned when approaching or exceeding limits
- 🔄 **Recurring Expenses** - Track subscriptions and regular payments

### Analytics & Data Analysis
- 📊 **Statistical Summaries** - KPIs, averages, trends, and comparisons
- 📈 **Monthly Comparisons** - Month-over-month spending analysis
- 🥧 **Category Breakdown** - Pie charts with percentage distribution
- 📅 **Date Range Filtering** - Analyze data for specific time periods
- 📥 **CSV Export** - Download tasks, expenses, and summary reports
- 📉 **Trend Analysis** - Visualize patterns over time

### Notifications
- 🔔 **Task Reminders** - Get notified before tasks are due
- ⏰ **Morning Digest** - Optional daily reminder of tasks
- 🚨 **Overdue Alerts** - Never forget an overdue task
- 💸 **Budget Warnings** - Know when you're overspending

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Shadcn/ui | UI Components |
| Supabase | Database, Auth & Backend |
| React Query | Data Fetching & Caching |
| Recharts | Charts & Data Visualization |
| date-fns | Date Manipulation |
| Zod | Schema Validation |

---

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base components (buttons, cards, etc.)
│   ├── analytics/       # Data visualization components
│   │   ├── DataExport.tsx          # CSV export functionality
│   │   ├── StatisticalSummary.tsx  # KPIs and statistics
│   │   ├── ComparisonChart.tsx     # Month-over-month charts
│   │   ├── CategoryBreakdown.tsx   # Pie charts with breakdowns
│   │   ├── DateRangeFilter.tsx     # Date filtering
│   │   └── ExpenseTrendChart.tsx   # Trend visualization
│   ├── tasks/           # Task management components
│   ├── expenses/        # Expense tracking components
│   ├── notifications/   # Notification system
│   └── layout/          # Header, Sidebar, Layout
├── pages/               # Main app pages
├── hooks/               # Custom React hooks
│   ├── useAuth          # Authentication
│   ├── useTasks         # Task CRUD operations
│   ├── useExpenses      # Expense CRUD operations
│   └── useBudgets       # Budget management
├── contexts/            # React contexts (Theme, Currency)
├── lib/                 # Utilities and helpers
└── types/               # TypeScript type definitions
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `tasks` | User tasks with priority, category, due dates, archive support |
| `expenses` | Spending records with categories and recurring support |
| `budgets` | Monthly spending limits per category |
| `notifications` | In-app reminders and alerts |
| `notification_preferences` | User notification settings |
| `profiles` | User display names and avatars |
| `user_preferences` | Theme and currency settings |

All tables implement Row Level Security (RLS) for data isolation.

---

## Key Skills Demonstrated

### For Developer Roles
- React component architecture with custom hooks
- TypeScript for type-safe development
- State management with React Query
- Database design with Supabase
- Authentication and authorization
- Responsive UI with Tailwind CSS
- Form handling with React Hook Form + Zod

### For Data Analyst Roles
- Data visualization with Recharts
- Statistical analysis (averages, percentages, trends)
- Month-over-month comparisons
- Date range filtering and data slicing
- CSV data export functionality
- Category-based data aggregation
- KPI dashboard design

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd taskflow

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will open at `http://localhost:5173`

---

## License

This project is open source and available under the MIT License.

---

Made with ❤️
