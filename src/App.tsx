import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AuthCallback from "@/pages/AuthCallback";
import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

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
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth event:", _event, "hasSession:", !!session);
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
