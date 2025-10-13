import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Ensure client (with auto-exchange logic) is imported before App mounts
import './integrations/supabase/client';

// Load AdSense script
const adsenseScript = document.createElement('script');
adsenseScript.async = true;
adsenseScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3772894258095114';
adsenseScript.crossOrigin = 'anonymous';
document.head.appendChild(adsenseScript);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
