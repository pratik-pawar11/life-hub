# TaskFlow - Personal Task & Expense Manager

A modern web application to help you manage your daily tasks and track expenses in one place.

## What is TaskFlow?

TaskFlow is a personal productivity app that combines:
- **Task Management** - Create, organize, and track your to-dos
- **Expense Tracking** - Monitor your spending and set budgets
- **Analytics** - Visualize your productivity and spending patterns

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

### Notifications
- 🔔 **Task Reminders** - Get notified before tasks are due
- ⏰ **Morning Digest** - Optional daily reminder of tasks
- 🚨 **Overdue Alerts** - Never forget an overdue task
- 💸 **Budget Warnings** - Know when you're overspending

### Analytics
- 📊 **Task Completion Trends** - See your productivity over time
- 💹 **Expense Charts** - Visualize spending by category
- 🎯 **Insights** - AI-powered suggestions to improve

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React | UI Framework |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Shadcn/ui | UI Components |
| Supabase | Database & Auth |
| React Query | Data Fetching |
| Recharts | Charts & Graphs |

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

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # Base components (buttons, cards, etc.)
│   ├── tasks/       # Task-related components
│   ├── expenses/    # Expense-related components
│   ├── notifications/ # Notification components
│   └── layout/      # Header, Sidebar, Layout
├── pages/           # Main app pages
├── hooks/           # Custom React hooks
│   ├── useAuth      # Authentication
│   ├── useTasks     # Task operations
│   ├── useExpenses  # Expense operations
│   └── useBudgets   # Budget management
├── contexts/        # React contexts (Theme, Currency)
├── lib/             # Utilities and helpers
└── types/           # TypeScript type definitions
```

## How It Works

### Authentication
- Sign up with email and password
- Email verification required
- Password reset available

### Task Quick Add
Type natural phrases and the app understands:
- `"Meeting tomorrow at 2pm"` → Creates task due tomorrow at 2:00 PM
- `"Pay bills high priority"` → Creates high priority task
- `"Gym today health"` → Creates task in Health category

### Budget Tracking
1. Set a monthly budget for each expense category
2. Log expenses as you spend
3. Get alerts at 80% (warning) and 100% (exceeded)

## Customization

### Theme
- Light and Dark mode supported
- Toggle in the header or settings

### Currency
- Multiple currencies available
- Change in Settings page

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

---

Built with ❤️ using [Lovable](https://lovable.dev)
