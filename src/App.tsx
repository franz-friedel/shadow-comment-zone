import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AuthCallback from "@/pages/AuthCallback";

const App = () => {
  // Force re-render on auth state change if higher-level context not yet applied
  const [, setAuthTick] = useState(0);
  useEffect(() => {
    const handler = () => setAuthTick((t) => t + 1);
    window.addEventListener("supabase-auth-changed", handler);
    return () => window.removeEventListener("supabase-auth-changed", handler);
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Forces components relying on session-aware hooks to update if needed
      // (React re-renders via context implementations)
      // No-op body intentional.
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      console.log("[App Auth Listener]", evt, "user?", !!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <Sonner />
      </Router>
    </AuthProvider>
  );
};

export default App;
