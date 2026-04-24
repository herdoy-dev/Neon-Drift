import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  withRepeat,
} from 'react-native-reanimated';
import { useGameStore } from '../gameStore';
import { useRewardedAd } from '../ads/useRewardedAd';
import { REWARDED_REVIVE, REWARDED_DOUBLE } from '../ads/adUnits';
import { NeonBackground } from '../components/NeonBackground';
import { NeonButton } from '../components/NeonButton';
import { CoinIcon } from '../components/CoinIcon';
import { colors } from '../theme';

type Props = {
  coinsEarned: number;
  score: number;
  onRevive: () => void;
  onHome: () => void;
};

export function GameOverScreen({ coinsEarned, score, onRevive, onHome }: Props) {
  const addCoins = useGameStore((s) => s.addCoins);
  const setHighScore = useGameStore((s) => s.setHighScore);

  const reviveAd = useRewardedAd(REWARDED_REVIVE);
  const doubleAd = useRewardedAd(REWARDED_DOUBLE);

  const [doubled, setDoubled] = useState(false);
  const [reviveUsed, setReviveUsed] = useState(false);

  const titleOpacity = useSharedValue(0);
  const titleTranslate = useSharedValue(-20);
  const scoreOpacity = useSharedValue(0);
  const coinsOpacity = useSharedValue(0);
  const actionsOpacity = useSharedValue(0);
  const titlePulse = useSharedValue(0.7);

  useEffect(() => {
    setHighScore(score);
    titleOpacity.value = withTiming(1, { duration: 400 });
    titleTranslate.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    scoreOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    coinsOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    actionsOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    titlePulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [score, setHighScore, titleOpacity, titleTranslate, scoreOpacity, coinsOpacity, actionsOpacity, titlePulse]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslate.value }],
    textShadowRadius: 18 + titlePulse.value * 14,
  }));
  const scoreStyle = useAnimatedStyle(() => ({ opacity: scoreOpacity.value }));
  const coinsStyle = useAnimatedStyle(() => ({ opacity: coinsOpacity.value }));
  const actionsStyle = useAnimatedStyle(() => ({ opacity: actionsOpacity.value }));

  const onClaim2x = () => {
    if (doubled) return;
    doubleAd.show(() => {
      addCoins(coinsEarned);
      setDoubled(true);
    });
  };

  const onReviveTap = () => {
    if (reviveUsed) return;
    reviveAd.show(() => {
      setReviveUsed(true);
      onRevive();
    });
  };

  return (
    <View style={styles.container}>
      <NeonBackground />

      <View style={styles.content}>
        <Animated.Text style={[styles.title, titleStyle]}>
          YOU DIED
        </Animated.Text>

        <Animated.View style={[styles.scoreWrap, scoreStyle]}>
          <Text style={styles.scoreLabel}>SURVIVED</Text>
          <Text style={styles.score}>{score}s</Text>
        </Animated.View>

        <Animated.View style={[styles.coinsBox, coinsStyle]}>
          <Text style={styles.coinsLabel}>COINS EARNED</Text>
          <View style={styles.coinsRow}>
            <CoinIcon size={28} />
            <Text style={styles.coinsVal}>
              {coinsEarned}
              {doubled ? (
                <Text style={styles.coinsBonus}>  +{coinsEarned}</Text>
              ) : null}
            </Text>
          </View>
          {doubled && (
            <Text style={styles.coinsTotal}>TOTAL {coinsEarned * 2}</Text>
          )}
        </Animated.View>
      </View>

      <Animated.View style={[styles.actions, actionsStyle]}>
        {!reviveUsed && (
          <NeonButton
            variant="cyan"
            size="lg"
            label="REVIVE"
            sub="Watch ad · keep your run going"
            icon={<Ionicons name="refresh" size={22} color={colors.bgDeep} />}
            disabled={!reviveAd.loaded}
            onPress={onReviveTap}
          />
        )}

        {!doubled && (
          <NeonButton
            variant="outline-gold"
            label="2× COINS"
            sub={`Double to ${coinsEarned * 2}`}
            icon={<CoinIcon size={20} />}
            disabled={!doubleAd.loaded}
            onPress={onClaim2x}
          />
        )}

        <NeonButton
          variant="ghost"
          label={doubled ? 'DONE' : `CLAIM ${coinsEarned}`}
          onPress={onHome}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 90 },
  content: { alignItems: 'center' },
  title: {
    color: colors.pink,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 5,
    textAlign: 'center',
    textShadowColor: colors.pink,
    textShadowOffset: { width: 0, height: 0 },
  },
  scoreWrap: { alignItems: 'center', marginTop: 28 },
  scoreLabel: {
    color: colors.textDim,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '700',
  },
  score: {
    color: colors.white,
    fontSize: 88,
    fontWeight: '900',
    marginTop: 2,
    textShadowColor: colors.white,
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  coinsBox: {
    marginTop: 36,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 18,
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  coinsLabel: {
    color: colors.textDim,
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  coinsVal: {
    color: colors.gold,
    fontSize: 42,
    fontWeight: '900',
    textShadowColor: colors.gold,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  coinsBonus: {
    color: colors.goldDeep,
    fontSize: 26,
    fontWeight: '800',
  },
  coinsTotal: {
    color: colors.gold,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 6,
  },
  actions: {
    marginTop: 'auto',
    marginBottom: 40,
    gap: 12,
  },
});
