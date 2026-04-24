import React, { useRef } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import type { BannerAd as BannerAdType } from 'react-native-google-mobile-ads';
import { ADS_ENABLED, adSDK } from './provider';

type Props = { unitId: string };

export function Banner({ unitId }: Props) {
  if (!ADS_ENABLED || !adSDK) {
    return (
      <View style={styles.stub}>
        <Text style={styles.stubText}>[DEV] banner placeholder</Text>
      </View>
    );
  }

  return <RealBanner unitId={unitId} />;
}

function RealBanner({ unitId }: Props) {
  const { BannerAd, BannerAdSize, useForeground } = adSDK!;
  const bannerRef = useRef<BannerAdType>(null);
  useForeground(() => {
    if (Platform.OS === 'ios') bannerRef.current?.load();
  });
  return (
    <BannerAd
      ref={bannerRef}
      unitId={unitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
    />
  );
}

const styles = StyleSheet.create({
  stub: {
    height: 50,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stubText: { color: '#555', fontSize: 11, letterSpacing: 1 },
});
