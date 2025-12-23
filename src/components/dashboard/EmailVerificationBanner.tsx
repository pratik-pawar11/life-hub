import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, X, Loader2 } from 'lucide-react';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Check if email is verified
  const isEmailVerified = user?.email_confirmed_at != null;

  // Don't show if verified or dismissed
  if (isEmailVerified || isDismissed || !user) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setIsResending(false);

    if (error) {
      toast({
        title: 'Failed to send email',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox and click the verification link.',
      });
    }
  };

  return (
    <Alert className="mb-6 border-amber-500/50 bg-amber-500/10 relative">
      <Mail className="h-4 w-4 text-amber-500" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3 pr-8">
        <span className="text-foreground">
          Please verify your email address to access all features.
        </span>
        <Button
          size="sm"
          variant="outline"
          className="w-fit border-amber-500/50 hover:bg-amber-500/20"
          onClick={handleResendVerification}
          disabled={isResending}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Sending...
            </>
          ) : (
            'Resend verification email'
          )}
        </Button>
      </AlertDescription>
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={() => setIsDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
