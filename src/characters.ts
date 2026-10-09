import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3
} from "@babylonjs/core";
import { CharacterConfig } from "./types";

export const CHARACTERS: CharacterConfig[] = [
  {
    id: "bird",
    name: "Classic Bird",
    previewUrl: "./assets/characters/bird1.png",
    frameUrls: [
      "./assets/characters/bird1.png",
      "./assets/characters/bird2.png",
      "./assets/characters/bird3.png"
    ],
    frameDurationMs: 110,
    hitRadius: 0.45,
    width: 1.2,
    height: 1.2,
    particleColor: [0.2, 0.7, 1.0],
    description: "Flotter blauer Arcade-Vogel"
  },
  {
    id: "alien",
    name: "Alien",
    previewUrl: "./assets/characters/alien1.png",
    frameUrls: [
      "./assets/characters/alien1.png",
      "./assets/characters/alien2.png",
      "./assets/characters/alien3.png",
      "./assets/characters/alien4.png"
    ],
    frameDurationMs: 120,
    hitRadius: 0.44,
    width: 1.15,
    height: 1.15,
    particleColor: [0.1, 1.0, 0.4],
    description: "Aus FlyingBambam — kosmischer Springer"
  },
  {
    id: "dragon",
    name: "Dragon",
    previewUrl: "./assets/characters/dragon1.png",
    frameUrls: [
      "./assets/characters/dragon1.png",
      "./assets/characters/dragon2.png",
      "./assets/characters/dragon3.png",
      "./assets/characters/dragon4.png"
    ],
    frameDurationMs: 130,
    hitRadius: 0.52,
    width: 1.4,
    height: 1.4,
    particleColor: [1.0, 0.4, 0.1],
    description: "Aus FlyingBambam — feuriger Gleiter"
  },
  {
    id: "wasp",
    name: "Wasp",
    previewUrl: "./assets/characters/wasp1.png",
    frameUrls: [
      "./assets/characters/wasp1.png",
      "./assets/characters/wasp2.png",
      "./assets/characters/wasp3.png",
      "./assets/characters/wasp4.png"
    ],
    frameDurationMs: 70,
    hitRadius: 0.4,
    width: 1.05,
    height: 1.05,
    particleColor: [1.0, 0.85, 0.1],
    description: "Aus FlyingBambam — rasante Flügelschläge"
  }
];

export class CharacterController {
  private scene: Scene;
  private currentConfig: CharacterConfig;
  private planeMesh: Mesh | null = null;
  private material: StandardMaterial | null = null;
  private textures: Texture[] = [];
  private currentFrameIndex: number = 0;
  private animationTimerMs: number = 0;

  constructor(scene: Scene, initialConfig: CharacterConfig = CHARACTERS[0]) {
    this.scene = scene;
    this.currentConfig = initialConfig;
  }

  public setCharacter(config: CharacterConfig) {
    this.currentConfig = config;
    this.cleanup();
    this.buildMesh();
  }

  public getConfig(): CharacterConfig {
    return this.currentConfig;
  }

  public getMesh(): Mesh | null {
    return this.planeMesh;
  }

  private cleanup() {
    this.textures.forEach((t) => t.dispose());
    this.textures = [];
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    if (this.planeMesh) {
      this.planeMesh.dispose();
      this.planeMesh = null;
    }
  }

  public buildMesh() {
    // 1. Preload frame textures with crisp pixel art sampling
    this.textures = this.currentConfig.frameUrls.map((url) => {
      const tex = new Texture(
        url,
        this.scene,
        true, // noMipmap
        false, // invertY
        Texture.NEAREST_SAMPLINGMODE
      );
      tex.hasAlpha = true;
      return tex;
    });

    // 2. Material
    this.material = new StandardMaterial(`playerMat_${this.currentConfig.id}`, this.scene);
    this.material.diffuseTexture = this.textures[0];
    this.material.useAlphaFromDiffuseTexture = true;
    this.material.diffuseColor = new Color3(1, 1, 1);
    this.material.emissiveColor = new Color3(0.2, 0.2, 0.2);
    this.material.specularColor = new Color3(0, 0, 0);
    this.material.backFaceCulling = false;

    // 3. Mesh
    this.planeMesh = MeshBuilder.CreatePlane(
      "playerPlane",
      {
        width: this.currentConfig.width,
        height: this.currentConfig.height
      },
      this.scene
    );
    this.planeMesh.material = this.material;
    this.planeMesh.position.set(0, 0, 0);
    this.currentFrameIndex = 0;
    this.animationTimerMs = 0;
  }

  public updateAnimation(deltaMs: number, isDivingFast: boolean = false) {
    if (!this.material || this.textures.length <= 1) return;

    // Slow down wing flap when falling fast
    const frameRate = isDivingFast ? this.currentConfig.frameDurationMs * 2.2 : this.currentConfig.frameDurationMs;
    this.animationTimerMs += deltaMs;

    if (this.animationTimerMs >= frameRate) {
      this.animationTimerMs = 0;
      this.currentFrameIndex = (this.currentFrameIndex + 1) % this.textures.length;
      this.material.diffuseTexture = this.textures[this.currentFrameIndex];
    }
  }

  public setPosition(x: number, y: number) {
    if (this.planeMesh) {
      this.planeMesh.position.x = x;
      this.planeMesh.position.y = y;
    }
  }

  public setRotation(angleRad: number) {
    if (this.planeMesh) {
      this.planeMesh.rotation.z = angleRad;
    }
  }

  public setVisible(visible: boolean) {
    if (this.planeMesh) {
      this.planeMesh.isVisible = visible;
    }
  }
}
