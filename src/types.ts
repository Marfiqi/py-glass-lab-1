export type Difficulty = 1 | 2 | 3 | 4;

export interface CodeExample {
  title: string;
  code: string;
}

export interface Topic {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: Difficulty;
  icon: string; // glow hue key
  concepts: string[];
  examples: CodeExample[];
}

export interface GameDef {
  id: string;
  name: string;
  icon: string; // glow hue key
  tagline: string;
  color: string;
  code: string;
}

export interface ProfileState {
  xp: number;
  level: number;
  completedTopics: string[];
  totalRuns: number;
  gamesPlayed: number;
  streak: number;
  lastActive: string; // ISO date
  achievements: string[];
  highScores: Record<string, number>;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string; // glow hue key
  check: (p: ProfileState) => boolean;
}