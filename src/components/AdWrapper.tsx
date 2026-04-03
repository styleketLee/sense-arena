import { useEffect, useRef } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import { AD_GROUP_IDS } from '../domain/constants';

interface BannerAdProps {
  adGroupId?: string;
}

export function BannerAd({ adGroupId = AD_GROUP_IDS.banner }: BannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!TossAds.attachBanner.isSupported()) return;

    const attached = TossAds.attachBanner(adGroupId, containerRef.current, {
      theme: 'light',
      tone: 'blackAndWhite',
      variant: 'expanded',
      callbacks: {
        onAdRendered: (payload) => console.log('Banner rendered:', payload.slotId),
        onAdFailedToRender: (payload) => console.error('Banner failed:', payload.error.message),
      },
    });

    return () => {
      attached?.destroy();
    };
  }, [adGroupId]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 96, marginTop: 16 }}
    />
  );
}
