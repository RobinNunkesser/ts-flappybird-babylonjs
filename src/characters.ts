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
      "./assets/characters/owl2.png" // Ping-pong smooth recovery loop
    ],
    frameDurationMs: 95,
    hitRadius: 0.48,
    width: 1.35,
    height: 1.35,
    particleColor: [0.95, 0.65, 0.15],
    description: "Weg B: KI-generiertes 2D-Spritesheet (Pixel-Art im Freiflug ohne Ast)"
  },
  {
    id: "cyber_drone",
    name: "Cyber-Drohne (3D)",
    previewUrl: "./assets/characters/drone_preview.png",
    frameUrls: [],
    frameDurationMs: 50,
    hitRadius: 0.46,
    width: 1.3,
    height: 1.1,
    particleColor: [0.0, 0.9, 1.0],
    description: "Weg A: Detaillierter 3D-Käfer mit 4 Flügeln, Doppeldüsen & Fühlern",
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
  private forewingLeft: Mesh | null = null;
  private forewingRight: Mesh | null = null;
  private hindwingLeft: Mesh | null = null;
  private hindwingRight: Mesh | null = null;
  private flameLeft: Mesh | null = null;
  private flameRight: Mesh | null = null;
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
      this.forewingLeft = null;
      this.forewingRight = null;
      this.hindwingLeft = null;
      this.hindwingRight = null;
      this.flameLeft = null;
      this.flameRight = null;
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

  // --- Weg A / Hochdetaillierter 3D Cyberpunk Drone Beetle ---
  private build3DProceduralDrone() {
    this.root3D = new Mesh("playerRoot3D", this.scene);

    // --- Materials System ---
    // 1. Dark Carbon Titanium (Main Chassis)
    const matChassis = new StandardMaterial("matChassis", this.scene);
    matChassis.diffuseColor = new Color3(0.08, 0.11, 0.16);
    matChassis.specularColor = new Color3(0.3, 0.8, 1.0);
    matChassis.specularPower = 32;

    // 2. High-Tech Armor Carapace (Upper beetle shell)
    const matArmor = new StandardMaterial("matArmor", this.scene);
    matArmor.diffuseColor = new Color3(0.12, 0.22, 0.35);
    matArmor.specularColor = new Color3(0.6, 0.95, 1.0);
    matArmor.specularPower = 48;

    // 3. Glowing Laser Cyan (Eyes, Antennae Bulbs, Power Conduit Lines)
    const matNeon = new StandardMaterial("matNeon", this.scene);
    matNeon.diffuseColor = new Color3(0.0, 1.0, 1.0);
    matNeon.emissiveColor = new Color3(0.2, 0.95, 1.0);

    // 4. Gold / Brass Mechanical Joints
    const matBrass = new StandardMaterial("matBrass", this.scene);
    matBrass.diffuseColor = new Color3(0.85, 0.65, 0.18);
    matBrass.specularColor = new Color3(1.0, 0.9, 0.5);

    // 5. Twin Jet Nacelles (Brushed Dark Alloy)
    const matThruster = new StandardMaterial("matThruster", this.scene);
    matThruster.diffuseColor = new Color3(0.18, 0.20, 0.24);
    matThruster.specularColor = new Color3(0.8, 0.9, 1.0);

    // 6. Holographic Wing Membrane (Translucent with Cyan Energy Veins)
    const matHoloWing = new StandardMaterial("matHoloWing", this.scene);
    matHoloWing.diffuseColor = new Color3(0.05, 0.85, 1.0);
    matHoloWing.emissiveColor = new Color3(0.15, 0.75, 0.95);
    matHoloWing.alpha = 0.72;
    matHoloWing.backFaceCulling = false;

    // 7. Pulsing Plasma Flames
    const matPlasma = new StandardMaterial("matPlasma", this.scene);
    matPlasma.diffuseColor = new Color3(0.1, 0.7, 1.0);
    matPlasma.emissiveColor = new Color3(0.3, 0.95, 1.0);
    matPlasma.alpha = 0.85;

    // --- 1. SEGMENTED THORAX & ABDOMEN ---
    // Main fuselage capsule
    const fuselage = MeshBuilder.CreateSphere(
      "fuselage",
      { diameterX: 1.25, diameterY: 0.62, diameterZ: 0.72, segments: 16 },
      this.scene
    );
    fuselage.material = matChassis;
    fuselage.parent = this.root3D;

    // Upper Ribbed Carapace Shell (Front & Back segments)
    const carapaceFront = MeshBuilder.CreateSphere(
      "carapaceFront",
      { diameterX: 0.75, diameterY: 0.38, diameterZ: 0.78, segments: 14 },
      this.scene
    );
    carapaceFront.position.set(0.08, 0.20, 0);
    carapaceFront.material = matArmor;
    carapaceFront.parent = this.root3D;

    const carapaceRear = MeshBuilder.CreateSphere(
      "carapaceRear",
      { diameterX: 0.7, diameterY: 0.35, diameterZ: 0.74, segments: 14 },
      this.scene
    );
    carapaceRear.position.set(-0.35, 0.16, 0);
    carapaceRear.material = matArmor;
    carapaceRear.parent = this.root3D;

    // Center Spine / Power Core Conduit
    const powerCore = MeshBuilder.CreateCylinder(
      "powerCore",
      { diameter: 0.18, height: 0.75, tessellation: 12 },
      this.scene
    );
    powerCore.rotation.z = Math.PI / 2;
    powerCore.position.set(-0.12, 0.32, 0);
    powerCore.material = matNeon;
    powerCore.parent = this.root3D;

    // --- 2. HEAD, COMPOUND EYES & ANTENNAE ---
    const head = MeshBuilder.CreateSphere(
      "droneHead",
      { diameterX: 0.45, diameterY: 0.36, diameterZ: 0.42, segments: 14 },
      this.scene
    );
    head.position.set(0.55, 0.04, 0);
    head.material = matChassis;
    head.parent = this.root3D;

    // Twin Faceted Insectoid Eyes (+Z and -Z)
    const eyeLeft = MeshBuilder.CreateSphere(
      "eyeLeft",
      { diameterX: 0.22, diameterY: 0.20, diameterZ: 0.22, segments: 10 },
      this.scene
    );
    eyeLeft.position.set(0.66, 0.10, 0.16);
    eyeLeft.material = matNeon;
    eyeLeft.parent = this.root3D;

    const eyeRight = MeshBuilder.CreateSphere(
      "eyeRight",
      { diameterX: 0.22, diameterY: 0.20, diameterZ: 0.22, segments: 10 },
      this.scene
    );
    eyeRight.position.set(0.66, 0.10, -0.16);
    eyeRight.material = matNeon;
    eyeRight.parent = this.root3D;

    // Twin Articulated Cyber Antennae with Glowing Sensor Bulbs
    for (const side of [1, -1]) {
      const antShaft = MeshBuilder.CreateCylinder(
        `antShaft_${side}`,
        { diameter: 0.035, height: 0.35, tessellation: 8 },
        this.scene
      );
      antShaft.rotation.z = -0.55;
      antShaft.rotation.y = side * 0.35;
      antShaft.position.set(0.72, 0.22, side * 0.12);
      antShaft.material = matBrass;
      antShaft.parent = this.root3D;

      const antBulb = MeshBuilder.CreateSphere(
        `antBulb_${side}`,
        { diameter: 0.08, segments: 8 },
        this.scene
      );
      antBulb.position.set(0.82, 0.35, side * 0.18);
      antBulb.material = matNeon;
      antBulb.parent = this.root3D;
    }

    // Front Mandibles / Pincers
    for (const side of [1, -1]) {
      const mandible = MeshBuilder.CreateCylinder(
        `mandible_${side}`,
        { diameterTop: 0.02, diameterBottom: 0.06, height: 0.24, tessellation: 8 },
        this.scene
      );
      mandible.rotation.z = 1.2;
      mandible.rotation.y = side * 0.4;
      mandible.position.set(0.72, -0.06, side * 0.10);
      mandible.material = matBrass;
      mandible.parent = this.root3D;
    }

    // --- 3. TWIN VECTOR PLASMA THRUSTERS (Left & Right) ---
    for (const side of [1, -1]) {
      // Nacelle body
      const nacelle = MeshBuilder.CreateCylinder(
        `nacelle_${side}`,
        { diameter: 0.30, height: 0.55, tessellation: 16 },
        this.scene
      );
      nacelle.rotation.z = Math.PI / 2;
      nacelle.position.set(-0.52, 0.02, side * 0.34);
      nacelle.material = matThruster;
      nacelle.parent = this.root3D;

      // Nacelle intake rim (brass trim)
      const nacelleRim = MeshBuilder.CreateCylinder(
        `nacelleRim_${side}`,
        { diameter: 0.34, height: 0.10, tessellation: 16 },
        this.scene
      );
      nacelleRim.rotation.z = Math.PI / 2;
      nacelleRim.position.set(-0.30, 0.02, side * 0.34);
      nacelleRim.material = matBrass;
      nacelleRim.parent = this.root3D;

      // Exhaust Nozzle
      const nozzle = MeshBuilder.CreateCylinder(
        `nozzle_${side}`,
        { diameterTop: 0.26, diameterBottom: 0.16, height: 0.15, tessellation: 16 },
        this.scene
      );
      nozzle.rotation.z = -Math.PI / 2;
      nozzle.position.set(-0.80, 0.02, side * 0.34);
      nozzle.material = matNeon;
      nozzle.parent = this.root3D;

      // Plasma Jet Flame Cone
      const flame = MeshBuilder.CreateCylinder(
        `flame_${side}`,
        { diameterTop: 0.22, diameterBottom: 0.02, height: 0.55, tessellation: 12 },
        this.scene
      );
      flame.rotation.z = -Math.PI / 2;
      flame.position.set(-1.08, 0.02, side * 0.34);
      flame.material = matPlasma;
      flame.parent = this.root3D;

      if (side === 1) this.flameLeft = flame;
      else this.flameRight = flame;
    }

    // --- 4. TUCKED INSECTOID CYBER-LEGS (3 pairs under body) ---
    for (const side of [1, -1]) {
      for (let legIdx = 0; legIdx < 3; legIdx++) {
        const xPos = 0.30 - legIdx * 0.32;
        const legJoint = MeshBuilder.CreateSphere(
          `legJoint_${side}_${legIdx}`,
          { diameter: 0.08, segments: 8 },
          this.scene
        );
        legJoint.position.set(xPos, -0.22, side * 0.28);
        legJoint.material = matBrass;
        legJoint.parent = this.root3D;

        const legSegment = MeshBuilder.CreateCylinder(
          `legSeg_${side}_${legIdx}`,
          { diameter: 0.035, height: 0.28, tessellation: 8 },
          this.scene
        );
        legSegment.rotation.z = -0.4;
        legSegment.rotation.x = side * 0.6;
        legSegment.position.set(xPos - 0.06, -0.32, side * 0.36);
        legSegment.material = matChassis;
        legSegment.parent = this.root3D;
      }
    }

    // --- 5. 4 ARTICULATED HOLOGRAPHIC ENERGY WINGS ---
    // Forewing Left (+Z front)
    this.forewingLeft = MeshBuilder.CreatePlane("forewingLeft", { width: 1.05, height: 0.46 }, this.scene);
    this.forewingLeft.material = matHoloWing;
    this.forewingLeft.position.set(0.08, 0.24, 0.36);
    this.forewingLeft.rotation.y = 0.22;
    this.forewingLeft.parent = this.root3D;

    // Forewing Right (-Z rear)
    this.forewingRight = MeshBuilder.CreatePlane("forewingRight", { width: 1.05, height: 0.46 }, this.scene);
    this.forewingRight.material = matHoloWing;
    this.forewingRight.position.set(0.08, 0.24, -0.36);
    this.forewingRight.rotation.y = -0.22;
    this.forewingRight.parent = this.root3D;

    // Hindwing Left (+Z front, smaller, offset)
    this.hindwingLeft = MeshBuilder.CreatePlane("hindwingLeft", { width: 0.85, height: 0.38 }, this.scene);
    this.hindwingLeft.material = matHoloWing;
    this.hindwingLeft.position.set(-0.25, 0.18, 0.38);
    this.hindwingLeft.rotation.y = 0.35;
    this.hindwingLeft.parent = this.root3D;

    // Hindwing Right (-Z rear)
    this.hindwingRight = MeshBuilder.CreatePlane("hindwingRight", { width: 0.85, height: 0.38 }, this.scene);
    this.hindwingRight.material = matHoloWing;
    this.hindwingRight.position.set(-0.25, 0.18, -0.38);
    this.hindwingRight.rotation.y = -0.35;
    this.hindwingRight.parent = this.root3D;

    // Overall 3D presentation tilt: +X roll so camera sees top details, carapace & twin jets
    this.root3D.rotation.x = 0.28;
    this.wingFlapPhase = 0;
  }

  public updateAnimation(deltaMs: number, isDivingFast: boolean = false) {
    if (this.currentConfig.is3D) {
      // 3D Procedural Multi-Wing Animation
      const deltaSec = deltaMs / 1000;
      const flapSpeed = isDivingFast ? 16 : 30; // High-frequency cyber buzzing
      this.wingFlapPhase += deltaSec * flapSpeed;

      const flapAngle = Math.sin(this.wingFlapPhase) * 0.72;
      const hindFlapAngle = Math.sin(this.wingFlapPhase - 0.45) * 0.62;

      // Forewings flap in counter-oscillation
      if (this.forewingLeft) this.forewingLeft.rotation.x = 0.25 + flapAngle;
      if (this.forewingRight) this.forewingRight.rotation.x = -0.25 - flapAngle;

      // Hindwings flap with harmonic phase delay
      if (this.hindwingLeft) this.hindwingLeft.rotation.x = 0.30 + hindFlapAngle;
      if (this.hindwingRight) this.hindwingRight.rotation.x = -0.30 - hindFlapAngle;

      // Dynamic twin plasma flame flickering
      const baseFlameScale = isDivingFast ? 0.65 : 1.15;
      const flicker = baseFlameScale * (0.85 + Math.random() * 0.3);
      if (this.flameLeft) this.flameLeft.scaling.x = flicker;
      if (this.flameRight) this.flameRight.scaling.x = flicker * (0.95 + Math.random() * 0.1);
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
      // Banking reaction: pitch tilts roll slightly towards camera
      this.root3D.rotation.x = 0.28 + angleRad * 0.15;
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
