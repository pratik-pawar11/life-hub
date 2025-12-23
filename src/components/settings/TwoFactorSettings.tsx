import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Factor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: 'verified' | 'unverified';
}

export function TwoFactorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [factors, setFactors] = useState<Factor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  
  // Enrollment state
  const [enrollmentData, setEnrollmentData] = useState<{
    id: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const fetchFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data.totp || []);
    } catch (error: any) {
      console.error('Error fetching MFA factors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const has2FAEnabled = factors.some(f => f.status === 'verified');

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });
      
      if (error) throw error;
      
      setEnrollmentData({
        id: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start 2FA enrollment',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (!enrollmentData || verificationCode.length !== 6) return;
    
    setIsVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.id,
      });
      
      if (challengeError) throw challengeError;
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.id,
        challengeId: challengeData.id,
        code: verificationCode,
      });
      
      if (verifyError) throw verifyError;
      
      toast({
        title: 'Success!',
        description: 'Two-factor authentication has been enabled',
      });
      
      setEnrollmentData(null);
      setVerificationCode('');
      fetchFactors();
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async (factorId: string) => {
    setIsDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Disabled',
        description: 'Two-factor authentication has been disabled',
      });
      
      fetchFactors();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable 2FA',
        variant: 'destructive',
      });
    } finally {
      setIsDisabling(false);
    }
  };

  const handleCancelEnrollment = async () => {
    if (enrollmentData) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: enrollmentData.id });
      } catch (error) {
        // Ignore error on cancel
      }
    }
    setEnrollmentData(null);
    setVerificationCode('');
  };

  const copySecret = () => {
    if (enrollmentData?.secret) {
      navigator.clipboard.writeText(enrollmentData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Display */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          {has2FAEnabled ? (
            <>
              <div className="p-2 rounded-full bg-green-500/10">
                <ShieldCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-green-600 dark:text-green-400">2FA is enabled</p>
                <p className="text-sm text-muted-foreground">Your account is protected with an authenticator app</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-full bg-amber-500/10">
                <ShieldOff className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-amber-600 dark:text-amber-400">2FA is not enabled</p>
                <p className="text-sm text-muted-foreground">Enable 2FA to secure your account</p>
              </div>
            </>
          )}
        </div>

        {/* Enrollment Flow */}
        {enrollmentData ? (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) then enter the 6-digit code below.
              </AlertDescription>
            </Alert>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg">
                <img 
                  src={enrollmentData.qr} 
                  alt="2FA QR Code" 
                  className="w-48 h-48"
                />
              </div>
              
              {/* Manual Entry Secret */}
              <div className="w-full max-w-md space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Can't scan? Enter this code manually:
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={enrollmentData.secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copySecret}
                  >
                    {copiedSecret ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Verification Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enter 6-digit code from your app</Label>
                <Input 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="input-glass text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleVerify}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCancelEnrollment}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Existing Factors */}
            {factors.filter(f => f.status === 'verified').map((factor) => (
              <div 
                key={factor.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">{factor.friendly_name || 'Authenticator App'}</p>
                    <p className="text-sm text-muted-foreground">TOTP • Verified</p>
                  </div>
                </div>
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDisable(factor.id)}
                  disabled={isDisabling}
                >
                  {isDisabling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Disable'
                  )}
                </Button>
              </div>
            ))}

            {/* Enable Button */}
            {!has2FAEnabled && (
              <Button 
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="w-full"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Set up Two-Factor Authentication
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Two-factor authentication adds an extra layer of security by requiring a code from your authenticator app in addition to your password.
        </p>
      </CardContent>
    </Card>
  );
}
