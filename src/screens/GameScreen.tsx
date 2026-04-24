import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, GestureResponderEvent } from 'react-native';
import { Canvas, Circle, Group, BlurMask } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../gameStore';
import { CoinIcon } from '../components/CoinIcon';
import { colors } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

const PLAYER_R = 14;
const ENEMY_R = 16;
const COIN_R = 10;

const PLAYER_SPEED = 6.5;
const BASE_ENEMY_SPEED = 0.9;

const SPAWN_BASE_MS = 1400;
const SPAWN_RAMP_PER_SEC = 12;
const MIN_SPAWN_MS = 450;

const SPEED_RAMP_PER_SEC = 0.020;

const ENEMY_LIFETIME_MS = 18000;
const COIN_LIFETIME_MS = 12000;
const FADE_DURATION_MS = 2000;
const MAX_ENEMIES = 12;
const MIN_SPAWN_DISTANCE = 160;
const START_GRACE_MS = 1200;

type Entity = {
  id: number;
  x: number;
  y: number;
  r: number;
  kind: 'enemy' | 'coin';
  spawnedAt: number;
  opacity: number;
  lethal: boolean;
};

type Props = {
  onGameOver: (coins: number, score: number) => void;
};

let NEXT_ID = 1;

export function GameScreen({ onGameOver }: Props) {
  const addCoins = useGameStore((s) => s.addCoins);

  const [, setTick] = useState(0);
  const [score, setScore] = useState(0);
  const [runCoins, setRunCoins] = useState(0);

  const playerRef = useRef({ x: W / 2, y: H / 2 });
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const entitiesRef = useRef<Entity[]>([]);
  const startRef = useRef(Date.now());
  const lastSpawnRef = useRef(Date.now());
  const lastScoreRef = useRef(0);
  const deadRef = useRef(false);
  const runCoinsRef = useRef(0);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      if (deadRef.current) return;
      stepFrame();
      setTick((t) => (t + 1) & 0xffff);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stepFrame = () => {
    const now = Date.now();
    const elapsed = now - startRef.current;
    const elapsedSec = elapsed / 1000;

    const nextScore = Math.floor(elapsedSec);
    if (nextScore !== lastScoreRef.current) {
      lastScoreRef.current = nextScore;
      setScore(nextScore);
    }

    const p = playerRef.current;
    const t = touchRef.current;
    if (t) {
      const dx = t.x - p.x;
      const dy = t.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 2) {
        p.x += (dx / d) * PLAYER_SPEED;
        p.y += (dy / d) * PLAYER_SPEED;
      }
    }
    p.x = Math.max(PLAYER_R, Math.min(W - PLAYER_R, p.x));
    p.y = Math.max(PLAYER_R + 40, Math.min(H - PLAYER_R - 40, p.y));

    const spawnInterval = Math.max(
      MIN_SPAWN_MS,
      SPAWN_BASE_MS - elapsedSec * SPAWN_RAMP_PER_SEC
    );
    if (now - lastSpawnRef.current > spawnInterval) {
      lastSpawnRef.current = now;
      trySpawnEnemy(now, p);
      if (Math.random() < 0.45) trySpawnCoin(now);
    }

    const speedMult = 1 + elapsedSec * SPEED_RAMP_PER_SEC;
    const graceActive = elapsed < START_GRACE_MS;
    const next: Entity[] = [];

    for (const e of entitiesRef.current) {
      const age = now - e.spawnedAt;

      if (e.kind === 'enemy') {
        if (age > ENEMY_LIFETIME_MS) continue;
        if (age > ENEMY_LIFETIME_MS - FADE_DURATION_MS) {
          e.opacity = Math.max(0, (ENEMY_LIFETIME_MS - age) / FADE_DURATION_MS);
          e.lethal = e.opacity > 0.55;
        } else {
          e.opacity = 1;
          e.lethal = true;
        }
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * BASE_ENEMY_SPEED * speedMult;
        e.y += (dy / d) * BASE_ENEMY_SPEED * speedMult;
      } else {
        if (age > COIN_LIFETIME_MS) continue;
        if (age > COIN_LIFETIME_MS - FADE_DURATION_MS) {
          e.opacity = Math.max(0, (COIN_LIFETIME_MS - age) / FADE_DURATION_MS);
        }
      }

      const distToPlayer = Math.hypot(e.x - p.x, e.y - p.y);
      if (distToPlayer < e.r + PLAYER_R) {
        if (e.kind === 'coin') {
          runCoinsRef.current += 1;
          setRunCoins(runCoinsRef.current);
          continue;
        } else if (e.lethal && !graceActive) {
          deadRef.current = true;
          addCoins(runCoinsRef.current);
          setTimeout(
            () => onGameOver(runCoinsRef.current, Math.floor(elapsedSec)),
            0
          );
          return;
        }
      }
      next.push(e);
    }
    entitiesRef.current = next;
  };

  const trySpawnEnemy = (now: number, p: { x: number; y: number }) => {
    let enemyCount = 0;
    for (const e of entitiesRef.current) if (e.kind === 'enemy') enemyCount++;
    if (enemyCount >= MAX_ENEMIES) return;

    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 6; attempt++) {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { x = Math.random() * W; y = -ENEMY_R; }
      else if (edge === 1) { x = W + ENEMY_R; y = Math.random() * H; }
      else if (edge === 2) { x = Math.random() * W; y = H + ENEMY_R; }
      else { x = -ENEMY_R; y = Math.random() * H; }

      if (Math.hypot(x - p.x, y - p.y) >= MIN_SPAWN_DISTANCE) break;
    }

    entitiesRef.current.push({
      id: NEXT_ID++,
      x, y,
      r: ENEMY_R,
      kind: 'enemy',
      spawnedAt: now,
      opacity: 1,
      lethal: true,
    });
  };

  const trySpawnCoin = (now: number) => {
    const x = 50 + Math.random() * (W - 100);
    const y = 100 + Math.random() * (H - 220);
    entitiesRef.current.push({
      id: NEXT_ID++,
      x, y,
      r: COIN_R,
      kind: 'coin',
      spawnedAt: now,
      opacity: 1,
      lethal: false,
    });
  };

  const onTouchStart = (e: GestureResponderEvent) => {
    touchRef.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
  };
  const onTouchMove = (e: GestureResponderEvent) => {
    touchRef.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
  };
  const onTouchEnd = () => {
    touchRef.current = null;
  };

  const p = playerRef.current;

  return (
    <View style={styles.container}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <Circle cx={p.x} cy={p.y} r={PLAYER_R + 8} color="#00f0ff" opacity={0.35}>
            <BlurMask blur={16} style="normal" />
          </Circle>
          <Circle cx={p.x} cy={p.y} r={PLAYER_R} color="#00f0ff" />
          <Circle cx={p.x} cy={p.y} r={PLAYER_R - 4} color="#ffffff" />
        </Group>

        {entitiesRef.current.map((e) =>
          e.kind === 'enemy' ? (
            <Group key={e.id} opacity={e.opacity}>
              <Circle cx={e.x} cy={e.y} r={e.r + 6} color="#ff0066" opacity={0.4}>
                <BlurMask blur={12} style="normal" />
              </Circle>
              <Circle cx={e.x} cy={e.y} r={e.r} color="#ff2277" />
            </Group>
          ) : (
            <Group key={e.id} opacity={e.opacity}>
              <Circle cx={e.x} cy={e.y} r={e.r + 5} color="#ffd700" opacity={0.45}>
                <BlurMask blur={10} style="normal" />
              </Circle>
              <Circle cx={e.x} cy={e.y} r={e.r} color="#ffd700" />
            </Group>
          )
        )}
      </Canvas>

      <View style={styles.hud} pointerEvents="none">
        <View style={[styles.hudBadge, styles.hudBadgeCyan]}>
          <Ionicons name="timer-outline" size={14} color={colors.cyan} />
          <Text style={[styles.hudText, { color: colors.cyan, textShadowColor: colors.cyan }]}>
            {score}s
          </Text>
        </View>
        <View style={[styles.hudBadge, styles.hudBadgeGold]}>
          <CoinIcon size={14} />
          <Text style={[styles.hudText, { color: colors.gold, textShadowColor: colors.gold }]}>
            +{runCoins}
          </Text>
        </View>
      </View>

      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderStart={onTouchStart}
        onResponderMove={onTouchMove}
        onResponderRelease={onTouchEnd}
        onResponderTerminate={onTouchEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hud: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 10, 26, 0.65)',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  hudBadgeCyan: {
    borderColor: 'rgba(0, 240, 255, 0.5)',
    shadowColor: colors.cyan,
    shadowOpacity: 0.4,
  },
  hudBadgeGold: {
    borderColor: 'rgba(255, 215, 0, 0.5)',
    shadowColor: colors.gold,
    shadowOpacity: 0.4,
  },
  hudText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
});
