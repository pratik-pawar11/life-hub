import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LayoutDashboard, ListTodo, DollarSign, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrengthChecklist, checkPasswordStrength } from '@/components/auth/PasswordStrengthChecklist';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*]/, 'Password must contain a special character (!@#$%^&*)'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export function AuthPage() {
  const { user, loading } = useAuth();
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    displayName?: string;
  }>({});

  // Check if signup form is valid
  const isSignUpValid = useMemo(() => {
    const passwordStrong = checkPasswordStrength(password);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const emailValid = z.string().email().safeParse(email).success;
    const displayNameValid = displayName.length >= 2;
    return passwordStrong && passwordsMatch && emailValid && displayNameValid;
  }, [password, confirmPassword, email, displayName]);

  // Real-time password match validation
  const passwordMismatch = useMemo(() => {
    if (confirmPassword.length === 0) return false;
    return password !== confirmPassword;
  }, [password, confirmPassword]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const validateSignIn = () => {
    try {
      signInSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const validateSignUp = () => {
    try {
      signUpSchema.parse({ email, password, confirmPassword, displayName });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignIn()) return;
    
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.' 
          : error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    
    setIsSubmitting(true);
    const { error } = await signUp(email, password, displayName);
    setIsSubmitting(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Please sign in instead.';
      }
      toast({
        title: 'Sign up failed',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account created!',
        description: 'Please check your email to confirm your account, or sign in if email confirmation is disabled.',
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!z.string().email().safeParse(forgotPasswordEmail).success) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setForgotPasswordSent(true);
      toast({
        title: 'Email sent!',
        description: 'Check your inbox for the password reset link.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold gradient-text mb-4">
                Smart Life Manager
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Your personal productivity companion. Manage tasks, track expenses, and gain insights—all in one place.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-foreground/80">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ListTodo className="h-5 w-5 text-primary" />
                </div>
                <span>Organize tasks with smart tracking</span>
              </div>
              <div className="flex items-center gap-4 text-foreground/80">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <span>Track expenses by category</span>
              </div>
              <div className="flex items-center gap-4 text-foreground/80">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                </div>
                <span>Visualize your productivity</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-20 -right-10 w-60 h-60 rounded-full bg-primary/10 blur-2xl" />
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md glass-card border-border/50">
          {showForgotPassword ? (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                  {forgotPasswordSent ? 'Check Your Email' : 'Forgot Password'}
                </CardTitle>
                <CardDescription>
                  {forgotPasswordSent 
                    ? "We've sent you a password reset link"
                    : 'Enter your email to receive a reset link'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {forgotPasswordSent ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      If an account exists with <strong>{forgotPasswordEmail}</strong>, 
                      you will receive a password reset email shortly.
                    </p>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordSent(false);
                        setForgotPasswordEmail('');
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="input-glass"
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                    <Button 
                      type="button"
                      className="w-full" 
                      variant="ghost"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Button>
                  </form>
                )}
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-glass"
                          disabled={isSubmitting}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password">Password</Label>
                          <Button
                            type="button"
                            variant="link"
                            className="px-0 h-auto text-sm text-muted-foreground hover:text-primary"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <PasswordInput
                          id="signin-password"
                          value={password}
                          onChange={setPassword}
                          disabled={isSubmitting}
                        />
                        {errors.password && (
                          <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
              
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Display Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="input-glass"
                          disabled={isSubmitting}
                        />
                        {errors.displayName && (
                          <p className="text-sm text-destructive">{errors.displayName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-glass"
                          disabled={isSubmitting}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <PasswordInput
                          id="signup-password"
                          value={password}
                          onChange={setPassword}
                          disabled={isSubmitting}
                        />
                        <PasswordStrengthChecklist password={password} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                        <PasswordInput
                          id="signup-confirm-password"
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          disabled={isSubmitting}
                          hasError={passwordMismatch}
                        />
                        {passwordMismatch && (
                          <p className="text-sm text-destructive">Passwords don't match</p>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting || !isSignUpValid}
                        title={!isSignUpValid ? 'Please complete all password requirements and ensure passwords match' : undefined}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                      {!isSignUpValid && password.length > 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                          Complete all requirements above to create your account
                        </p>
                      )}
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
