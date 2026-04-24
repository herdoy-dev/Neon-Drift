import { useEffect, useRef, useState } from 'react';
import type { InterstitialAd } from 'react-native-google-mobile-ads';
import { ADS_ENABLED, adSDK } from './provider';

export type InterstitialAdState = {
  loaded: boolean;
  show: (onClose?: () => void) => boolean;
};

export function useInterstitialAd(unitId: string): InterstitialAdState {
  const [loaded, setLoaded] = useState(!ADS_ENABLED);
  const adRef = useRef<InterstitialAd | null>(null);
  const closeCb = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!ADS_ENABLED || !adSDK) return;
    const { InterstitialAd, AdEventType } = adSDK;
    const ad = InterstitialAd.createForAdRequest(unitId);
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      closeCb.current?.();
      closeCb.current = null;
      ad.load();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      setLoaded(false);
      closeCb.current?.();
      closeCb.current = null;
      setTimeout(() => ad.load(), 3000);
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, [unitId]);

  const show = (onClose?: () => void) => {
    if (!ADS_ENABLED) {
      if (__DEV__) console.log('[ads stub] interstitial skipped');
      onClose?.();
      return true;
    }
    if (!loaded || !adRef.current) {
      onClose?.();
      return false;
    }
    closeCb.current = onClose ?? null;
    adRef.current.show();
    return true;
  };

  return { loaded, show };
}
