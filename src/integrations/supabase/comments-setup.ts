import { supabase } from './client';

export async function ensureCommentsTableExists(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[CommentsSetup] Ensuring comments table exists...');

    // Check if table exists by trying to query it
    const { data, error: checkError } = await supabase
      .from('comments')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('[CommentsSetup] Comments table already exists');
      return { success: true };
    }

    // If table doesn't exist, create it
    if (checkError.code === 'PGRST116') { // Table not found
      console.log('[CommentsSetup] Creating comments table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.comments (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          video_id text NOT NULL,
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
          display_name text,
          body text NOT NULL,
          created_at timestamp with time zone DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_comments_video_id_created_at 
        ON public.comments (video_id, created_at DESC);

        ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
        DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
        DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
        DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

        -- Create RLS policies
        CREATE POLICY "Comments are viewable by everyone" 
        ON public.comments FOR SELECT USING (true);

        CREATE POLICY "Authenticated users can create comments" 
        ON public.comments FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own comments" 
        ON public.comments FOR UPDATE 
        USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own comments" 
        ON public.comments FOR DELETE USING (auth.uid() = user_id);
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (createError) {
        console.error('[CommentsSetup] Error creating table:', createError);
        return { success: false, error: createError.message };
      }

      console.log('[CommentsSetup] Comments table created successfully');
      return { success: true };
    }

    console.error('[CommentsSetup] Unexpected error checking table:', checkError);
    return { success: false, error: checkError.message };
  } catch (error) {
    console.error('[CommentsSetup] Unexpected error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Alternative approach using direct SQL execution
export async function createCommentsTableIfNotExists(): Promise<{ success: boolean; error?: string }> {
  try {
    // Try a simple approach - just attempt to use the table
    // If it fails with table not found, we'll handle it gracefully
    const { data, error } = await supabase
      .from('comments')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('[CommentsSetup] Comments table exists and is accessible');
      return { success: true };
    }

    // If we get here, there's an issue with the table
    console.error('[CommentsSetup] Comments table issue:', error);
    return { success: false, error: error.message };
  } catch (error) {
    console.error('[CommentsSetup] Unexpected error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
