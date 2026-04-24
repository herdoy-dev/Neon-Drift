import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGameStore, MAX_LIVES_CONST, MS_PER_LIFE } from '../gameStore';
import { useRewardedAd } from '../ads/useRewardedAd';
import { Banner } from '../ads/Banner';
import { REWARDED_REFILL, REWARDED_DAILY, BANNER_HOME } from '../ads/adUnits';

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

  useEffect(() => {
    const interval = setInterval(() => regenLives(), 10000);
    return () => clearInterval(interval);
  }, [regenLives]);

  const nextLifeIn = (() => {
    if (lives >= MAX_LIVES_CONST || lastLifeLostAt === 0) return null;
    const next = lastLifeLostAt + MS_PER_LIFE;
    const secs = Math.max(0, Math.ceil((next - Date.now()) / 1000));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  })();

  const canPlay = lives > 0;
  const canClaim = canClaimDailyBonus();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.coinPill}>[COIN] {coins}</Text>
        <Text style={styles.livesPill}>
          [HP] {lives}/{MAX_LIVES_CONST}
          {nextLifeIn ? ` (+1 in ${nextLifeIn})` : ''}
        </Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.title}>NEON{"\n"}DRIFT</Text>
        <Text style={styles.subtitle}>Drift. Dodge. Survive.</Text>
        <Text style={styles.highScore}>BEST: {highScore}s</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.playBtn, !canPlay && styles.playBtnDisabled]}
          onPress={canPlay ? onPlay : undefined}
        >
          <Text style={styles.playBtnText}>{canPlay ? 'PLAY' : 'NO LIVES'}</Text>
        </Pressable>

        {!canPlay && (
          <Pressable
            style={[styles.adBtn, !refillAd.loaded && styles.adBtnDisabled]}
            onPress={() => refillAd.show(() => refillLives())}
          >
            <Text style={styles.adBtnText}>[AD] REFILL LIVES</Text>
            <Text style={styles.adBtnSub}>Watch ad to fill all {MAX_LIVES_CONST} lives</Text>
          </Pressable>
        )}

        {canClaim && (
          <Pressable
            style={[styles.adBtn, !dailyAd.loaded && styles.adBtnDisabled]}
            onPress={() =>
              dailyAd.show(() => {
                addCoins(50);
                claimDailyBonus();
              })
            }
          >
            <Text style={styles.adBtnText}>[AD] DAILY +50 COINS</Text>
            <Text style={styles.adBtnSub}>Resets every 20h</Text>
          </Pressable>
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
    backgroundColor: '#0a0a1a',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  coinPill: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: '800',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  livesPill: {
    color: '#ff2277',
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  hero: { alignItems: 'center', marginTop: 60 },
  title: {
    color: '#00f0ff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: '#00f0ff',
    textShadowRadius: 20,
  },
  subtitle: { color: '#8888aa', fontSize: 14, marginTop: 8, letterSpacing: 1 },
  highScore: { color: '#ffd700', fontSize: 18, marginTop: 30, fontWeight: '700', letterSpacing: 2 },
  actions: { marginTop: 'auto', marginBottom: 24, gap: 14 },
  bannerContainer: {
    marginHorizontal: -24,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 50,
  },
  playBtn: {
    backgroundColor: '#00f0ff',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  playBtnDisabled: { backgroundColor: '#334' },
  playBtnText: { color: '#0a0a1a', fontSize: 24, fontWeight: '900', letterSpacing: 3 },
  adBtn: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#ff2277',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  adBtnDisabled: { opacity: 0.45 },
  adBtnText: { color: '#ff2277', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  adBtnSub: { color: '#8888aa', fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
});
