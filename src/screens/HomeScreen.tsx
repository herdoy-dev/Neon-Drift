import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useGameStore, MAX_LIVES_CONST, MS_PER_LIFE } from '../gameStore';
import { useRewardedAd } from '../ads/useRewardedAd';
import { Banner } from '../ads/Banner';
import { REWARDED_REFILL, REWARDED_DAILY, BANNER_HOME } from '../ads/adUnits';
import { NeonBackground } from '../components/NeonBackground';
import { NeonButton } from '../components/NeonButton';
import { StatPill } from '../components/StatPill';
import { CoinIcon } from '../components/CoinIcon';
import { colors } from '../theme';

type Props = { onPlay: () => void };

export function HomeScreen({ onPlay }: Props) {
  const coins = useGameStore((s) => s.coins);
  const lives = useGameStore((s) => s.lives);
  const highScore = useGameStore((s) => s.highScore);
  const lastLifeLostAt = useGameStore((s) => s.lastLifeLostAt);
  const refillLives = useGameStore((s) => s.refillLives);
  const regenLives = useGameStore((s) => s.regenLives);
  const addCoins = useGameStore((s) => s.addCoins);
  const canClaimDailyBonus = useGameStore((s) => s.canClaimDailyBonus);
  const claimDailyBonus = useGameStore((s) => s.claimDailyBonus);

  const refillAd = useRewardedAd(REWARDED_REFILL);
  const dailyAd = useRewardedAd(REWARDED_DAILY);

  const titleGlow = useSharedValue(0.6);

  useEffect(() => {
    titleGlow.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [titleGlow]);

  useEffect(() => {
    const interval = setInterval(() => regenLives(), 10000);
    return () => clearInterval(interval);
  }, [regenLives]);

  const glowStyle = useAnimatedStyle(() => ({
    textShadowRadius: 20 + titleGlow.value * 10,
    opacity: 0.92 + titleGlow.value * 0.08,
  }));

  const nextLifeIn = (() => {
    if (lives >= MAX_LIVES_CONST || lastLifeLostAt === 0) return null;
    const next = lastLifeLostAt + MS_PER_LIFE;
    const secs = Math.max(0, Math.ceil((next - Date.now()) / 1000));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `+1 in ${m}:${s.toString().padStart(2, '0')}`;
  })();

  const canPlay = lives > 0;
  const canClaim = canClaimDailyBonus();

  return (
    <View style={styles.container}>
      <NeonBackground />

      <View style={styles.topBar}>
        <StatPill
          accent="gold"
          icon={<CoinIcon size={16} />}
          label={String(coins)}
        />
        <StatPill
          accent="pink"
          icon={<Ionicons name="heart" size={16} color={colors.pink} />}
          label={`${lives}/${MAX_LIVES_CONST}`}
          sub={nextLifeIn ?? undefined}
        />
      </View>

      <View style={styles.hero}>
        <Animated.Text
          style={[
            styles.title,
            glowStyle,
          ]}
        >
          NEON{'\n'}DRIFT
        </Animated.Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>DRIFT · DODGE · SURVIVE</Text>

        <View style={styles.highScoreWrap}>
          <Ionicons name="trophy" size={16} color={colors.gold} />
          <Text style={styles.highScore}>BEST {highScore}s</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <NeonButton
          variant="cyan"
          size="lg"
          label={canPlay ? 'PLAY' : 'NO LIVES'}
          icon={
            <Ionicons
              name="play"
              size={22}
              color={colors.bgDeep}
            />
          }
          disabled={!canPlay}
          onPress={canPlay ? onPlay : undefined}
        />

        {!canPlay && (
          <NeonButton
            variant="outline-pink"
            label="REFILL LIVES"
            sub={`Watch ad · fill all ${MAX_LIVES_CONST}`}
            icon={
              <Ionicons name="heart-circle" size={22} color={colors.pink} />
            }
            disabled={!refillAd.loaded}
            onPress={() => refillAd.show(() => refillLives())}
          />
        )}

        {canClaim && (
          <NeonButton
            variant="outline-gold"
            label="DAILY +50 COINS"
            sub="Watch ad · resets every 20h"
            icon={<Ionicons name="gift" size={22} color={colors.gold} />}
            disabled={!dailyAd.loaded}
            onPress={() =>
              dailyAd.show(() => {
                addCoins(50);
                claimDailyBonus();
              })
            }
          />
        )}
      </View>

      <View style={styles.bannerContainer}>
        <Banner unitId={BANNER_HOME} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  hero: {
    alignItems: 'center',
    marginTop: 70,
  },
  title: {
    color: colors.cyan,
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    lineHeight: 64,
    textShadowColor: colors.cyan,
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  divider: {
    marginTop: 20,
    width: 60,
    height: 2,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 14,
    letterSpacing: 4,
    fontWeight: '700',
  },
  highScoreWrap: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  highScore: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  actions: {
    marginTop: 'auto',
    marginBottom: 20,
    gap: 14,
  },
  bannerContainer: {
    marginHorizontal: -24,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 50,
  },
});
