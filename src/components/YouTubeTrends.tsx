import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface TrendVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
}

export function YouTubeTrends({ region = "US" }: { region?: string }) {
  const [trends, setTrends] = useState<TrendVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trending?region=${region}&max=12`)
      .then((r) => r.json())
      .then((data) => {
        const items = (data.items || []).map((v: any) => ({
          id: v.id,
          title: v.snippet?.title ?? "",
          channel: v.snippet?.channelTitle ?? "",
          thumbnail:
            v.snippet?.thumbnails?.medium?.url ||
            v.snippet?.thumbnails?.default?.url ||
            "",
          url: `https://www.youtube.com/watch?v=${v.id}`,
        }));
        setTrends(items);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [region]);

  if (loading) return <div className="mt-6">Loading YouTube Trends...</div>;
  if (!trends.length) return <div className="mt-6">No trending videos found.</div>;

  return (
    <div className="w-full max-w-xl mt-6">
      <h2 className="text-lg font-semibold mb-2">Current YouTube Trends</h2>
      <div className="grid gap-4">
        {trends.map((video) => (
          <Card key={video.id} className="flex items-center gap-4 p-2">
            {video.thumbnail && (
              <img src={video.thumbnail} alt={video.title} className="w-20 h-12 rounded" />
            )}
            <div className="flex-1">
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {video.title}
              </a>
              <div className="text-xs text-muted-foreground">{video.channel}</div>
              <div className="mt-2">
                {/* Deep-link into your shadow comments page */}
                <a
                  href={`/watch?v=${video.id}`}
                  className="inline-block text-xs px-2 py-1 rounded bg-blue-600 text-white"
                >
                  Comment (shadow)
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
