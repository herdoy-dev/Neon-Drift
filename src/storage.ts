import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'tap-survive' });

export const kv = {
  getNumber: (key: string, fallback = 0) => storage.getNumber(key) ?? fallback,
  setNumber: (key: string, value: number) => storage.set(key, value),
  getString: (key: string, fallback = '') => storage.getString(key) ?? fallback,
  setString: (key: string, value: string) => storage.set(key, value),
};
