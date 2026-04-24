import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGameStore } from '../gameStore';
import { useRewardedAd } from '../ads/useRewardedAd';
import { REWARDED_REVIVE, REWARDED_DOUBLE } from '../ads/adUnits';

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

  useEffect(() => {
    setHighScore(score);
  }, [score, setHighScore]);

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
      <Text style={styles.title}>YOU DIED</Text>
      <Text style={styles.score}>{score}s</Text>

      <View style={styles.coinsBox}>
        <Text style={styles.coinsLabel}>COINS EARNED</Text>
        <Text style={styles.coinsVal}>
          {coinsEarned}
          {doubled ? ` + ${coinsEarned}` : ''}
        </Text>
      </View>

      <View style={styles.actions}>
        {!reviveUsed && (
          <Pressable
            style={[styles.reviveBtn, !reviveAd.loaded && styles.btnDisabled]}
            onPress={onReviveTap}
          >
            <Text style={styles.reviveBtnText}>[AD] REVIVE + CONTINUE</Text>
            <Text style={styles.reviveBtnSub}>Keep your run going</Text>
          </Pressable>
        )}

        {!doubled && (
          <Pressable
            style={[styles.doubleBtn, !doubleAd.loaded && styles.btnDisabled]}
            onPress={onClaim2x}
          >
            <Text style={styles.doubleBtnText}>[AD] 2X COINS</Text>
            <Text style={styles.doubleBtnSub}>Double to {coinsEarned * 2}</Text>
          </Pressable>
        )}

        <Pressable style={styles.homeBtn} onPress={onHome}>
          <Text style={styles.homeBtnText}>
            {doubled ? 'CLAIMED' : `CLAIM ${coinsEarned}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  title: {
    color: '#ff2277',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: '#ff2277',
    textShadowRadius: 24,
  },
  score: { color: '#ffffff', fontSize: 80, fontWeight: '900', marginTop: 20 },
  coinsBox: {
    marginTop: 40,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  coinsLabel: { color: '#8888aa', fontSize: 12, letterSpacing: 2 },
  coinsVal: { color: '#ffd700', fontSize: 36, fontWeight: '900', marginTop: 4 },
  actions: { marginTop: 'auto', marginBottom: 60, gap: 12, alignSelf: 'stretch' },
  reviveBtn: {
    backgroundColor: '#00f0ff',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  reviveBtnText: { color: '#0a0a1a', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  reviveBtnSub: { color: '#0a0a1a', fontSize: 11, marginTop: 2, opacity: 0.7 },
  doubleBtn: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#ffd700',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  doubleBtnText: { color: '#ffd700', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  doubleBtnSub: { color: '#8888aa', fontSize: 11, marginTop: 2 },
  btnDisabled: { opacity: 0.45 },
  homeBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  homeBtnText: { color: '#8888aa', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
});
