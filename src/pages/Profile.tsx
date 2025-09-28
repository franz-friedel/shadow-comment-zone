import { ProfileManager } from '@/components/ProfileManager';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to App
              </Link>
            </Button>
            <h1 className="text-2xl font-bold gradient-text">
              Profile Settings
            </h1>
          </div>
          <UserMenu />
        </div>
        
        {/* Profile Manager */}
        <ProfileManager />
      </div>
    </div>
  );
};

export default Profile;
