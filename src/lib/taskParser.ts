import { TaskPriority, TaskCategory } from '@/types';
import { addDays, format, parse, setHours, setMinutes } from 'date-fns';

interface ParsedTask {
  title: string;
  due_date: string | null;
  due_time: string | null;
  priority: TaskPriority;
  category: TaskCategory;
}

// Map for priority shortcuts
const priorityMap: Record<string, TaskPriority> = {
  '!low': 'low',
  '!l': 'low',
  '!medium': 'medium',
  '!med': 'medium',
  '!m': 'medium',
  '!high': 'high',
  '!h': 'high',
};

// Map for category shortcuts (case-insensitive)
const categoryMap: Record<string, TaskCategory> = {
  '#general': 'General',
  '#gen': 'General',
  '#work': 'Work',
  '#w': 'Work',
  '#personal': 'Personal',
  '#p': 'Personal',
  '#college': 'College',
  '#col': 'College',
  '#school': 'College',
  '#health': 'Health',
  '#h': 'Health',
  '#finance': 'Finance',
  '#fin': 'Finance',
  '#money': 'Finance',
  '#shopping': 'Shopping',
  '#shop': 'Shopping',
  '#travel': 'Travel',
  '#trip': 'Travel',
};

// Time patterns
const timePatterns = [
  /(\d{1,2}):(\d{2})\s*(am|pm)/i,  // 10:30pm, 2:00 AM
  /(\d{1,2})\s*(am|pm)/i,          // 10pm, 2 AM
  /(\d{1,2}):(\d{2})/,             // 14:30 (24-hour)
];

// Date patterns
const datePatterns: Array<{ pattern: RegExp; handler: (match: RegExpMatchArray) => Date | null }> = [
  {
    pattern: /\btoday\b/i,
    handler: () => new Date(),
  },
  {
    pattern: /\btomorrow\b/i,
    handler: () => addDays(new Date(), 1),
  },
  {
    pattern: /\bin\s+(\d+)\s+days?\b/i,
    handler: (match) => addDays(new Date(), parseInt(match[1])),
  },
  {
    pattern: /\bnext\s+week\b/i,
    handler: () => addDays(new Date(), 7),
  },
  {
    pattern: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,
    handler: (match) => {
      const month = parseInt(match[1]) - 1;
      const day = parseInt(match[2]);
      const year = match[3] ? (match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3])) : new Date().getFullYear();
      return new Date(year, month, day);
    },
  },
  {
    pattern: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/i,
    handler: (match) => {
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const month = months.indexOf(match[1].toLowerCase().slice(0, 3));
      const day = parseInt(match[2]);
      const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
      return new Date(year, month, day);
    },
  },
];

function parseTime(input: string): { time: string | null; remainingInput: string } {
  let remainingInput = input;
  
  for (const pattern of timePatterns) {
    const match = input.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const meridiem = match[3]?.toLowerCase();
      
      if (meridiem) {
        if (meridiem === 'pm' && hours !== 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
      }
      
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      remainingInput = input.replace(match[0], '').trim();
      
      return { time: timeStr, remainingInput };
    }
  }
  
  return { time: null, remainingInput };
}

function parseDate(input: string): { date: Date | null; remainingInput: string } {
  let remainingInput = input;
  
  for (const { pattern, handler } of datePatterns) {
    const match = input.match(pattern);
    if (match) {
      const date = handler(match);
      if (date) {
        remainingInput = input.replace(match[0], '').trim();
        return { date, remainingInput };
      }
    }
  }
  
  return { date: null, remainingInput };
}

function parsePriority(input: string): { priority: TaskPriority; remainingInput: string } {
  const lowerInput = input.toLowerCase();
  
  for (const [shortcut, priority] of Object.entries(priorityMap)) {
    const regex = new RegExp(`\\${shortcut}\\b`, 'i');
    if (regex.test(lowerInput)) {
      return {
        priority,
        remainingInput: input.replace(regex, '').trim(),
      };
    }
  }
  
  return { priority: 'medium', remainingInput: input };
}

function parseCategory(input: string): { category: TaskCategory; remainingInput: string } {
  const lowerInput = input.toLowerCase();
  
  for (const [shortcut, category] of Object.entries(categoryMap)) {
    if (lowerInput.includes(shortcut)) {
      return {
        category,
        remainingInput: input.replace(new RegExp(shortcut, 'i'), '').trim(),
      };
    }
  }
  
  return { category: 'General', remainingInput: input };
}

export function parseTaskInput(input: string): ParsedTask {
  let workingInput = input.trim();
  
  // Parse priority first
  const { priority, remainingInput: afterPriority } = parsePriority(workingInput);
  workingInput = afterPriority;
  
  // Parse category
  const { category, remainingInput: afterCategory } = parseCategory(workingInput);
  workingInput = afterCategory;
  
  // Parse time
  const { time, remainingInput: afterTime } = parseTime(workingInput);
  workingInput = afterTime;
  
  // Parse date
  const { date, remainingInput: afterDate } = parseDate(workingInput);
  workingInput = afterDate;
  
  // Clean up the title
  const title = workingInput
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    title: title || 'Untitled Task',
    due_date: date ? format(date, 'yyyy-MM-dd') : null,
    due_time: time,
    priority,
    category,
  };
}

// Helper to get parsing hints
export function getParsingHints(): string[] {
  return [
    'Dates: "today", "tomorrow", "next week", "in 3 days", "12/25", "Jan 15"',
    'Times: "10pm", "2:30pm", "14:00"',
    'Priority: "!high", "!medium", "!low"',
    'Category: "#work", "#personal", "#college", "#health", "#finance", "#shopping", "#travel"',
  ];
}
