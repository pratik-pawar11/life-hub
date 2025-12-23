import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Contains uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'Contains lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'Contains number',
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: 'special',
    label: 'Contains special character (!@#$%^&*)',
    test: (password) => /[!@#$%^&*]/.test(password),
  },
];

export function checkPasswordStrength(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password));
}

interface PasswordStrengthChecklistProps {
  password: string;
}

export function PasswordStrengthChecklist({ password }: PasswordStrengthChecklistProps) {
  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border/50">
      <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements:</p>
      <ul className="space-y-1.5">
        {passwordRules.map((rule) => {
          const isValid = rule.test(password);
          return (
            <li
              key={rule.id}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors duration-200',
                isValid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}
            >
              {isValid ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground/50" />
              )}
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
