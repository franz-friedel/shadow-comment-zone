import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";

interface VideoDisplayProps {
  videoData: {
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    embedUrl: string;
  };
  onBack: () => void;
}

export const VideoDisplay = ({ videoData, onBack }: VideoDisplayProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </Button>
        <div className="flex-1" />
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            const youtubeUrl = `https://www.youtube.com/watch?v=${videoData.id}`;
            console.log('Opening YouTube URL:', youtubeUrl);
            window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
          }}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Original Video
        </Button>
      </div>

      <Card className="p-4 bg-video-embed border-border mb-6">
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <iframe
            width="100%"
            height="100%"
            src={videoData.embedUrl}
            title={videoData.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground line-clamp-2">
            {videoData.title}
          </h2>
          <p className="text-muted-foreground">
            {videoData.channelTitle}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
              Shadow Comments Active
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};