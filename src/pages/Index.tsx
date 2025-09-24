import { useState } from "react";
import { VideoInput } from "@/components/VideoInput";
import { VideoDisplay } from "@/components/VideoDisplay";
import { CommentSection } from "@/components/CommentSection";
import { UserMenu } from "@/components/UserMenu";

const Index = () => {
  const [currentVideo, setCurrentVideo] = useState<{ id: string; data: any } | null>(null);

  const handleVideoLoad = (videoId: string, videoData: any) => {
    setCurrentVideo({ id: videoId, data: videoData });
  };

  const handleBack = () => {
    setCurrentVideo(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Shadow Comments
          </h1>
          <UserMenu />
        </div>
        
        {!currentVideo ? (
          <div className="flex min-h-[80vh] items-center justify-center">
            <VideoInput onVideoLoad={handleVideoLoad} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            <VideoDisplay videoData={currentVideo.data} onBack={handleBack} />
            <CommentSection videoId={currentVideo.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
