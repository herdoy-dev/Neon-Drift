import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  PressableProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius } from '../theme';

type Variant = 'cyan' | 'pink' | 'gold' | 'outline-pink' | 'outline-gold' | 'ghost';

type Props = Omit<PressableProps, 'style'> & {
  variant?: Variant;
  label: string;
  sub?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  size?: 'lg' | 'md';
  style?: ViewStyle;
};

export function NeonButton({
  variant = 'cyan',
  label,
  sub,
  icon,
  disabled,
  size = 'md',
  style,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.96, { damping: 16, stiffness: 260 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 240 });
  };

  const isOutline = variant.startsWith('outline');
  const isGhost = variant === 'ghost';
  const heightStyle = size === 'lg' ? styles.lg : styles.md;

  return (
    <Animated.View style={[animatedStyle, { opacity: disabled ? 0.4 : 1 }, style]}>
      <Pressable
        disabled={disabled}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => [
          styles.base,
          heightStyle,
          isOutline ? outlineStyle(variant) : null,
          isGhost ? styles.ghost : null,
          pressed && !disabled ? { opacity: 0.92 } : null,
        ]}
        {...rest}
      >
        {!isOutline && !isGhost ? (
          <LinearGradient
            colors={variantGradient(variant)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        {!isGhost ? <View style={styles.sheen} pointerEvents="none" /> : null}

        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <View style={styles.textCol}>
            <Text
              style={[
                styles.label,
                size === 'lg' && styles.labelLg,
                isOutline && { color: variantAccent(variant) },
                isGhost && { color: colors.textDim },
              ]}
            >
              {label}
            </Text>
            {sub ? (
              <Text
                style={[
                  styles.sub,
                  isOutline && { color: colors.textDim },
                  !isOutline && !isGhost && { color: 'rgba(10,10,26,0.75)' },
                ]}
              >
                {sub}
              </Text>
            ) : null}
          </View>
        </View>

        {!isOutline && !isGhost ? (
          <View
            style={[
              styles.glow,
              { shadowColor: variantAccent(variant) },
            ]}
            pointerEvents="none"
          />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const variantGradient = (v: Variant) => {
  if (v === 'cyan') return gradients.cyan;
  if (v === 'pink') return gradients.pink;
  if (v === 'gold') return gradients.gold;
  return gradients.dark;
};
const variantAccent = (v: Variant) => {
  if (v === 'pink' || v === 'outline-pink') return colors.pink;
  if (v === 'gold' || v === 'outline-gold') return colors.gold;
  return colors.cyan;
};
const outlineStyle = (v: Variant): ViewStyle => ({
  backgroundColor: colors.card,
  borderWidth: 2,
  borderColor: variantAccent(v),
  shadowColor: variantAccent(v),
  shadowOpacity: 0.5,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.cyan,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  md: { paddingVertical: 14, paddingHorizontal: 18 },
  lg: { paddingVertical: 20, paddingHorizontal: 24 },
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  icon: { justifyContent: 'center', alignItems: 'center' },
  textCol: { alignItems: 'flex-start' },
  label: {
    color: colors.bgDeep,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  labelLg: { fontSize: 22, letterSpacing: 4 },
  sub: {
    color: 'rgba(10,10,26,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
});
