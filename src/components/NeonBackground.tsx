import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

export function NeonBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#0a0a1a', '#10103a', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.blobCyan]} />
      <View style={[styles.blob, styles.blobPink]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.18,
  },
  blobCyan: {
    top: -100,
    left: -80,
    backgroundColor: colors.cyan,
  },
  blobPink: {
    bottom: 120,
    right: -120,
    backgroundColor: colors.pink,
  },
});
