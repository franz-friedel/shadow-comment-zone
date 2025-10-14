import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Coffee } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

const Auth = () => {
  // Email/password authentication only - Google sign-in removed
  const { user, loading, signUpWithEmail, signInWithEmail, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const pageTitle = useMemo(() => 'Sign in • Shadow Comments', []);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validatedData = authSchema.parse({
        email: formData.email,
        password: formData.password,
        name: isLogin ? undefined : formData.name,
      });

      if (isLogin) {
        const { error } = await signInWithEmail(validatedData.email, validatedData.password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have been signed in successfully.",
          });
        }
      } else {
        const { error } = await signUpWithEmail(
          validatedData.email,
          validatedData.password,
          validatedData.name
        );
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account.",
          });
        }
      }
    } catch (err: any) {
      if (err?.errors?.length) {
        toast({
          title: "Validation Error",
          description: err.errors[0]?.message || "Please check your input",
          variant: "destructive",
        });
      }
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
          <CardTitle className="text-2xl font-bold gradient-text">
            Shadow Comments
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to your account' : 'Create a new account'} to add comments to YouTube videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">
                terms of service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary hover:underline">
                privacy policy
              </a>
              .
            </p>
          </div>

          <div className="mt-6 text-center">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open('https://buymeacoffee.com/franzfriedel', '_blank')}
            >
              <Coffee className="mr-2 h-4 w-4" />
              Buy me a coffee
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;