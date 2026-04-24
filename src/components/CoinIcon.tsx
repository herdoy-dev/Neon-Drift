import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme';

type Props = { size?: number };

export function CoinIcon({ size = 16 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        shadowColor: colors.gold,
        shadowOpacity: 0.9,
        shadowRadius: size * 0.4,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      }}
    >
      <LinearGradient
        colors={gradients.gold}
        style={[styles.fill, { borderRadius: size / 2 }]}
      >
        <View
          style={{
            position: 'absolute',
            top: size * 0.15,
            left: size * 0.2,
            width: size * 0.35,
            height: size * 0.35,
            borderRadius: size * 0.2,
            backgroundColor: 'rgba(255, 255, 255, 0.55)',
          }}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
});
