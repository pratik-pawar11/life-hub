import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useExpenses } from '@/hooks/useExpenses';
import { TwoFactorSettings } from '@/components/settings/TwoFactorSettings';
import { 
  User, 
  Lock, 
  Mail, 
  Moon, 
  Sun, 
  Monitor, 
  DollarSign,
  IndianRupee,
  Download,
  FileText,
  Table,
  Loader2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency, formatAmount } = useCurrency();
  const { expenses } = useExpenses();
  
  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Export state
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast({ title: 'Error', description: 'Display name cannot be empty', variant: 'destructive' });
      return;
    }
    
    setIsUpdatingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Display name updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    setIsChangingPassword(true);
    try {
      // First verify the current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });
      
      if (signInError) {
        toast({ title: 'Error', description: 'Current password is incorrect', variant: 'destructive' });
        return;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Password changed successfully. You will be logged out.' });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Log out after password change for security
      setTimeout(() => signOut(), 2000);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getFilteredExpenses = () => {
    let filtered = expenses || [];
    
    if (dateFrom) {
      filtered = filtered.filter(e => new Date(e.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(e => new Date(e.date) <= new Date(dateTo));
    }
    
    return filtered;
  };

  const handleExportCSV = () => {
    setIsExportingCSV(true);
    
    try {
      const filtered = getFilteredExpenses();
      
      const headers = ['Date', 'Category', 'Amount', 'Notes'];
      const rows = filtered.map(e => [
        e.date,
        e.category,
        e.amount.toString(),
        e.notes || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Success', description: 'CSV exported successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to export CSV', variant: 'destructive' });
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = () => {
    setIsExportingPDF(true);
    
    try {
      const filtered = getFilteredExpenses();
      
      // Calculate summary
      const total = filtered.reduce((sum, e) => sum + e.amount, 0);
      const categoryBreakdown = filtered.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);
      
      // Generate HTML for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Expense Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #14B8A6; border-bottom: 2px solid #14B8A6; padding-bottom: 10px; }
            .header { margin-bottom: 30px; }
            .meta { color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #14B8A6; color: white; }
            .summary { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .summary h3 { margin-top: 0; color: #14B8A6; }
            .total { font-size: 24px; font-weight: bold; color: #14B8A6; }
            .category-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Expense Analysis Report</h1>
            <p class="meta">
              <strong>User:</strong> ${user?.email}<br/>
              <strong>Date Range:</strong> ${dateFrom || 'All time'} to ${dateTo || 'Present'}<br/>
              <strong>Generated:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(e => `
                <tr>
                  <td>${e.date}</td>
                  <td>${e.category}</td>
                  <td>${formatAmount(e.amount)}</td>
                  <td>${e.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Category Summary</h3>
            ${Object.entries(categoryBreakdown).map(([cat, amount]) => `
              <div class="category-item">
                <span>${cat}</span>
                <span>${formatAmount(amount)}</span>
              </div>
            `).join('')}
            <hr style="margin: 20px 0;"/>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>Total Expenses</span>
              <span class="total">${formatAmount(total)}</span>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
      
      toast({ title: 'Success', description: 'PDF ready to print/save' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  const currencyOptions = [
    { value: 'INR', label: 'Indian Rupee (₹)', icon: IndianRupee },
    { value: 'USD', label: 'US Dollar ($)', icon: DollarSign },
  ] as const;

  return (
    <Layout title="Settings" subtitle="Manage your account preferences">
      <div className="space-y-6">
        {/* Profile Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Settings
            </CardTitle>
            <CardDescription>Manage your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
            </div>
            
            {/* Display Name */}
            <div className="space-y-2">
              <Label>Display Name</Label>
              <div className="flex gap-2">
                <Input 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="input-glass"
                />
                <Button 
                  onClick={handleUpdateDisplayName}
                  disabled={isUpdatingName}
                >
                  {isUpdatingName ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Change Password */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Change Password
              </Label>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="input-glass"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="input-glass"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="input-glass"
                  />
                </div>
                
                <Button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-fit"
                >
                  {isChangingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Change Password
                </Button>
                <p className="text-xs text-muted-foreground">
                  You will be logged out after changing your password for security
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <TwoFactorSettings />

        {/* Theme Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              Theme Settings
            </CardTitle>
            <CardDescription>Choose your preferred appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200",
                    theme === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <option.icon className="h-5 w-5" />
                  <span className="font-medium">{option.label}</span>
                  {theme === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              Currency Settings
            </CardTitle>
            <CardDescription>Set your preferred currency for expense display</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {currencyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCurrency(option.value)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200",
                    currency === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <option.icon className="h-5 w-5" />
                  <span className="font-medium">{option.label}</span>
                  {currency === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Example: {formatAmount(1234.56)}
            </p>
          </CardContent>
        </Card>

        {/* Export Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Expense Analysis Download
            </CardTitle>
            <CardDescription>Export your expense data for offline review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input 
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-glass"
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input 
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-glass"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleExportCSV}
                disabled={isExportingCSV}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isExportingCSV ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Table className="h-4 w-4" />
                )}
                Export as CSV
              </Button>
              
              <Button 
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="flex items-center gap-2"
              >
                {isExportingPDF ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Export as PDF
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>PDF includes:</strong> User info, date range, expense table, category breakdown, and total amount.</p>
              <p><strong>CSV includes:</strong> Date, Category, Amount, and Notes columns.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
