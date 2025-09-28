import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, Save } from 'lucide-react';

export const ProfileManager = () => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
    displayName: user?.user_metadata?.display_name || user?.email?.split('@')[0] || '',
    avatarUrl: user?.user_metadata?.avatar_url || '',
  });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    setProfileData(prev => ({ ...prev, avatarUrl: url }));
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setProfileData(prev => ({ ...prev, avatarUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsUploading(true);
      
      // Update user metadata
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user?.user_metadata,
          name: profileData.name,
          display_name: profileData.displayName,
          avatar_url: profileData.avatarUrl,
        }
      };

      // Update the user in context
      setUser(updatedUser);
      
      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully",
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold gradient-text">
            Profile Settings
          </CardTitle>
          <CardDescription>
            Update your profile information and avatar
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Profile Picture</Label>
            
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={previewUrl || profileData.avatarUrl || undefined} 
                  alt="Profile picture"
                />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {(profileData.name || profileData.displayName || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {profileData.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                </Button>
                
                {profileData.avatarUrl && (
                  <Button
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

          {/* Profile Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-input border-border focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your display name"
                value={profileData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="bg-input border-border focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-sm text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={isUploading}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {isUploading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
