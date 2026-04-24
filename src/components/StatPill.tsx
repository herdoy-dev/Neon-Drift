import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';

type Props = {
  accent: 'cyan' | 'pink' | 'gold';
  icon?: React.ReactNode;
  label: string;
  sub?: string;
};

const ACCENT = {
  cyan: { color: colors.cyan, glow: colors.cyanGlow },
  pink: { color: colors.pink, glow: colors.pinkGlow },
  gold: { color: colors.gold, glow: colors.goldGlow },
};

export function StatPill({ accent, icon, label, sub }: Props) {
  const a = ACCENT[accent];
  return (
    <View
      style={[
        styles.container,
        {
          borderColor: a.color,
          shadowColor: a.color,
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'rgba(0,0,0,0.2)']}
        style={styles.bg}
      />
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: a.color, textShadowColor: a.color }]}>
          {label}
        </Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
    gap: 8,
    overflow: 'hidden',
  },
  bg: { ...StyleSheet.absoluteFillObject },
  icon: { justifyContent: 'center', alignItems: 'center' },
  textCol: { flexDirection: 'column' },
  label: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowRadius: 8,
  },
  sub: { color: colors.textDim, fontSize: 10, letterSpacing: 0.5 },
});
