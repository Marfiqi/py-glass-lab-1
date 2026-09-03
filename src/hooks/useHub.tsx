import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProfileState } from "../types";

const STORAGE_KEY = "python3hub_profile";

const DEFAULT_PROFILE: ProfileState = {
  xp: 0,
  level: 1,
  completedTopics: [],
  totalRuns: 0,
  gamesPlayed: 0,
  streak: 1,
  lastActive: new Date().toDateString(),
  achievements: [],
  highScores: {},
};

interface HubContextValue {
  profile: ProfileState;
  earned: string[];
  addXp: (amount: number) => void;
  completeTopic: (id: string) => void;
  registerRun: () => void;
  registerGame: (gameId: string, score: number) => void;
  resetProgress: () => void;
  streakDays: number;
}

const HubContext = createContext<HubContextValue | null>(null);

function calculateStreak(stored: Partial<ProfileState>): { streak: number; lastActive: string } {
  const today = new Date().toDateString();
  const last = stored.lastActive;
  if (!last) return { streak: 1, lastActive: today };
  if (last === today) return { streak: stored.streak ?? 1, lastActive: today };

  const lastDate = new Date(last);
  const curDate = new Date(today);
  const diffTime = curDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 1) {
    return { streak: (stored.streak ?? 1) + 1, lastActive: today };
  } else if (diffDays > 1) {
    return { streak: 1, lastActive: today };
  }
  return { streak: stored.streak ?? 1, lastActive: today };
}

function loadProfile(): ProfileState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<ProfileState>) };
    const streakInfo = calculateStreak(parsed);
    return { ...parsed, streak: streakInfo.streak, lastActive: streakInfo.lastActive };
  } catch {
    return DEFAULT_PROFILE;
  }
}

const lastXp = new Map<number, { before: number; after: number; earned: string[] }>();

export function HubProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileState>(loadProfile);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* storage unavailable */
    }
  }, [profile]);

  const addXp = useCallback((amount: number) => {
    setProfile((prev) => ({ ...prev, xp: prev.xp + amount }));
    lastXp.set(Date.now(), { before: profile.xp, after: profile.xp + amount, earned: [] });
  }, [profile.xp]);

  const completeTopic = useCallback((id: string) => {
    setProfile((prev) => {
      if (prev.completedTopics.includes(id)) return prev;
      return { ...prev, completedTopics: [...prev.completedTopics, id], xp: prev.xp + 30 };
    });
  }, []);

  const registerRun = useCallback(() => {
    setProfile((prev) => ({ ...prev, totalRuns: prev.totalRuns + 1, xp: prev.xp + 5 }));
  }, []);

  const registerGame = useCallback((gameId: string, score: number) => {
    setProfile((prev) => {
      const best = Math.max(prev.highScores[gameId] ?? 0, score);
      return { ...prev, gamesPlayed: prev.gamesPlayed + 1, highScores: { ...prev.highScores, [gameId]: best }, xp: prev.xp + 10 };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
  }, []);

  const value = useMemo<HubContextValue>(
    () => ({ profile, earned: [], addXp, completeTopic, registerRun, registerGame, resetProgress, streakDays: profile.streak }),
    [profile, addXp, completeTopic, registerRun, registerGame, resetProgress],
  );

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub(): HubContextValue {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error("useHub must be used within HubProvider");
  return ctx;
}

export function levelFromXp(xp: number): { level: number; xpInLevel: number; xpNext: number; pct: number } {
  const level = Math.floor(xp / 200) + 1;
  const xpInLevel = xp % 200;
  return { level, xpInLevel, xpNext: 200, pct: Math.min(100, Math.round((xpInLevel / 200) * 100)) };
}

export { lastXp };