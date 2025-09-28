import { useEffect } from 'react';

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: string;
  adStyle?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

export const AdSenseAd = ({ 
  adSlot, 
  adFormat = "auto", 
  adStyle = { display: "block" }, 
  className = "",
  responsive = true 
}: AdSenseAdProps) => {
  useEffect(() => {
    try {
      // @ts-ignore - AdSense global
      if (window.adsbygoogle && window.adsbygoogle.loaded) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`adsense-ad ${className}`}>
      <ins
        className="adsbygoogle"
        style={adStyle}
        data-ad-client="ca-pub-3772894258095114"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};
