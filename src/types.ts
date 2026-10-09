export type GameState = "READY" | "PLAYING" | "GAMEOVER";

export interface CharacterConfig {
  id: string;
  name: string;
  previewUrl: string;
  frameUrls: string[];
  frameDurationMs: number;
  hitRadius: number;
  width: number;
  height: number;
  particleColor: [number, number, number];
  description: string;
}

export interface PipePair {
  id: number;
  x: number;
  gapY: number;
  gapHeight: number;
  passed: boolean;
  coinCollected: boolean;
  topMesh: any;
  bottomMesh: any;
  coinMesh?: any;
}

export interface GameSettings {
  use3DPipes: boolean;
  soundEnabled: boolean;
}
