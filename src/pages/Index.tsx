import { useState, useEffect } from "react";
import { VideoInput } from "@/components/VideoInput";
// If VideoDisplay is a default export:
import VideoDisplay from "@/components/VideoDisplay";
// Or, if the actual export is named differently, update accordingly:
// import { ActualExportName } from "@/components/VideoDisplay";
import { CommentSection } from "@/components/CommentSection";
import { UserMenu } from "@/components/UserMenu";
import { AdSenseAd } from "@/components/AdSenseAd";
import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";
import { YouTubeTrends } from "@/components/YouTubeTrends";

const Index = () => {
  const [currentVideo, setCurrentVideo] = useState<{ id: string; data: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load video from localStorage on component mount
  useEffect(() => {
    const savedVideo = localStorage.getItem('currentVideo');
    if (savedVideo) {
      try {
        const videoData = JSON.parse(savedVideo);
        setCurrentVideo(videoData);
      } catch (error) {
        console.error('Error parsing video data from localStorage:', error);
        localStorage.removeItem('currentVideo');
      }
    }
  }, []);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      setError(e.message || 'Unexpected error');
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      setError((e.reason && e.reason.message) || 'Unexpected async error');
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const handleVideoLoad = (videoId: string, videoData: any) => {
    const videoState = { id: videoId, data: videoData };
    setCurrentVideo(videoState);
    
    // Save to localStorage
    localStorage.setItem('currentVideo', JSON.stringify(videoState));
  };

  const handleBack = () => {
    setCurrentVideo(null);
    // Clear localStorage
    localStorage.removeItem('currentVideo');
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Early paint placeholder to avoid black flash */}
      <noscript>
        <div style={{padding:'2rem',color:'#fff',textAlign:'center'}}>Enable JavaScript to use Shadow Comments.</div>
      </noscript>

      {/* Header Banner Ad */}
      <div className="w-full bg-card border-b border-border py-2">
        <div className="container mx-auto px-4">
          <AdSenseAd 
            adSlot="1234567890" 
            adFormat="horizontal"
            adStyle={{ display: "block", height: "90px" }}
            className="text-center"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold gradient-text">
            Shadow Comments
          </h1>
          <div className="flex items-center gap-3">
            <Button 
              asChild 
              variant="outline" 
              size="sm"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
            >
              <a 
                href="https://buymeacoffee.com/shadowcomments" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Coffee className="h-4 w-4" />
                Buy me a coffee
              </a>
            </Button>
            <UserMenu />
          </div>
        </div>
        
        {/* Adsterra Native Banner */}
        <div className="w-full mb-8 text-center">
          <div id="container-3baabbac23109fdff98a672f9f31b7e8"></div>
        </div>
        
        {/* Move search box to the very top */}
        <div className="w-full max-w-xl mt-2">
          {/* ...SearchBox component... */}
        </div>

        {/* YouTube trends directly below the search box */}
        <YouTubeTrends />

        {!currentVideo ? (
          <div className="flex min-h-[80vh] items-center justify-center">
            <VideoInput onVideoLoad={handleVideoLoad} />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3 space-y-8">
                <VideoDisplay videoData={currentVideo.data} onBack={handleBack} />
                <CommentSection videoId={currentVideo.id} />
              </div>
              
              {/* Sidebar with Ads */}
              <div className="lg:col-span-1 space-y-6">
                <div className="sticky top-4">
                  <AdSenseAd 
                    adSlot="1234567891" 
                    adFormat="vertical"
                    adStyle={{ display: "block", height: "250px" }}
                    className="mb-6"
                  />
                  <AdSenseAd 
                    adSlot="1234567892" 
                    adFormat="vertical"
                    adStyle={{ display: "block", height: "250px" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
