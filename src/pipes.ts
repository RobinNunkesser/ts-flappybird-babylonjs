import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3
} from "@babylonjs/core";
import { PipePair } from "./types";

export class PipeManager {
  private scene: Scene;
  private pipes: PipePair[] = [];
  private pipeWidth: number = 1.2;
  private gapHeight: number = 3.2;
  private spacing: number = 6.2;
  private scrollSpeed: number = 3.5;
  private nextId: number = 1;
  private use3DPipes: boolean = true;

  // Materials
  private mat3D: StandardMaterial | null = null;
  private mat3DRim: StandardMaterial | null = null;
  private mat2D: StandardMaterial | null = null;
  private matCoin: StandardMaterial | null = null;

  constructor(scene: Scene, use3DPipes: boolean = true) {
    this.scene = scene;
    this.use3DPipes = use3DPipes;
    this.initMaterials();
  }

  private initMaterials() {
    // 3D Pipe Material
    this.mat3D = new StandardMaterial("matPipe3D", this.scene);
    this.mat3D.diffuseColor = new Color3(0.18, 0.8, 0.44); // Arcade Green
    this.mat3D.specularColor = new Color3(0.5, 0.9, 0.6);
    this.mat3D.emissiveColor = new Color3(0.06, 0.25, 0.12);

    this.mat3DRim = new StandardMaterial("matPipeRim3D", this.scene);
    this.mat3DRim.diffuseColor = new Color3(0.12, 0.95, 0.5);
    this.mat3DRim.specularColor = new Color3(0.9, 1.0, 0.9);
    this.mat3DRim.emissiveColor = new Color3(0.08, 0.35, 0.16);

    // 2D Sprite Material
    const tex2D = new Texture("./assets/environment/Obstacle.png", this.scene, true, true);
    this.mat2D = new StandardMaterial("matPipe2D", this.scene);
    this.mat2D.diffuseTexture = tex2D;
    this.mat2D.useAlphaFromDiffuseTexture = true;
    this.mat2D.emissiveColor = new Color3(0.5, 0.5, 0.5);
    this.mat2D.backFaceCulling = false;

    // Coin Material
    this.matCoin = new StandardMaterial("matCoin", this.scene);
    this.matCoin.diffuseColor = new Color3(1.0, 0.84, 0.0);
    this.matCoin.specularColor = new Color3(1.0, 1.0, 0.8);
    this.matCoin.emissiveColor = new Color3(0.4, 0.32, 0.0);
  }

  public set3DMode(enabled: boolean) {
    this.use3DPipes = enabled;
    this.reset();
  }

  public is3DMode(): boolean {
    return this.use3DPipes;
  }

  public reset() {
    this.disposeAll();
    this.pipes = [];

    // Spawn 4 initial pipe pairs spread ahead
    const startX = 8.0;
    for (let i = 0; i < 4; i++) {
      const x = startX + i * this.spacing;
      const gapY = this.getRandomGapY();
      this.createPipePair(x, gapY);
    }
  }

  private getRandomGapY(): number {
    // Gap centered between -1.5 and +2.0
    return -1.5 + Math.random() * 3.5;
  }

  private createPipePair(x: number, gapY: number) {
    const topYLimit = 5.5;
    const botYLimit = -4.1;

    // Top pipe geometry
    const topPipeHeight = topYLimit - (gapY + this.gapHeight / 2);
    const topPipeCenterY = gapY + this.gapHeight / 2 + topPipeHeight / 2;

    // Bottom pipe geometry
    const botPipeHeight = gapY - this.gapHeight / 2 - botYLimit;
    const botPipeCenterY = botYLimit + botPipeHeight / 2;

    let topMesh: Mesh;
    let botMesh: Mesh;

    if (this.use3DPipes) {
      // 3D Cylinders with Rim Lips
      topMesh = this.build3DPipeMesh(`topPipe_${this.nextId}`, topPipeHeight, true);
      botMesh = this.build3DPipeMesh(`botPipe_${this.nextId}`, botPipeHeight, false);
    } else {
      // 2D Sprite Planes
      topMesh = MeshBuilder.CreatePlane(`topPipe_${this.nextId}`, { width: this.pipeWidth, height: topPipeHeight }, this.scene);
      topMesh.material = this.mat2D;
      topMesh.rotation.z = Math.PI; // Invert for top pipe

      botMesh = MeshBuilder.CreatePlane(`botPipe_${this.nextId}`, { width: this.pipeWidth, height: botPipeHeight }, this.scene);
      botMesh.material = this.mat2D;
    }

    topMesh.position.set(x, topPipeCenterY, 0);
    botMesh.position.set(x, botPipeCenterY, 0);

    // Floating Collectible Coin
    const coin = MeshBuilder.CreateCylinder(`coin_${this.nextId}`, { diameter: 0.7, height: 0.12, tessellation: 24 }, this.scene);
    coin.rotation.x = Math.PI / 2;
    coin.material = this.matCoin;
    coin.position.set(x, gapY, 0);

    this.pipes.push({
      id: this.nextId++,
      x,
      gapY,
      gapHeight: this.gapHeight,
      passed: false,
      coinCollected: false,
      topMesh,
      bottomMesh: botMesh,
      coinMesh: coin
    });
  }

