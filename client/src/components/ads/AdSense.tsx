import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseProps {
  slot: string;
  format?: 'auto' | 'fluid';
  layout?: string;
  className?: string;
  responsive?: boolean;
}

export function AdSense({ 
  slot, 
  format = 'auto', 
  layout, 
  className,
  responsive = true 
}: AdSenseProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (!window.adsbygoogle) {
          window.adsbygoogle = [];
        }

        const adScript = document.createElement('script');
        adScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
        adScript.async = true;
        adScript.crossOrigin = 'anonymous';
        document.head.appendChild(adScript);

        // Push the ad configuration
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('Error initializing AdSense:', error);
    }

    // Cleanup
    return () => {
      const scripts = document.querySelectorAll(`script[src*="adsbygoogle"]`);
      scripts.forEach(script => script.remove());
    };
  }, [clientId]);

  if (!clientId) {
    console.warn('AdSense client ID is not set');
    return null;
  }

  return (
    <div className={className} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}