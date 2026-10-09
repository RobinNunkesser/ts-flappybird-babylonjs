import {
  Engine,
  Scene,
  TargetCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  Color4,
  Color3
} from "@babylonjs/core";
import { GameState, CharacterConfig } from "./types";
import { CharacterController, CHARACTERS } from "./characters";
import { BackgroundController } from "./background";
import { PipeManager } from "./pipes";
import { ParticleController } from "./particles";
import { SoundController } from "./audio";

export class FlappyGame {
  private engine: Engine;
  private scene: Scene;
  private camera: TargetCamera;
  private lightHemi: HemisphericLight;
  private lightDir: DirectionalLight;

  // Controllers
  public characterCtrl: CharacterController;
  public backgroundCtrl: BackgroundController;
  public pipeManager: PipeManager;
  public particleCtrl: ParticleController;
  public soundCtrl: SoundController;

  // Physics constants
  private readonly PLAYER_X = -3.5;
  private readonly GRAVITY = -23.0;
  private readonly JUMP_IMPULSE = 7.6;
  private readonly TERMINAL_VELOCITY = -13.0;

  // State
  private state: GameState = "READY";
  private playerY: number = 0;
  private playerVy: number = 0;
  private playerRotation: number = 0;
  private readyFloatTimer: number = 0;
  private score: number = 0;
  private bestScore: number = 0;

  // Camera shake on hit
  private shakeTimer: number = 0;
  private originalCameraPos: Vector3;

