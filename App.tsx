import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { GameOverScreen } from './src/screens/GameOverScreen';
import { useGameStore } from './src/gameStore';
import { useInterstitialAd } from './src/ads/useInterstitialAd';
import { useAppOpenAd } from './src/ads/useAppOpenAd';
import { ADS_ENABLED, adSDK } from './src/ads/provider';
import { INTERSTITIAL_GAMEOVER, APP_OPEN_UNIT } from './src/ads/adUnits';

type Scene =
  | { kind: 'home' }
  | { kind: 'game' }
  | { kind: 'gameover'; coins: number; score: number };

const INTERSTITIAL_EVERY = 3;
const INTERSTITIAL_MIN_GAP_MS = 2 * 60 * 1000;
const COLD_START_DELAY_MS = 60 * 1000;

export default function App() {
  const loadFromDisk = useGameStore((s) => s.loadFromDisk);
  const spendLife = useGameStore((s) => s.spendLife);
  const [scene, setScene] = useState<Scene>({ kind: 'home' });
  const [gameKey, setGameKey] = useState(0);

  const appStartRef = useRef(Date.now());
  const lastInterstitialRef = useRef(0);
  const gameOverCountRef = useRef(0);
  const sceneRef = useRef<Scene>(scene);
  sceneRef.current = scene;

  const interstitial = useInterstitialAd(INTERSTITIAL_GAMEOVER);

  const canShowAppOpen = useCallback(() => sceneRef.current.kind === 'home', []);
  useAppOpenAd({ unitId: APP_OPEN_UNIT, canShow: canShowAppOpen });

  useEffect(() => {
    loadFromDisk();
    if (ADS_ENABLED && adSDK) {
      const { default: mobileAds, MaxAdContentRating } = adSDK;
      mobileAds()
        .setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.T,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        })
        .then(() => mobileAds().initialize())
        .catch(() => {});
    }
  }, [loadFromDisk]);

  const startGame = () => {
    if (!spendLife()) return;
    setGameKey((k) => k + 1);
    setScene({ kind: 'game' });
  };

  const onGameOver = (coins: number, score: number) => {
    gameOverCountRef.current += 1;
    setScene({ kind: 'gameover', coins, score });
  };

  const onRevive = () => {
    setGameKey((k) => k + 1);
    setScene({ kind: 'game' });
  };

  const goHome = () => {
    const now = Date.now();
    const sinceStart = now - appStartRef.current;
    const sinceLastAd = now - lastInterstitialRef.current;
    const countHit = gameOverCountRef.current > 0 && gameOverCountRef.current % INTERSTITIAL_EVERY === 0;
    const coldStartOk = sinceStart > COLD_START_DELAY_MS;
    const gapOk = sinceLastAd > INTERSTITIAL_MIN_GAP_MS;

    if (countHit && coldStartOk && gapOk && interstitial.loaded) {
      lastInterstitialRef.current = now;
      interstitial.show(() => setScene({ kind: 'home' }));
      return;
    }
    setScene({ kind: 'home' });
  };

  return (
    <>
      <StatusBar style="light" />
      {scene.kind === 'home' && <HomeScreen onPlay={startGame} />}
      {scene.kind === 'game' && (
        <GameScreen key={gameKey} onGameOver={onGameOver} />
      )}
      {scene.kind === 'gameover' && (
        <GameOverScreen
          coinsEarned={scene.coins}
          score={scene.score}
          onRevive={onRevive}
          onHome={goHome}
        />
      )}
    </>
  );
}
