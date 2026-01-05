
export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vector2;
  vel: Vector2;
  width: number;
  height: number;
}

export type AbilityType = 'double_jump' | 'multi_dash' | 'speed_boost';

export interface Player extends Entity {
  dashes: number;
  maxDashes: number;
  airJumps: number;
  maxAirJumps: number;
  isDashing: boolean;
  dashTimer: number;
  dashDir: Vector2;
  onGround: boolean;
  onWall: 'left' | 'right' | null;
  coyoteTimer: number; // Tempo de tolerância após cair
  jumpBufferTimer: number; // Tempo de reserva do input de pulo
  state: 'idle' | 'run' | 'jump' | 'dash' | 'fall' | 'climb';
  facing: 1 | -1;
  lastSafePos: Vector2;
  abilities: AbilityType[];
}

export type TileType = 0 | 1 | 2 | 3 | 4; 

export interface GameLevel {
  id: number;
  name: string;
  grid: TileType[][];
  spawn: Vector2;
}

export interface Progression {
  level: number;
  xp: number;
  shards: number;
  unlockedAbilities: AbilityType[];
}

export interface GameState {
  deaths: number;
  currentLevelIndex: number;
  isGameOver: boolean;
  message: string;
  progression: Progression;
  showShop: boolean;
}
