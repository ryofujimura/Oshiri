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
  const clientId = 'ca-pub-2072267475835261';

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (!window.adsbygoogle) {
          window.adsbygoogle = [];
        }

        // Push the ad configuration
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('Error initializing AdSense:', error);
    }
  }, []);

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