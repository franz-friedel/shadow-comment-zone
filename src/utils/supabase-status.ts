export function getSupabaseStatus() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return {
    isConfigured: !!(url && key),
    hasUrl: !!url,
    hasKey: !!key,
    urlPrefix: url ? url.substring(0, 30) + '...' : 'Not set',
    keyPrefix: key ? key.substring(0, 8) + '...' : 'Not set',
  };
}

export function logSupabaseStatus() {
  const status = getSupabaseStatus();
  console.log('[Supabase Status]', {
    configured: status.isConfigured,
    url: status.urlPrefix,
    key: status.keyPrefix,
  });
  
  if (!status.isConfigured) {
    console.warn('[Supabase Status] Missing environment variables:');
    if (!status.hasUrl) console.warn('  - VITE_SUPABASE_URL is not set');
    if (!status.hasKey) console.warn('  - VITE_SUPABASE_ANON_KEY is not set');
    console.warn('[Supabase Status] Please set these in your .env file or deployment environment');
  }
}
