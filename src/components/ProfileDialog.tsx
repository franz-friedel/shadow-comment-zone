import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Settings, Camera, X } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  currentPassword: z.string().min(1, 'Current password is required').optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface ProfileDialogProps {
  children: React.ReactNode;
}

export const ProfileDialog = ({ children }: ProfileDialogProps) => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (open && user) {
      fetchProfile();
    }
  }, [open, user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data);
      setFormData({
        display_name: data.display_name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        avatar_url: data.avatar_url || user.user_metadata?.avatar_url || '',
      });
    } else {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          user_id: user.id,
          display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
      } else {
        setProfile(newProfile);
        setFormData({
          display_name: newProfile.display_name || '',
          email: user.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          avatar_url: user.user_metadata?.avatar_url || '',
        });
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFormData(prev => ({ ...prev, avatar_url: url }));
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);

    try {
      const validatedData = profileSchema.parse(formData);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: validatedData.display_name,
          avatar_url: formData.avatar_url,
        })
        .eq('user_id', user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // Update user context with new avatar
      if (formData.avatar_url) {
        const updatedUser = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            avatar_url: formData.avatar_url,
            display_name: validatedData.display_name,
          }
        };
        setUser(updatedUser);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Update email if changed
      if (validatedData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: validatedData.email,
        });

        if (emailError) {
          throw new Error(emailError.message);
        }

        toast({
          title: 'Email update initiated',
          description: 'Please check both your old and new email for confirmation links.',
        });
      }

      // Update password if provided
      if (validatedData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: validatedData.newPassword,
        });

        if (passwordError) {
          throw new Error(passwordError.message);
        }

        toast({
          title: 'Password updated',
          description: 'Your password has been changed successfully.',
        });
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      setOpen(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

    } catch (err: any) {
      if (err.errors) {
        toast({
          title: 'Validation Error',
          description: err.errors[0]?.message || 'Please check your input',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Update failed',
          description: err.message || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Account Settings
          </DialogTitle>
          <DialogDescription>
            Update your profile information, email, and password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Picture Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Profile Picture</Label>
            
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={previewUrl || formData.avatar_url || undefined} 
                  alt="Profile picture"
                />
                <AvatarFallback className="bg-primary/20 text-primary text-lg">
                  {(formData.display_name || user?.email || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {formData.avatar_url ? 'Change Photo' : 'Upload Photo'}
                </Button>
                
                {formData.avatar_url && (
                  <Button
                    type="button"
                    onClick={handleRemoveImage}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Upload a profile picture (PNG, JPG, GIF up to 5MB)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              type="text"
              placeholder="Enter your display name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              required
            />
          </div>

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
            <Label htmlFor="newPassword">New Password (optional)</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
          </div>

          {formData.newPassword && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};