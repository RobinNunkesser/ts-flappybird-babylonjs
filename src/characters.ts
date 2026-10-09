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
    id: "steampunk_owl",
    name: "Steampunk-Kauz",
    previewUrl: "./assets/characters/owl_preview.png",
    frameUrls: [
      "./assets/characters/owl1.png",
      "./assets/characters/owl2.png",
      "./assets/characters/owl3.png",
      "./assets/characters/owl4.png"
    ],
    frameDurationMs: 110,
    hitRadius: 0.48,
    width: 1.35,
    height: 1.35,
    particleColor: [0.95, 0.65, 0.15],
    description: "Weg B: KI-generiertes 2D-Spritesheet (Messing & Dampf)"
  },
  {
    id: "cyber_drone",
    name: "Cyber-Drohne (3D)",
    previewUrl: "./assets/characters/drone_preview.png",
    frameUrls: [],
    frameDurationMs: 60,
    hitRadius: 0.46,
    width: 1.3,
    height: 1.1,
    particleColor: [0.0, 0.9, 1.0],
    description: "Weg A: Prozeduraler 3D-Käfer mit Gelenkschwingen & Plasma",
    is3D: true
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

  // 2D Mesh components
  private planeMesh: Mesh | null = null;
  private material: StandardMaterial | null = null;
  private textures: Texture[] = [];
  private currentFrameIndex: number = 0;
  private animationTimerMs: number = 0;

  // 3D Procedural components (Weg A)
  private root3D: Mesh | null = null;
  private wingFront: Mesh | null = null;
  private wingBack: Mesh | null = null;
  private flameMesh: Mesh | null = null;
  private wingFlapPhase: number = 0;

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
    return this.currentConfig.is3D ? this.root3D : this.planeMesh;
  }

  private cleanup() {
    // 2D Cleanup
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

    // 3D Cleanup
    if (this.root3D) {
      this.root3D.dispose(false, true);
      this.root3D = null;
      this.wingFront = null;
      this.wingBack = null;
      this.flameMesh = null;
    }
  }

  public buildMesh() {
    if (this.currentConfig.is3D) {
      this.build3DProceduralDrone();
    } else {
      this.build2DSpritePlane();
    }
  }

  // --- Weg B / 2D Sprite Plane ---
  private build2DSpritePlane() {
    this.textures = this.currentConfig.frameUrls.map((url) => {
      const tex = new Texture(
        url,
        this.scene,
        true, // noMipmap
        true, // invertY: true ensures sprite renders right side up
        Texture.NEAREST_SAMPLINGMODE
      );
      tex.hasAlpha = true;
      return tex;
    });

    this.material = new StandardMaterial(`playerMat_${this.currentConfig.id}`, this.scene);
    this.material.diffuseTexture = this.textures[0];
    this.material.useAlphaFromDiffuseTexture = true;
    this.material.diffuseColor = new Color3(1, 1, 1);
    this.material.emissiveColor = new Color3(0.2, 0.2, 0.2);
    this.material.specularColor = new Color3(0, 0, 0);
    this.material.backFaceCulling = false;

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

  // --- Weg A / 3D Procedural Cyber Drone Beetle ---
  private build3DProceduralDrone() {
    this.root3D = new Mesh("playerRoot3D", this.scene);

    // 1. Aerodynamic Cyber Chassis
    const matChassis = new StandardMaterial("matDroneChassis", this.scene);
    matChassis.diffuseColor = new Color3(0.08, 0.12, 0.18); // Dark Titanium
    matChassis.specularColor = new Color3(0.0, 0.8, 1.0);  // Cyan sheen
    matChassis.emissiveColor = new Color3(0.02, 0.04, 0.08);

    const body = MeshBuilder.CreateSphere(
      "droneFuselage",
      { diameterX: 1.25, diameterY: 0.65, diameterZ: 0.75, segments: 16 },
      this.scene
    );
    body.material = matChassis;
    body.parent = this.root3D;

    // Shell Plates (Upper beetle carapace)
    const matCarapace = new StandardMaterial("matDroneCarapace", this.scene);
    matCarapace.diffuseColor = new Color3(0.12, 0.20, 0.32);
    matCarapace.specularColor = new Color3(0.4, 0.9, 1.0);
    const carapace = MeshBuilder.CreateSphere(
      "droneCarapace",
      { diameterX: 0.95, diameterY: 0.45, diameterZ: 0.8, segments: 12 },
      this.scene
    );
    carapace.position.set(-0.1, 0.22, 0);
    carapace.material = matCarapace;
    carapace.parent = this.root3D;

    // 2. Glowing Optical Visor (Eyes)
    const matVisor = new StandardMaterial("matDroneVisor", this.scene);
    matVisor.diffuseColor = new Color3(0, 1, 1);
    matVisor.emissiveColor = new Color3(0.1, 0.95, 1.0); // Bright Neon Glow
    const visor = MeshBuilder.CreateSphere(
      "droneVisor",
      { diameterX: 0.35, diameterY: 0.22, diameterZ: 0.5, segments: 12 },
      this.scene
    );
    visor.position.set(0.48, 0.08, 0);
    visor.material = matVisor;
    visor.parent = this.root3D;

    // 3. Plasma Thruster Nozzle at Rear
    const matThruster = new StandardMaterial("matDroneThruster", this.scene);
    matThruster.diffuseColor = new Color3(0.2, 0.25, 0.3);
    matThruster.specularColor = new Color3(0.8, 0.8, 0.9);
    const thruster = MeshBuilder.CreateCylinder(
      "droneThruster",
      { diameterTop: 0.42, diameterBottom: 0.28, height: 0.35, tessellation: 16 },
      this.scene
    );
    thruster.rotation.z = Math.PI / 2;
    thruster.position.set(-0.62, 0.02, 0);
    thruster.material = matThruster;
    thruster.parent = this.root3D;

    // Plasma Flame Cone
    const matFlame = new StandardMaterial("matDroneFlame", this.scene);
    matFlame.diffuseColor = new Color3(0.1, 0.6, 1.0);
    matFlame.emissiveColor = new Color3(0.2, 0.85, 1.0);
    matFlame.alpha = 0.85;
    this.flameMesh = MeshBuilder.CreateCylinder(
      "droneFlame",
      { diameterTop: 0.25, diameterBottom: 0.02, height: 0.65, tessellation: 12 },
      this.scene
    );
    this.flameMesh.rotation.z = -Math.PI / 2;
    this.flameMesh.position.set(-0.95, 0.02, 0);
    this.flameMesh.material = matFlame;
    this.flameMesh.parent = this.root3D;

    // 4. Dual Holographic Energy Wings
    const matWing = new StandardMaterial("matDroneWing", this.scene);
    matWing.diffuseColor = new Color3(0.0, 0.8, 1.0);
    matWing.emissiveColor = new Color3(0.1, 0.7, 0.95);
    matWing.alpha = 0.78;
    matWing.backFaceCulling = false;

    // Front Wing (+Z side)
    this.wingFront = MeshBuilder.CreatePlane("wingFront", { width: 0.95, height: 0.5 }, this.scene);
    this.wingFront.material = matWing;
    this.wingFront.position.set(-0.05, 0.2, 0.38);
    this.wingFront.rotation.y = 0.25;
    this.wingFront.parent = this.root3D;

    // Back Wing (-Z side)
    this.wingBack = MeshBuilder.CreatePlane("wingBack", { width: 0.95, height: 0.5 }, this.scene);
    this.wingBack.material = matWing;
    this.wingBack.position.set(-0.05, 0.2, -0.38);
    this.wingBack.rotation.y = -0.25;
    this.wingBack.parent = this.root3D;

    // Default angle: tilt slightly toward camera (+X roll) to highlight 3D volume
    this.root3D.rotation.x = 0.25;
    this.wingFlapPhase = 0;
  }

  public updateAnimation(deltaMs: number, isDivingFast: boolean = false) {
    if (this.currentConfig.is3D) {
      // 3D Procedural Animation Loop
      const deltaSec = deltaMs / 1000;
      const flapFrequency = isDivingFast ? 14 : 26; // Rapid buzzing wing beats
      this.wingFlapPhase += deltaSec * flapFrequency;

      if (this.wingFront && this.wingBack) {
        const flapAngle = Math.sin(this.wingFlapPhase) * 0.65;
        this.wingFront.rotation.x = 0.2 + flapAngle;
        this.wingBack.rotation.x = -0.2 - flapAngle;
      }

      if (this.flameMesh) {
        // Dynamic plasma flicker
        const flicker = 0.85 + Math.random() * 0.35;
        this.flameMesh.scaling.x = flicker * (isDivingFast ? 0.6 : 1.15);
      }
    } else {
      // 2D Sprite Frame Cycle
      if (!this.material || this.textures.length <= 1) return;

      const frameRate = isDivingFast
        ? this.currentConfig.frameDurationMs * 2.2
        : this.currentConfig.frameDurationMs;
      this.animationTimerMs += deltaMs;

      if (this.animationTimerMs >= frameRate) {
        this.animationTimerMs = 0;
        this.currentFrameIndex = (this.currentFrameIndex + 1) % this.textures.length;
        this.material.diffuseTexture = this.textures[this.currentFrameIndex];
      }
    }
  }

  public setPosition(x: number, y: number) {
    if (this.root3D) {
      this.root3D.position.x = x;
      this.root3D.position.y = y;
    }
    if (this.planeMesh) {
      this.planeMesh.position.x = x;
      this.planeMesh.position.y = y;
    }
  }

  public setRotation(angleRad: number) {
    if (this.root3D) {
      this.root3D.rotation.z = angleRad;
      // Slight pitch & bank roll
      this.root3D.rotation.y = angleRad * 0.3;
    }
    if (this.planeMesh) {
      this.planeMesh.rotation.z = angleRad;
    }
  }

  public setVisible(visible: boolean) {
    if (this.root3D) {
      this.root3D.setEnabled(visible);
    }
    if (this.planeMesh) {
      this.planeMesh.isVisible = visible;
    }
  }
}
