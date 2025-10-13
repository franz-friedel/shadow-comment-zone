import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const videoId = String(req.query.videoId || '');
      const limit = Math.min(100, Number(req.query.limit || 50));
      
      if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId' });
      }

      console.log(`[API] Fetching comments for videoId: ${videoId}, limit: ${limit}`);

      const { data, error } = await supabase
        .from('comments')
        .select('id, video_id, user_id, display_name, body, created_at')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[API] Error fetching comments:', error);
        return res.status(500).json({ error: error.message });
      }

      console.log(`[API] Successfully fetched ${data?.length || 0} comments`);
      return res.status(200).json({ data: data || [] });
    }

    if (req.method === 'POST') {
      const { videoId, body } = req.body || {};
      
      if (!videoId || !body) {
        return res.status(400).json({ error: 'videoId and body required' });
      }

      console.log(`[API] Creating comment for videoId: ${videoId}`);

      // Get user session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[API] Session error:', sessionError);
        return res.status(401).json({ error: 'Authentication error' });
      }

      const user = sessionData?.session?.user;
      if (!user) {
        console.log('[API] No authenticated user');
        return res.status(401).json({ error: 'Auth required' });
      }

      const display_name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

      console.log(`[API] Inserting comment for user: ${user.id}, display_name: ${display_name}`);

      const { data, error } = await supabase
        .from('comments')
        .insert([{ 
          video_id: videoId, 
          body: body.trim(), 
          user_id: user.id, 
          display_name 
        }])
        .select()
        .single();

      if (error) {
        console.error('[API] Error inserting comment:', error);
        return res.status(500).json({ error: error.message });
      }

      console.log('[API] Successfully created comment:', data?.id);
      return res.status(201).json({ data });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e: any) {
    console.error('[API] Unexpected error:', e);
    return res.status(500).json({ error: e?.message || 'Unexpected error' });
  }
}
