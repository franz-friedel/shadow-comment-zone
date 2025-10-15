import { useEffect, useState } from 'react';

export const EnvCheck = () => {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean;
    supabaseKey: boolean;
    mode: string;
  }>({
    supabaseUrl: false,
    supabaseKey: false,
    mode: 'unknown'
  });

  useEffect(() => {
    const checkEnv = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const mode = import.meta.env.MODE;
      
      setEnvStatus({
        supabaseUrl: !!url,
        supabaseKey: !!key,
        mode: mode || 'unknown'
      });

      console.log('Environment Status:', {
        mode,
        supabaseUrl: url ? 'SET' : 'MISSING',
        supabaseKey: key ? 'SET' : 'MISSING',
        url: url ? `${url.substring(0, 20)}...` : 'undefined',
        key: key ? `${key.substring(0, 20)}...` : 'undefined'
      });
    };

    checkEnv();
  }, []);

  // Only show in development or if there are issues
  if (envStatus.mode === 'production' && envStatus.supabaseUrl && envStatus.supabaseKey) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-background border rounded-lg p-3 shadow-lg max-w-sm">
      <h4 className="font-semibold text-sm mb-2">Environment Status</h4>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Mode:</span>
          <span className={envStatus.mode === 'production' ? 'text-green-600' : 'text-yellow-600'}>
            {envStatus.mode}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Supabase URL:</span>
          <span className={envStatus.supabaseUrl ? 'text-green-600' : 'text-red-600'}>
            {envStatus.supabaseUrl ? 'SET' : 'MISSING'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Supabase Key:</span>
          <span className={envStatus.supabaseKey ? 'text-green-600' : 'text-red-600'}>
            {envStatus.supabaseKey ? 'SET' : 'MISSING'}
          </span>
        </div>
      </div>
    </div>
  );
};
