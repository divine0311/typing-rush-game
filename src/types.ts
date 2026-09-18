export type GameStateType = 'START' | 'LEVEL_SELECT' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEVEL_COMPLETE' | 'VICTORY';

export interface UIState {
  state: GameStateType;
  score: number;
  lives: number;
  level: number;
  combo: number;
  accuracy: number;
  wpm: number;
  message?: string;
  targetWord?: string;
  typedWord?: string;
  highScore?: number;
  activeBuffs?: {
    freeze?: number;
    double?: number;
    shield?: boolean;
  };
}

export interface Enemy {
  id: string;
  word: string;
  typed: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'Scout' | 'Fighter' | 'Bomber' | 'Boss';
  radius: number;
  maxHealth: number;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Laser {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  enemyId: string;
}

export interface Powerup {
  id: string;
  type: 'Freeze' | 'Bomb' | 'Double' | 'Shield';
  word: string;
  typed: string;
  x: number;
  y: number;
  vy: number;
  radius: number;
  color: string;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  color: string;
}
