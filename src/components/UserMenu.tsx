import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileDialog } from './ProfileDialog';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const UserMenu = () => {
  const { user, signOut, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setProfile(data);
  };

  if (loading) {
    return (
      <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link to="/auth">Sign In</Link>
      </Button>
    );
  }

  const displayName = profile?.display_name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{displayName}</p>
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <ProfileDialog>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
        </ProfileDialog>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};