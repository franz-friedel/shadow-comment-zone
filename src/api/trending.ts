// api/trending.ts — Vercel serverless function
import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.YOUTUBE_API_KEY!;
const TTL_MS = 1000 * 60 * 10; // 10 minutes
const cache: Record<string, { ts: number; data: any }> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!API_KEY) return res.status(500).json({ error: 'Missing YOUTUBE_API_KEY' });

  const region = String(req.query.region || 'US').toUpperCase();
  const max = Math.min(50, parseInt(String(req.query.max || '12'), 10));
  const cacheKey = `${region}:${max}`;

  const hit = cache[cacheKey];
  if (hit && Date.now() - hit.ts < TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return res.status(200).json(hit.data);
  }

  const params = new URLSearchParams({
    part: 'snippet,statistics',
    chart: 'mostPopular',
    regionCode: region,
    maxResults: String(max),
    key: API_KEY,
  });

  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    cache[cacheKey] = { ts: Date.now(), data };
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch trending videos' });
  }
}