  private build3DPipeMesh(name: string, height: number, isTop: boolean): Mesh {
    const root = new Mesh(name, this.scene);
    const bodyHeight = Math.max(0.1, height - 0.4);
    const body = MeshBuilder.CreateCylinder(`${name}_body`, { diameter: 1.05, height: bodyHeight, tessellation: 24 }, this.scene);
    body.material = this.mat3D;
    body.parent = root;

    const rim = MeshBuilder.CreateCylinder(`${name}_rim`, { diameter: 1.25, height: 0.45, tessellation: 24 }, this.scene);
    rim.material = this.mat3DRim;
    rim.parent = root;

    if (isTop) {
      body.position.y = 0.2;
      rim.position.y = -height / 2 + 0.22;
    } else {
      body.position.y = -0.2;
      rim.position.y = height / 2 - 0.22;
    }

    return root;
  }

  public update(deltaSec: number, playerX: number, onScore: () => void) {
    for (let i = 0; i < this.pipes.length; i++) {
      const p = this.pipes[i];
      p.x -= this.scrollSpeed * deltaSec;
      p.topMesh.position.x = p.x;
      p.bottomMesh.position.x = p.x;

      if (p.coinMesh && !p.coinCollected) {
        p.coinMesh.position.x = p.x;
        // Spin the coin
        p.coinMesh.rotation.y += deltaSec * 3.5;
      }

      // Check passing player for score
      if (!p.passed && p.x < playerX) {
        p.passed = true;
        onScore();
      }
    }

    // Recycle pipes that scrolled off left screen
    if (this.pipes.length > 0 && this.pipes[0].x < -9.0) {
      const recycled = this.pipes.shift()!;
      this.disposePair(recycled);

      // Find the furthest pipe on the right
      const lastX = this.pipes[this.pipes.length - 1].x;
      const newX = lastX + this.spacing;
      const newGapY = this.getRandomGapY();
      this.createPipePair(newX, newGapY);
    }
  }

  public checkCollision(playerX: number, playerY: number, hitRadius: number): boolean {
    const halfWidth = this.pipeWidth * 0.48;

    for (const p of this.pipes) {
      // Check horizontal overlap
      if (playerX + hitRadius > p.x - halfWidth && playerX - hitRadius < p.x + halfWidth) {
        const topEdge = p.gapY + p.gapHeight / 2;
        const bottomEdge = p.gapY - p.gapHeight / 2;

        // Hit top pipe or bottom pipe
        if (playerY + hitRadius > topEdge || playerY - hitRadius < bottomEdge) {
          return true;
        }
      }
    }
    return false;
  }

  public checkCoinCollection(playerX: number, playerY: number, hitRadius: number, onCoinCollect: () => void) {
    for (const p of this.pipes) {
      if (!p.coinCollected && p.coinMesh) {
        const dx = playerX - p.x;
        const dy = playerY - p.gapY;
        const distSq = dx * dx + dy * dy;
        const triggerRadius = hitRadius + 0.5;

        if (distSq < triggerRadius * triggerRadius) {
          p.coinCollected = true;
          p.coinMesh.dispose();
          p.coinMesh = undefined;
          onCoinCollect();
        }
      }
    }
  }

  private disposePair(p: PipePair) {
    if (p.topMesh) p.topMesh.dispose(false, true);
    if (p.bottomMesh) p.bottomMesh.dispose(false, true);
    if (p.coinMesh) p.coinMesh.dispose();
  }

  public disposeAll() {
    for (const p of this.pipes) {
      this.disposePair(p);
    }
    this.pipes = [];
  }
}
