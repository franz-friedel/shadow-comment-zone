import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Chrome } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Auth = () => {
  const { user, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);

  const pageTitle = useMemo(() => 'Sign in • Shadow Comments', []);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    // Basic SEO for the auth page
    document.title = pageTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    const content = 'Sign in with Google to add shadow comments to YouTube videos.';
    if (metaDesc) metaDesc.setAttribute('content', content);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = content;
      document.head.appendChild(m);
    }
  }, [pageTitle]);

  // Email/password auth removed – Google only.

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
            Sign in with Google to add comments to YouTube videos
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

            <p className="text-xs text-muted-foreground mt-4 text-center">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
            <p className="text-[11px] text-muted-foreground/80 text-center">
              If you see an "invalid_client" or a Google 403 error, configure the Google provider in Supabase and add
              https://zsfwcfysslyiemzzvwwg.supabase.co/auth/v1/callback as an authorized redirect URI in Google Cloud.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
