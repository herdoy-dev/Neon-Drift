import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { AppOpenAd } from 'react-native-google-mobile-ads';
import { ADS_ENABLED, adSDK } from './provider';

const MIN_BACKGROUND_MS = 30 * 1000;

type Options = {
  unitId: string;
  canShow: () => boolean;
};

export function useAppOpenAd({ unitId, canShow }: Options) {
  const adRef = useRef<AppOpenAd | null>(null);
  const loadedRef = useRef(false);
  const backgroundedAtRef = useRef(0);
  const showingRef = useRef(false);

  useEffect(() => {
    if (!ADS_ENABLED || !adSDK) return;
    const { AppOpenAd, AdEventType } = adSDK;
    const ad = AppOpenAd.createForAdRequest(unitId);
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      showingRef.current = false;
      ad.load();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      loadedRef.current = false;
      showingRef.current = false;
      setTimeout(() => ad.load(), 3000);
    });

    ad.load();

    const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'background' || status === 'inactive') {
        if (backgroundedAtRef.current === 0) {
          backgroundedAtRef.current = Date.now();
        }
        return;
      }
      if (status === 'active') {
        const elapsed = Date.now() - backgroundedAtRef.current;
        const wasBackgrounded = backgroundedAtRef.current > 0;
        backgroundedAtRef.current = 0;

        if (!wasBackgrounded) return;
        if (elapsed < MIN_BACKGROUND_MS) return;
        if (!loadedRef.current) return;
        if (showingRef.current) return;
        if (!canShow()) return;

        showingRef.current = true;
        adRef.current?.show().catch(() => {
          showingRef.current = false;
        });
      }
    });

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
      sub.remove();
    };
  }, [unitId, canShow]);
}
