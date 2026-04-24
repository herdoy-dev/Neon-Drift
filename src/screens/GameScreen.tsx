import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, GestureResponderEvent } from 'react-native';
import { Canvas, Circle, Group, BlurMask } from '@shopify/react-native-skia';
import { useGameStore } from '../gameStore';

const { width: W, height: H } = Dimensions.get('window');
const PLAYER_R = 14;
const ENEMY_R = 16;
const COIN_R = 10;
const BASE_ENEMY_SPEED = 1.2;
const PLAYER_SPEED = 5.5;
const SPAWN_BASE_MS = 900;
const SPEED_RAMP_PER_SEC = 0.035;

type Entity = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: 'enemy' | 'coin';
};

type Props = {
  onGameOver: (coins: number, score: number) => void;
};

let NEXT_ID = 1;

export function GameScreen({ onGameOver }: Props) {
  const addCoins = useGameStore((s) => s.addCoins);

  const [tick, setTick] = useState(0);
  const [score, setScore] = useState(0);
  const [runCoins, setRunCoins] = useState(0);

  const playerRef = useRef({ x: W / 2, y: H / 2 });
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const entitiesRef = useRef<Entity[]>([]);
  const startRef = useRef(Date.now());
  const lastSpawnRef = useRef(Date.now());
  const deadRef = useRef(false);
  const runCoinsRef = useRef(0);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      if (deadRef.current) return;
      stepFrame();
      setTick((t) => (t + 1) % 1e9);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stepFrame = () => {
    const now = Date.now();
    const elapsedSec = (now - startRef.current) / 1000;
    setScore(Math.floor(elapsedSec));

    // Player follows touch
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

    // Spawn logic
    const spawnInterval = Math.max(250, SPAWN_BASE_MS - elapsedSec * 18);
    if (now - lastSpawnRef.current > spawnInterval) {
      lastSpawnRef.current = now;
      spawnEnemy(elapsedSec);
      if (Math.random() < 0.35) spawnCoin();
    }

    // Update entities
    const speedMult = 1 + elapsedSec * SPEED_RAMP_PER_SEC;
    const next: Entity[] = [];
    for (const e of entitiesRef.current) {
      if (e.kind === 'enemy') {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * BASE_ENEMY_SPEED * speedMult;
        e.y += (dy / d) * BASE_ENEMY_SPEED * speedMult;
      } else {
        e.x += e.vx;
        e.y += e.vy;
        if (e.x < -30 || e.x > W + 30 || e.y < -30 || e.y > H + 30) continue;
      }

      const distToPlayer = Math.hypot(e.x - p.x, e.y - p.y);
      if (distToPlayer < e.r + PLAYER_R) {
        if (e.kind === 'coin') {
          runCoinsRef.current += 1;
          setRunCoins(runCoinsRef.current);
          continue;
        } else {
          deadRef.current = true;
          addCoins(runCoinsRef.current);
          setTimeout(() => onGameOver(runCoinsRef.current, Math.floor(elapsedSec)), 0);
          return;
        }
      }
      next.push(e);
    }
    entitiesRef.current = next;
  };

  const spawnEnemy = (elapsedSec: number) => {
    // Spawn from a random edge
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (edge === 0) { x = Math.random() * W; y = -ENEMY_R; }
    else if (edge === 1) { x = W + ENEMY_R; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = H + ENEMY_R; }
    else { x = -ENEMY_R; y = Math.random() * H; }
    entitiesRef.current.push({
      id: NEXT_ID++, x, y, vx: 0, vy: 0, r: ENEMY_R, kind: 'enemy',
    });
  };

  const spawnCoin = () => {
    const x = 50 + Math.random() * (W - 100);
    const y = 100 + Math.random() * (H - 220);
    entitiesRef.current.push({
      id: NEXT_ID++, x, y, vx: 0, vy: 0, r: COIN_R, kind: 'coin',
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
        {/* Player */}
        <Group>
          <Circle cx={p.x} cy={p.y} r={PLAYER_R + 8} color="#00f0ff" opacity={0.35}>
            <BlurMask blur={16} style="normal" />
          </Circle>
          <Circle cx={p.x} cy={p.y} r={PLAYER_R} color="#00f0ff" />
          <Circle cx={p.x} cy={p.y} r={PLAYER_R - 4} color="#ffffff" />
        </Group>

        {/* Entities */}
        {entitiesRef.current.map((e) =>
          e.kind === 'enemy' ? (
            <Group key={e.id}>
              <Circle cx={e.x} cy={e.y} r={e.r + 6} color="#ff0066" opacity={0.4}>
                <BlurMask blur={12} style="normal" />
              </Circle>
              <Circle cx={e.x} cy={e.y} r={e.r} color="#ff2277" />
            </Group>
          ) : (
            <Group key={e.id}>
              <Circle cx={e.x} cy={e.y} r={e.r + 5} color="#ffd700" opacity={0.45}>
                <BlurMask blur={10} style="normal" />
              </Circle>
              <Circle cx={e.x} cy={e.y} r={e.r} color="#ffd700" />
            </Group>
          )
        )}
      </Canvas>

      {/* HUD */}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.hudText}>SCORE {score}</Text>
        <Text style={styles.hudText}>+{runCoins}</Text>
      </View>

      {/* Touch overlay */}
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
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  hud: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  hudText: {
    color: '#00f0ff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.5,
    textShadowColor: '#00f0ff',
    textShadowRadius: 12,
  },
});
