type AdSDK = typeof import('react-native-google-mobile-ads');

let sdk: AdSDK | null = null;
try {
  sdk = require('react-native-google-mobile-ads') as AdSDK;
} catch {
  sdk = null;
}

export const ADS_ENABLED = sdk !== null;
export const adSDK = sdk;

if (!ADS_ENABLED && __DEV__) {
  console.log('[ads] native module unavailable — running with stubs (Expo Go mode)');
}
