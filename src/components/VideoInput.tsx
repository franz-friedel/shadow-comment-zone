import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Youtube, Link, MessageCircle } from "lucide-react";

interface VideoInputProps {
  onVideoLoad: (videoId: string, videoData: any) => void;
}

export const VideoInput = ({ onVideoLoad }: VideoInputProps) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    const videoId = extractVideoId(url);

    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Mock video data - in real app would fetch from YouTube API
    const mockVideoData = {
      id: videoId,
      title: "Video Title (Shadow Comments)",
      channelTitle: "Channel Name",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };

    onVideoLoad(videoId, mockVideoData);
    
    toast({
      title: "Video loaded!",
      description: "Shadow comment section is now active",
    });

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="p-8 bg-card border-border shadow-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Youtube className="h-8 w-8 text-primary" />
            <MessageCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Shadow YouTube Comments
          </h1>
          <p className="text-muted-foreground">
            Uncensored discussions for any YouTube video
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder="Paste YouTube URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 h-12 text-base bg-input border-border focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              variant="shadow"
              size="lg"
              className="h-12 px-6"
            >
              {isLoading ? "Loading..." : "Enter Shadow"}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-sm text-muted-foreground text-center">
          <p>Support free speech • No censorship • Community moderated</p>
        </div>
      </Card>
    </div>
  );
};