import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let timeout: number;
    let poll: number;

    const finish = () => {
      if (redirected.current) return;
      redirected.current = true;
      navigate('/', { replace: true });
    };

    // Listen for session (most reliable)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) finish();
    });
    unsub = () => subscription.unsubscribe();

    // Fallback: direct fetch (covers race conditions)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) finish();
    });

    // Poll every 400ms for up to 5s
    poll = window.setInterval(async () => {
      if (redirected.current) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) finish();
    }, 400);

    // Hard timeout (redirect anyway)
    timeout = window.setTimeout(finish, 5000);

    return () => {
      if (unsub) unsub();
      clearTimeout(timeout);
      clearInterval(poll);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
      <div className="space-y-3 text-center">
        <div className="animate-pulse">Finishing sign-in...</div>
        <div className="text-xs opacity-70">If this takes too long, refresh the page.</div>
      </div>
    </div>
  );
};

export default AuthCallback;
          console.log('User:', data.session.user);
          
          // Update the auth context
          setUser(data.session.user);
          setSession(data.session);
          
          setStatus('success');
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            navigate('/');
          }, 1000);
        } else {
          console.log('No session found, trying to get user...');
          
          // Try to get user directly
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          console.log('User data:', user);
          console.log('User error:', userError);
          
          if (user) {
            console.log('Found user, creating session...');
            setUser(user);
            setStatus('success');
            setTimeout(() => {
              navigate('/');
            }, 1000);
          } else {
            console.log('No user found, redirecting to auth page');
            navigate('/auth');
          }
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [navigate, setUser, setSession]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Completing sign-in...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Sign-in Failed</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => navigate('/auth')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-500 mb-4">✅</div>
        <h2 className="text-xl font-semibold mb-2">Sign-in Successful!</h2>
        <p className="text-muted-foreground">Redirecting to the app...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
