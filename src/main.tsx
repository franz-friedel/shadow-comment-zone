import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Load AdSense script
const adsenseScript = document.createElement('script');
adsenseScript.async = true;
adsenseScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3471300692216938';
adsenseScript.crossOrigin = 'anonymous';
document.head.appendChild(adsenseScript);

createRoot(document.getElementById("root")!).render(<App />);
