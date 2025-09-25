import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Chrome } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const { user, signInWithGoogle, loading, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pageTitle = useMemo(() => (tab === 'signin' ? 'Sign in' : 'Create account') + ' • Shadow Comments', [tab]);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    // Basic SEO for the auth page
    document.title = pageTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    const content = 'Sign in or create an account to add shadow comments to YouTube videos.';
    if (metaDesc) metaDesc.setAttribute('content', content);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = content;
      document.head.appendChild(m);
    }
  }, [pageTitle]);

  const handleEmailAuth = async (mode: 'signin' | 'signup') => {
    const e = emailSchema.safeParse(email);
    const p = passwordSchema.safeParse(password);
    if (!e.success || !p.success) {
      toast({
        title: 'Check your input',
        description: (!e.success ? e.error.issues[0].message : p.error.issues[0].message),
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        toast({ title: 'Signed in', description: 'Welcome back!' });
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link to finish sign up.',
        });
      }
    } catch (err: any) {
      const message = err?.message ?? 'Authentication failed. Please try again.';
      toast({ title: 'Authentication error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Shadow Comments
          </CardTitle>
          <CardDescription>
            Sign in to add comments to YouTube videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (err: any) {
                  toast({ title: 'Google sign-in failed', description: err?.message ?? 'Please try again.', variant: 'destructive' });
                }
              }}
              className="w-full"
              variant="outline"
              disabled={loading || submitting}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="text-center text-xs text-muted-foreground">or</div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as 'signin' | 'signup')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Email</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" onClick={() => handleEmailAuth('signin')} disabled={submitting}>
                  {submitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" onClick={() => handleEmailAuth('signup')} disabled={submitting}>
                  {submitting ? 'Creating account...' : 'Create account'}
                </Button>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
            <p className="text-[11px] text-muted-foreground/80 text-center">
              If Google sign-in fails with an "invalid_client" error, ensure the Google provider is configured
              in Supabase and the authorized redirect URI is set correctly in Google Cloud.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
