import { create } from 'zustand';
import { kv } from './storage';

const MAX_LIVES = 5;
const LIFE_REGEN_MS = 20 * 60 * 1000;

type State = {
  coins: number;
  lives: number;
  lastLifeLostAt: number;
  highScore: number;
  dailyBonusClaimedAt: number;
};

type Actions = {
  loadFromDisk: () => void;
  addCoins: (amount: number) => void;
  spendLife: () => boolean;
  refillLives: () => void;
  regenLives: () => void;
  setHighScore: (score: number) => void;
  claimDailyBonus: () => void;
  canClaimDailyBonus: () => boolean;
};

const persist = (s: State) => {
  kv.setNumber('coins', s.coins);
  kv.setNumber('lives', s.lives);
  kv.setNumber('lastLifeLostAt', s.lastLifeLostAt);
  kv.setNumber('highScore', s.highScore);
  kv.setNumber('dailyBonusClaimedAt', s.dailyBonusClaimedAt);
};

export const useGameStore = create<State & Actions>((set, get) => ({
  coins: 0,
  lives: MAX_LIVES,
  lastLifeLostAt: 0,
  highScore: 0,
  dailyBonusClaimedAt: 0,

  loadFromDisk: () => {
    const next: State = {
      coins: kv.getNumber('coins', 0),
      lives: kv.getNumber('lives', MAX_LIVES),
      lastLifeLostAt: kv.getNumber('lastLifeLostAt', 0),
      highScore: kv.getNumber('highScore', 0),
      dailyBonusClaimedAt: kv.getNumber('dailyBonusClaimedAt', 0),
    };
    set(next);
    get().regenLives();
  },

  addCoins: (amount) => {
    const coins = get().coins + amount;
    const s = { ...get(), coins };
    set({ coins });
    persist(s);
  },

  spendLife: () => {
    get().regenLives();
    const { lives } = get();
    if (lives <= 0) return false;
    const newLives = lives - 1;
    const lastLifeLostAt = newLives < MAX_LIVES ? Date.now() : 0;
    const s = { ...get(), lives: newLives, lastLifeLostAt };
    set({ lives: newLives, lastLifeLostAt });
    persist(s);
    return true;
  },

  refillLives: () => {
    const s = { ...get(), lives: MAX_LIVES, lastLifeLostAt: 0 };
    set({ lives: MAX_LIVES, lastLifeLostAt: 0 });
    persist(s);
  },

  regenLives: () => {
    const { lives, lastLifeLostAt } = get();
    if (lives >= MAX_LIVES || lastLifeLostAt === 0) return;
    const elapsed = Date.now() - lastLifeLostAt;
    const regenned = Math.floor(elapsed / LIFE_REGEN_MS);
    if (regenned <= 0) return;
    const newLives = Math.min(MAX_LIVES, lives + regenned);
    const newLast = newLives >= MAX_LIVES ? 0 : lastLifeLostAt + regenned * LIFE_REGEN_MS;
    const s = { ...get(), lives: newLives, lastLifeLostAt: newLast };
    set({ lives: newLives, lastLifeLostAt: newLast });
    persist(s);
  },

  setHighScore: (score) => {
    if (score <= get().highScore) return;
    const s = { ...get(), highScore: score };
    set({ highScore: score });
    persist(s);
  },

  canClaimDailyBonus: () => {
    const last = get().dailyBonusClaimedAt;
    if (last === 0) return true;
    return Date.now() - last >= 20 * 60 * 60 * 1000;
  },

  claimDailyBonus: () => {
    const s = { ...get(), dailyBonusClaimedAt: Date.now() };
    set({ dailyBonusClaimedAt: Date.now() });
    persist(s);
  },
}));

export const MS_PER_LIFE = LIFE_REGEN_MS;
export const MAX_LIVES_CONST = MAX_LIVES;