  // Callbacks
  public onScoreChanged?: (score: number) => void;
  public onGameOver?: (score: number, bestScore: number) => void;
  public onStateChanged?: (state: GameState) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.04, 0.06, 0.1, 1.0);

    // Camera setup
    this.camera = new TargetCamera("mainCamera", new Vector3(0, 0.2, -13.5), this.scene);
    this.camera.setTarget(new Vector3(0, 0.2, 0));
    this.camera.fov = 0.72; // ~41 degrees vertical FOV
    this.originalCameraPos = this.camera.position.clone();

    // Lighting
    this.lightHemi = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), this.scene);
    this.lightHemi.intensity = 0.95;
    this.lightHemi.groundColor = new Color3(0.3, 0.35, 0.45);

    this.lightDir = new DirectionalLight("dirLight", new Vector3(1, -2, 1), this.scene);
    this.lightDir.intensity = 0.65;

    // Load persisted high score
    const saved = localStorage.getItem("flappy_3d_highscore");
    if (saved) {
      this.bestScore = parseInt(saved, 10) || 0;
    }

    // Initialize systems
    this.soundCtrl = new SoundController();
    this.particleCtrl = new ParticleController(this.scene);
    this.backgroundCtrl = new BackgroundController(this.scene);
    this.pipeManager = new PipeManager(this.scene, true);
    this.characterCtrl = new CharacterController(this.scene, CHARACTERS[0]);
    this.characterCtrl.buildMesh();

    this.resetToReady();
    this.startRenderLoop();
  }

  public getScore(): number {
    return this.score;
  }

  public getBestScore(): number {
    return this.bestScore;
  }

  public getState(): GameState {
    return this.state;
  }

  public setCharacter(config: CharacterConfig) {
    this.characterCtrl.setCharacter(config);
    this.characterCtrl.setPosition(this.PLAYER_X, this.playerY);
  }

  public toggle3DPipes(): boolean {
    const newVal = !this.pipeManager.is3DMode();
    this.pipeManager.set3DMode(newVal);
    return newVal;
  }

  public resetToReady() {
    this.state = "READY";
    this.playerY = 0.5;
    this.playerVy = 0;
    this.playerRotation = 0;
    this.readyFloatTimer = 0;
    this.score = 0;
    this.shakeTimer = 0;
    this.camera.position.copyFrom(this.originalCameraPos);

    this.characterCtrl.setPosition(this.PLAYER_X, this.playerY);
    this.characterCtrl.setRotation(0);
    this.characterCtrl.setVisible(true);

    this.pipeManager.reset();
    this.onScoreChanged?.(this.score);
    this.onStateChanged?.(this.state);
  }

  public startGame() {
    if (this.state === "PLAYING") return;
    this.soundCtrl.init();
    this.soundCtrl.playBgm();
    this.state = "PLAYING";
    this.flap();
    this.onStateChanged?.(this.state);
  }

  public flap() {
    this.soundCtrl.init();
    if (this.state === "READY") {
      this.startGame();
      return;
    }
    if (this.state !== "PLAYING") return;

    this.playerVy = this.JUMP_IMPULSE;
    this.playerRotation = 0.42; // Upward pitch (+24 deg)

    // Sound and particle trail
    this.soundCtrl.playSound("flap", 0.08);
    const config = this.characterCtrl.getConfig();
    this.particleCtrl.emitFlapPuff(
      new Vector3(this.PLAYER_X, this.playerY, 0),
      config.particleColor
    );
  }

  private triggerGameOver() {
    if (this.state === "GAMEOVER") return;
    this.state = "GAMEOVER";
    this.shakeTimer = 0.35; // 350ms camera shake

    this.soundCtrl.playSound("hit");
    this.soundCtrl.pauseBgm();

    // Spawn crash particles
    this.particleCtrl.emitCrashBurst(new Vector3(this.PLAYER_X, this.playerY, 0));

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem("flappy_3d_highscore", this.bestScore.toString());
    }

    this.onGameOver?.(this.score, this.bestScore);
    this.onStateChanged?.(this.state);
  }

  private onPipePassed = () => {
    this.score += 1;
    this.soundCtrl.playSound("click");
    this.onScoreChanged?.(this.score);
  };

  private onCoinCollected = () => {
    this.score += 2; // Bonus +2 for coins!
    this.soundCtrl.playSound("coin", 0.02);
    this.particleCtrl.emitCoinBurst(new Vector3(this.PLAYER_X + 0.6, this.playerY, 0));
    this.onScoreChanged?.(this.score);
  };

  private update(deltaSec: number) {
    const deltaMs = deltaSec * 1000;

    // 1. Camera Shake decay
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaSec;
      const mag = (this.shakeTimer / 0.35) * 0.25;
      this.camera.position.x = this.originalCameraPos.x + (Math.random() * 2 - 1) * mag;
      this.camera.position.y = this.originalCameraPos.y + (Math.random() * 2 - 1) * mag;
    } else {
      this.camera.position.copyFrom(this.originalCameraPos);
    }

    // 2. State-specific updates
    if (this.state === "READY") {
      this.readyFloatTimer += deltaSec * 4.5;
      this.playerY = 0.5 + Math.sin(this.readyFloatTimer) * 0.28;
      this.playerRotation = Math.cos(this.readyFloatTimer) * 0.08;

      this.characterCtrl.setPosition(this.PLAYER_X, this.playerY);
      this.characterCtrl.setRotation(this.playerRotation);
      this.characterCtrl.updateAnimation(deltaMs);

      // Gentle parallax idle scroll
      this.backgroundCtrl.update(deltaSec, false);
      return;
    }

    if (this.state === "PLAYING") {
      // Apply gravity
      this.playerVy += this.GRAVITY * deltaSec;
      if (this.playerVy < this.TERMINAL_VELOCITY) {
        this.playerVy = this.TERMINAL_VELOCITY;
      }
      this.playerY += this.playerVy * deltaSec;

      // Pitch rotation smoothly slerps toward dive
      if (this.playerVy < 0) {
        const diveTarget = -1.15; // -66 degrees dive
        this.playerRotation += (diveTarget - this.playerRotation) * (deltaSec * 4.2);
      }

      this.characterCtrl.setPosition(this.PLAYER_X, this.playerY);
      this.characterCtrl.setRotation(this.playerRotation);
      this.characterCtrl.updateAnimation(deltaMs, this.playerVy < -6.0);

      // Parallax update
      this.backgroundCtrl.update(deltaSec, true);

      // Pipes update
      this.pipeManager.update(deltaSec, this.PLAYER_X, this.onPipePassed);

      // Check coins
      const hitRadius = this.characterCtrl.getConfig().hitRadius;
      this.pipeManager.checkCoinCollection(this.PLAYER_X, this.playerY, hitRadius, this.onCoinCollected);

      // Check pipe collisions
      if (this.pipeManager.checkCollision(this.PLAYER_X, this.playerY, hitRadius)) {
        this.triggerGameOver();
        return;
      }

      // Check floor and ceiling collisions
      const groundY = this.backgroundCtrl.getGroundY();
      const ceilingY = this.backgroundCtrl.getCeilingY();

      if (this.playerY - hitRadius <= groundY) {
        this.playerY = groundY + hitRadius;
        this.characterCtrl.setPosition(this.PLAYER_X, this.playerY);
        this.triggerGameOver();
        return;
      }

      if (this.playerY + hitRadius >= ceilingY) {
        this.playerY = ceilingY - hitRadius;
        this.playerVy = 0;
      }
    }

    if (this.state === "GAMEOVER") {
      // Free fall to ground if still in air
      const groundY = this.backgroundCtrl.getGroundY();
      const hitRadius = this.characterCtrl.getConfig().hitRadius;

      if (this.playerY - hitRadius > groundY) {
        this.playerVy += this.GRAVITY * 1.5 * deltaSec;
        this.playerY += this.playerVy * deltaSec;
        if (this.playerY - hitRadius <= groundY) {
          this.playerY = groundY + hitRadius;
        }
        this.playerRotation = -1.3;
        this.characterCtrl.setPosition(this.PLAYER_X, this.playerY);
        this.characterCtrl.setRotation(this.playerRotation);
      }
    }
  }

  private startRenderLoop() {
    this.engine.runRenderLoop(() => {
      const deltaSec = Math.min(this.engine.getDeltaTime() / 1000, 0.05); // cap delta to prevent tunneling
      this.update(deltaSec);
      this.scene.render();
    });

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }
}
