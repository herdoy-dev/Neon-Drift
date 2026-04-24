import { useEffect, useRef, useState } from 'react';
import type { RewardedAd } from 'react-native-google-mobile-ads';
import { ADS_ENABLED, adSDK } from './provider';

export type RewardedAdState = {
  loaded: boolean;
  show: (onReward: () => void, onClose?: () => void) => void;
};

export function useRewardedAd(unitId: string): RewardedAdState {
  const [loaded, setLoaded] = useState(!ADS_ENABLED);
  const adRef = useRef<RewardedAd | null>(null);
  const rewardCb = useRef<(() => void) | null>(null);
  const closeCb = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!ADS_ENABLED || !adSDK) return;
    const { RewardedAd, RewardedAdEventType, AdEventType } = adSDK;
    const ad = RewardedAd.createForAdRequest(unitId);
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
    });
    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardCb.current?.();
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      closeCb.current?.();
      rewardCb.current = null;
      closeCb.current = null;
      ad.load();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      setLoaded(false);
      setTimeout(() => ad.load(), 3000);
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
    };
  }, [unitId]);

  const show = (onReward: () => void, onClose?: () => void) => {
    if (!ADS_ENABLED) {
      if (__DEV__) console.log('[ads stub] rewarded fired, granting reward');
      setTimeout(() => {
        onReward();
        onClose?.();
      }, 400);
      return;
    }
    if (!loaded || !adRef.current) return;
    rewardCb.current = onReward;
    closeCb.current = onClose ?? null;
    adRef.current.show();
  };

  return { loaded, show };
}
